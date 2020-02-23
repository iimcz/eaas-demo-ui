import {stopClient} from "./utils/stop-client";
import {WaitModal} from "../../lib/task.js"

module.exports = ['$rootScope', '$scope', '$state', '$http', '$uibModal', '$stateParams', 'growl', 'localConfig', 'Objects',
                        '$timeout', '$translate', 'chosenEnv', 'REST_URLS', 'eaasClient',
                        function ($rootScope, $scope, $state, $http, $uibModal, $stateParams, growl, localConfig, Objects,
                        $timeout, $translate, chosenEnv, REST_URLS, eaasClient) {
    var vm = this;
    vm.isNetworkEnvironment = $stateParams.isNetworkEnvironment;
    vm.envId = $stateParams.envId;
    vm.config = localConfig.data;
    vm.type = $stateParams.type;
    vm.emulator = $rootScope.emulator;
    $rootScope.chosenEnv = chosenEnv;
    $scope.idsData;
    vm.printJobsAvailable = false;
    vm.showKeys = false;

    vm.mediaList = [];
    vm.removableMediaList = [];

    var objectArchive = $stateParams.objectArchive ? $stateParams.objectArchive : "default";
    var objectId = $stateParams.softwareId ? $stateParams.softwareId : $stateParams.objectId;

    if (objectId) {
        Objects.get({ archiveId: objectArchive, objectId: objectId }).$promise.then(function (response) {
            vm.mediaCollection = response.mediaItems;
            if (vm.mediaCollection)
                vm.currentMediumLabel = vm.mediaCollection.file.length > 0 ? vm.mediaCollection.file[0].localAlias : null;
        });
    }

    vm.enablePrinting = (chosenEnv == null);
    vm.enableSaveEnvironment = (chosenEnv == null);
    vm.isKVM = false;
    vm.waitModal = new WaitModal($uibModal);
    if (chosenEnv)
    {
        vm.enablePrinting = chosenEnv.enablePrinting;
        vm.shutdownByOs = chosenEnv.shutdownByOs;
        if(chosenEnv.nativeConfig)
            vm.isKVM = chosenEnv.nativeConfig.includes('-enable-kvm');

        if(chosenEnv.drives)
        {
            for(let d of chosenEnv.drives)
            {
                if(d.type === 'disk')
                    vm.enableSaveEnvironment = true;
            }
        }
        else
            vm.enableSaveEnvironment = true; // fallback to old metadata
    }

    if(vm.enablePrinting) {
        $rootScope.$on('emulatorStart', function(event, args) {
            eaasClient.eventSource.addEventListener('print-job', function(e) {
                var obj = JSON.parse(e.data);
                if (!obj) {
                    console.warn('Parsing print-job notification failed!');
                    return;
                }

                if (obj.status === 'done') {
                    vm.printJobsAvailable = true;
                    growl.info($translate.instant('ACTIONS_PRINT_READY') + ': ' + obj.filename);
                }
                else if (obj.status === 'failed') {
                    growl.warning($translate.instant('ACTIONS_PRINT_FAILED') + ': ' + obj.filename);
                }
            });
        });
    }

   $scope.screenshot = function () {
        var canvas = document.getElementsByTagName("canvas")[0];
        canvas.toBlob(function(blob) {
            saveAs(blob, "screenshot.png");
        });
     };

    vm.toggleKeyboard = function()
    {
        if(!vm.showKeys) {
            $("#emulator-keys").show();
            $("emulator-kbd").show();
            var elem = document.querySelector('#emulator-kbd');
            console.log(elem);
            elem.style.visibility = 'visible';

            vm.showKeys = true;
        } 
        else {
            $("#emulator-keys").hide();
            $("emulator-kbd").hide();
            var elem = document.querySelector('#emulator-kbd');
            console.log(elem);
            elem.style.visibility = 'hidden';
            vm.showKeys = false;
        }
    }

    vm.openPrintDialog = function () {
        eaasClient.getPrintJobs(printSuccessFn);
    };

    vm.restartEmulator = function () {
        eaasClient.release();
        $state.reload();
    };

    vm.sendEsc = function () {
        eaasClient.sendEsc();
    };

    vm.sendCtrlAltDel = function () {
        eaasClient.sendCtrlAltDel();
    };

    vm.close = function () {
        window.onbeforeunload = null;
        $state.go('admin.standard-envs-overview', {}, { reload: true });
    };

    var printSuccessFn = function (data) {
        $uibModal.open({
            animation: true,
            template: require('./modals/printed-list.html'),
            controller: ["$scope", function ($scope) {
                this.printJobs = data;

                this.download = async function (label) {
                    let _header = localStorage.getItem('id_token') ? { "Authorization": "Bearer " + localStorage.getItem('id_token') } : {};
                    const pdf = await fetch(eaasClient.downloadPrint(label), {
                        headers: _header,
                    });
                    const pdfBlob = await pdf.blob();
                    window.open(URL.createObjectURL(pdfBlob));
                }
            }],
            controllerAs: "openPrintDialogCtrl"
        });
        // window.open(eaasClient.getPrintUrl());
    };

    vm.stopEmulator = function () {
        $uibModal.open({
            animation: true,
            template: require('./modals/confirm-stop.html'),
            controller: ['$scope', function($scope) {
                this.confirmed = function() {
                    window.onbeforeunload = null;
                    stopClient($uibModal, false, eaasClient);
                    $('#emulator-stopped-container').show();

                    if($stateParams.isTestEnv)
                    {
                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                            envId: vm.envId,
                            deleteMetaData: true,
                            deleteImage: true
                        }).then(function(response) {
                            if (response.data.status === "0") {
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            }
                        });
                    }
                    else if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                        $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                    else
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                };
            }],
            controllerAs: "confirmStopDialogCtrl"
        });
    };

    var eaasClientReadyTimer = function() {
        if ((eaasClient !== undefined) && (eaasClient.driveId !== undefined) && (eaasClient.driveId !== null)) {
            vm.driveId = eaasClient.driveId;
            vm.removableMediaList = eaasClient.removableMediaList;
            vm.mediaList = [];

            if(vm.removableMediaList && vm.removableMediaList.length) {
                
                for(let i = 0; i < vm.removableMediaList.length; i++)
                {
                    let mediaItem = {};
                    let element = vm.removableMediaList[i];
                    mediaItem.driveId = element.driveIndex;
                    Objects.get({archiveId: element.archive, objectId: element.id}).$promise.then(function(response) {
                        mediaItem.mediaCollection = response.mediaItems;
                        mediaItem.objectId = element.id;
                        mediaItem.archive = element.archive;
                        if(mediaItem.mediaCollection) 
                        {
                            mediaItem.currentMediumLabel = mediaItem.mediaCollection.file.length > 0 ? mediaItem.mediaCollection.file[0].localAlias : null;
                            mediaItem.chosen_medium_label = mediaItem.currentMediumLabel;
                            mediaItem.media = mediaItem.mediaCollection.file;
                            mediaItem.mediumTypes = [];
                            for(var i = 0; i < mediaItem.media.length; i++)
                            {
                                if(!mediaItem.mediumTypes.includes(mediaItem.media[i].type))
                                {
                                    mediaItem.mediumTypes.push(mediaItem.media[i].type);
                                }
                            }
                        }
                    });
                    vm.mediaList.push(mediaItem);
                }
            }
                return;
        }
        $timeout(eaasClientReadyTimer, 500);
    };
    $timeout(eaasClientReadyTimer, 500);

    vm.openChangeMediaDialog = function() {
        $uibModal.open({
            animation: true,
            template: require('./modals/change-media.html'),
            controller: ["$scope", function($scope) {
                this.mediaList = vm.mediaList;
                this.entriesByMedia = function(i, m)
                {
                    let mediaItem = vm.mediaList[i];
                    let result = [];
                    if(!mediaItem)
                        return result;

                    for(var _i = 0; _i < mediaItem.media.length; _i++)
                    {
                        if(mediaItem.media[_i].type === m)
                             result.push(mediaItem.media[_i]);
                    }
                    return result;
                }
                    
                this.isChangeMediaSubmitting = false;

                this.changeMedium = function(i) {

                    let mediaItem = vm.mediaList[i];
                    if (mediaItem.chosen_medium_label == null) {
                        growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                        return;
                    }
                    
                    this.isChangeMediaSubmitting = true;
                    var postObj = {};
                    postObj.objectId = mediaItem.objectId;
                    postObj.driveId = mediaItem.driveId;
                    postObj.label = mediaItem.chosen_medium_label;

                    var changeSuccsessFunc = function(data, status) {
                        growl.success($translate.instant('JS_MEDIA_CHANGETO') + mediaItem.chosen_medium_label);
                        mediaItem.currentMediumLabel = mediaItem.chosen_medium_label;
                        $scope.$close();
                        $("html, body").removeClass("wait");
                    };

                    $("html, body").addClass("wait");
                    eaasClient.changeMedia(postObj, changeSuccsessFunc);
                };
            }],
            controllerAs: "openChangeMediaDialogCtrl"
        });
    };

        vm.checkpoint = function () {
            window.onbeforeunload = null;
            jQuery.when(
                eaasClient.disconnect(),
                jQuery.Deferred(function (deferred) {
                    jQuery(deferred.resolve);
                })).done(function () {
                    eaasClient.checkpoint({
                        type: "newEnvironment",
                        envId: vm.envId,
                    }).then(function (newEnvId) {
                        if (!newEnvId) {
                            growl.error(status, { title: "Snapshot failed" });
                            $state.go('admin.standard-envs-overview', {}, { reload: true });
                            eaasClient.release();
                        }
                        console.log("Checkpointed environment saved as: " + newEnvId);
                        growl.success(status, { title: "New snapshot created." });
                        eaasClient.release();
                        $state.go('admin.edit-env', { envId: newEnvId, objEnv: $stateParams.returnToObjects }, { reload: true });
                    });
                });
        };

        vm.switchEmulators = function (component) {
            vm.envId = component.env.data.environment;
            var eaasClient = eaasClient;
            let loadingElement = $("#emulator-loading-connections");
            $("#emulator-container").hide();

            var attr = loadingElement.attr('width');
            loadingElement.attr("hidden", false);


            jQuery.when(
                eaasClient.disconnect(),
                jQuery.Deferred(function (deferred) {
                    jQuery(deferred.resolve);
                })).done(function () {


                    eaasClient.componentId = component.id;

                    eaasClient.connect().then(function () {
                        jQuery.when(
                            loadingElement.animate({ width: "100%" }, 700),
                            jQuery.Deferred(function (deferred) {
                                jQuery(deferred.resolve);
                            })).done(function () {
                                loadingElement.attr("hidden", true);
                            });


                        $("#emulator-container").show();
                        $rootScope.emulator.mode = eaasClient.mode;
                        $scope.$apply();
                        //                if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) (async () => {
                        //                    var url = new URL(eaasClient.networkTcpInfo.replace(/^info/, 'http'));
                        //                    var pathArray = url.pathname.split('/');
                        //                    document.querySelector("#emulator-info-container").append(
                        //                        Object.assign(document.createElement("a"),
                        //                            {textContent: `connect to: ${url.hostname} protocol ${pathArray[1]} port ${pathArray[2]}`,
                        //                                href: `http://${url.hostname}:${pathArray[2]}`,
                        //                                target: "_blank", rel: "noopener"}),
                        //                        ' // ',
                        //                        Object.assign(document.createElement("a"),
                        //                            {textContent: "start eaas-proxy", href: await eaasClient.getProxyURL(),
                        //                                target: "_blank",}),
                        //                    );
                        //                })();

                        if (eaasClient.params.pointerLock === "true") {
                            growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                            BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                        }

                        // Fix to close emulator on page leave
                        $scope.$on('$locationChangeStart', function (event) {
                            eaasClient.release();
                        });

                    });

                });
        };

        vm.openNetworkDialog = function () {
            $uibModal.open({
                animation: true,
                template: require('../../../../../landing-page/src/app/modules/client/landing-page/modals/network.html'),
                resolve: {
                    currentEnv: function () {
                        return chosenEnv;
                    },
                    localConfig: function () {
                        return localConfig;
                    },
                    eaasClient: () => eaasClient
                },
                controller: "NetworkModalController as networkModalCtrl"
            });
        };

        vm.openDetachDialog = function () {
            $('#emulator-container').hide();
            let modal = $uibModal.open({
                animation: false,
                template: require('../../../../../landing-page/src/app/modules/client/landing-page/modals/detach.html'),
                resolve: {
                    currentEnv: function () {
                        return chosenEnv;
                    },
                    localConfig: function () {
                        return localConfig;
                    },
                    eaasClient: () => eaasClient,
                },
                controller: "DetachModalController as detachModalCtrl"
            });
            modal.closed.then(() => $('#emulator-container').show());
        };

    vm.openSaveEnvironmentDialog = function() {
        $('#emulator-container').hide();
        var saveDialog = function()
        {
            let modal = $uibModal.open({
                animation: false,
                template: require('./modals/save-environment.html'),
                controller: ["$scope", function($scope) {
                    this.type = $stateParams.type;
                    if(!this.type)
                        alert("ERROR: invalid type");

                    this.isSavingEnvironment = false;
                    this.isRelativeMouse = false;

                    this.saveEnvironment = function() {


                        this.isSavingEnvironment = true;
                        window.onbeforeunload = null;

                        var postReq = {};
                        postReq.type = this.type;
//                        if(postReq.type === 'objectEnvironment')
//                            postReq.embeddedObject = true;
                        postReq.envId = (eaasClient.realEnvId) ? eaasClient.realEnvId : vm.envId;
                        postReq.message = this.envDescription;
                        postReq.title = this.envName;
                        postReq.softwareId = $stateParams.softwareId;
                        postReq.objectId = $stateParams.objectId;
                        postReq.userId = $stateParams.userId;
                        postReq.isRelativeMouse = this.isRelativeMouse;
                        postReq.cleanRemovableDrives = !this.cleanRemovableDrives;

                        var snapshotDoneFunc2 = () =>{
                            vm.waitModal.hide();
                            eaasClient.realEnvId = undefined;
                            eaasClient.release();
                            if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                            else
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            $scope.$close();
                            window.isSavingEnvironment = false;
                        }

                        var snapshotDoneFunc = (data, status) => {
                            console.log("error status: " + status);

                            if(status === '1') {
                                console.log("error message: " + data.message);

                                snapshotErrorFunc(data.message);
                                return;
                            }           

                            if(eaasClient.realEnvId) {
                                $.ajax({
                                    type: "DELETE",
                                    url: localConfig.data.eaasBackendURL + "sessions/" + eaasClient._groupId + "/resources",
                                    headers: localStorage.getItem('id_token') ? {"Authorization" : "Bearer " + localStorage.getItem('id_token')} : {},
                                    async: true,
                                    contentType: "application/json",
                                    data: JSON.stringify([vm.envId])
                                }).then(function (data, status, xhr) {
                                    snapshotDoneFunc2();
                                })
                            }
                            else
                                snapshotDoneFunc2();
                            
                        };

                        var snapshotErrorFunc = error => {
                            console.log("given error: " + error);
                            growl.error(error, {title: 'Error ' + error});
                            if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                            else
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            $scope.$close();
                            window.isSavingEnvironment = false;
                        };
                        vm.waitModal.show("Saving... ", "Please wait while session data is stored. This may take a while...");
                        eaasClient.snapshot(postReq, snapshotDoneFunc, snapshotErrorFunc);
                        $('#emulator-container').show();
                    };
                    this.showEmu = function() {
                        $('#emulator-container').show();
                    }
                }],
                controllerAs: "openSaveEnvironmentDialogCtrl"
            });
            modal.closed.then(() => $('#emulator-container').show());
        };

        let modal = $uibModal.open({
            animation: false,
            template: require('./modals/confirm-snapshot.html'),
            controller: ["$scope", function($scope) {
                this.confirmed = function()
                {
                    saveDialog();
                };
                this.showEmu = function() {
                    $('#emulator-container').show();
                }
            }],
            controllerAs: "confirmSnapshotDialogCtrl"
        });
        modal.closed.then(() => $('#emulator-container').show());


    }
    /*
    var closeEmulatorOnTabLeaveTimer = null;
    var leaveWarningShownBefore = false;
    var deregisterOnPageFocused = $pageVisibility.$on('pageFocused', function() {
        $timeout.cancel(closeEmulatorOnTabLeaveTimer);
    });

    var deregisterOnPageBlurred = $pageVisibility.$on('pageBlurred', function() {
        if (!leaveWarningShownBefore) {
            $window.alert($translate.instant('JS_EMU_LEAVE_PAGE'));
            leaveWarningShownBefore = true;
        }

        closeEmulatorOnTabLeaveTimer = $timeout(function() {
            vm.stopEmulator();
        }, 3 * 60 * 1000);
    });

    $scope.$on("$destroy", function() {
        deregisterOnPageFocused();
        deregisterOnPageBlurred();
    });
    */
}];
