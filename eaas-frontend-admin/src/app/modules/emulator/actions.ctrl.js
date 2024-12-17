import {stopClient} from "./utils/stop-client";
import {WaitModal} from "../../lib/task.js";
import { saveAs } from 'file-saver';
import { _fetch, ClientError, confirmDialog } from "../../lib/utils";
import {sendCtrlAltDel, sendEsc, SnapshotRequestBuilder, requestPointerLock} from "EaasClient/eaas-client";

module.exports = ['$rootScope', '$scope', '$state', '$uibModal', '$stateParams', 'growl', 'localConfig', 'Objects',
                        '$timeout', '$translate', 'chosenEnv', 'eaasClient',
                        function ($rootScope, $scope, $state, $uibModal, $stateParams, growl, localConfig, Objects,
                        $timeout, $translate, chosenEnv, eaasClient) {
    var vm = this;
    vm.isNetworkEnvironment = $stateParams.isNetworkEnvironment;
    
    vm.config = localConfig.data;
    vm.type = $stateParams.type;
    vm.emulator = $rootScope.emulator;
    $rootScope.chosenEnv = chosenEnv;
    vm.printJobsAvailable = false;
    vm.showKeys = false;
    vm.showQemu = false;

    vm.mediaList = [];
    vm.removableMediaList = [];

    if($stateParams.uvi)
    {
        vm.objEnvironments = $stateParams.uvi.environments;
    }
    else 
        vm.objEnvironments = [];

    /*
    var objectArchive = $stateParams.objectArchive ? $stateParams.objectArchive : "default";
    var objectId = $stateParams.softwareId ? $stateParams.softwareId : $stateParams.objectId;

    if (objectId) {
        Objects.get({ archiveId: objectArchive, objectId: objectId }).$promise.then(function (response) {
            vm.mediaCollection = response.mediaItems;
            if (vm.mediaCollection)
                vm.currentMediumLabel = vm.mediaCollection.file.length > 0 ? vm.mediaCollection.file[0].localAlias : null;
        });
    }
    */

    vm.enablePrinting = (chosenEnv == null);
    vm.enableSaveEnvironment = (chosenEnv == null);
    vm.isKVM = false;
    vm.waitModal = new WaitModal($uibModal);
    
    /*
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
    */

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
            let elem = document.querySelector('#emulator-kbd');
            console.log(elem);
            elem.style.visibility = 'visible';

            vm.showKeys = true;
        } 
        else {
            $("#emulator-keys").hide();
            $("emulator-kbd").hide();
            let elem = document.querySelector('#emulator-kbd');
            console.log(elem);
            elem.style.visibility = 'hidden';
            vm.showKeys = false;
        }
    };

    vm.openPrintDialog = async function () {
        try {
            let result = await eaasClient.getActiveSession().getPrintJobs();
            
            $uibModal.open({
                animation: true,
                template: require('./modals/printed-list.html'),
                controller: ["$scope", function ($scope) {
                    this.printJobs = result;
                    this.download = async function (label) {
                        let _header = localStorage.getItem('id_token') ? { "Authorization": "Bearer " + localStorage.getItem('id_token') } : {};
                        const pdf = await fetch(eaasClient.getActiveSession().downloadPrint(label), {
                            headers: _header,
                        });
                        const pdfBlob = await pdf.blob();
                        window.open(URL.createObjectURL(pdfBlob));
                    };
                }],
                controllerAs: "openPrintDialogCtrl"
            });
        }
        catch(e)
        {
            console.log(e);
        }
    };

    vm.restartEmulator = async function () {
        try {
            await confirmDialog($uibModal, "Restart machine?", "Restarting the session will reset any changes made!");
            eaasClient.release(true);
            $state.reload();
        }
        catch(e)
        {
            console.log(e);
            return;
        }
    };

    vm.sendEsc = function () {
        sendEsc();
    };

    vm.sendCtrlAltDel = function () {
        sendCtrlAltDel();
    };

    vm.close = function () {
        window.onbeforeunload = null;
        eaasClient.release();
        $state.go('admin.standard-envs-overview', {}, { reload: true });
    };

    vm.openChangeEnvDialog = async function() {
        $uibModal.open({
            animation: true,
            template: require('./modals/choose-env-dialog.html'),
            controller: ["$scope", function($scope) {
                this.custom_env = null;
                this.environments = vm.objEnvironments;

                this.changeEnv = async function()
                {
                    eaasClient.release();
                    
                    let components = [];
                    let machine = EaasClientHelper.createMachine(this.custom_env.id);
                    components.push(machine);

                    if($stateParams.uvi)
                    {
                        console.log("- - - FIX ME - - -");

                 //       data.enableDownload = $stateParams.enableDownload,
                 //       data.uvi = $stateParams.uvi
                    }

                    let clientOptions = await EaasClientHelper.clientOptions(env.envId);
                $state.go("admin.emuView",  {
                    components: components, 
                    clientOptions: clientOptions
                }, {}); 
               };
            }],
            controllerAs: "changeEnvDialogCtrl"
        });
    };

    vm.stopEmulator = async function () {
        try {
            await confirmDialog($uibModal, 
                $translate.instant('CONFIRM_STOP_H'), 
                $translate.instant('CONFIRM_STOP_T'));
           
            let envId = eaasClient.getActiveSession() ? eaasClient.getActiveSession().environmentId : undefined;
            window.onbeforeunload = null;
            await stopClient($uibModal, $stateParams.enableDownload, eaasClient);
            $('#emulator-stopped-container').show();
            $state.go('admin.edit-env', {envId: envId});
        }
        catch(e)
        {
            console.log(e);
            return;
        }
    };

    var eaasClientReadyTimer = async function() {
        if (eaasClient && eaasClient.getActiveSession()) {
            vm.showQemu = eaasClient.getActiveSession().hasQemuControl();
            if(eaasClient.getActiveSession().getRemovableMediaList()) {
                vm.removableMediaList = eaasClient.getActiveSession().getRemovableMediaList();
                vm.mediaList = [];
                if(vm.removableMediaList && vm.removableMediaList.length) {
                    
                    for(let i = 0; i < vm.removableMediaList.length; i++)
                    {
                        let mediaItem = {};
                        let element = vm.removableMediaList[i];
                        mediaItem.driveId = element.driveIndex;
                        let response = await Objects.get({archiveId: element.archive, objectId: element.id}).$promise;
                        mediaItem.mediaCollection = response.mediaItems;
                        mediaItem.objectId = element.id;
                        mediaItem.archive = element.archive;
                        if(mediaItem.mediaCollection) 
                        {
                            mediaItem.currentMediumLabel = mediaItem.mediaCollection.file.length > 0 ? mediaItem.mediaCollection.file[0].localAlias : null;
                            mediaItem.chosen_medium_label = mediaItem.currentMediumLabel;
                            mediaItem.media = mediaItem.mediaCollection.file;
                            mediaItem.mediumTypes = [];
                            for(let j = 0; j < mediaItem.media.length; j++)
                            {
                                if(!mediaItem.mediumTypes.includes(mediaItem.media[j].type))
                                {
                                    mediaItem.mediumTypes.push(mediaItem.media[j].type);
                                }
                            }
                        }
                        vm.mediaList.push(mediaItem);
                    }
                }
            }
            vm.components = eaasClient.getSessions();
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
                };
                    
                this.isChangeMediaSubmitting = false;
                console.log("opened change media dialog, ok " + this.isChangeMediaSubmitting);
                this.changeMedium = async function(i) {
                    let mediaItem = vm.mediaList[i];
                    console.log("change media ok");
                    if (mediaItem.chosen_medium_label == null) {
                        growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                        return;
                    }
                    console.log(this.isChangeMediaSubmitting);
                    this.isChangeMediaSubmitting = true;
                    var postObj = {};
                    postObj.objectId = mediaItem.objectId;
                    postObj.driveId = mediaItem.driveId;
                    postObj.label = mediaItem.chosen_medium_label;

                    $("html, body").addClass("wait");
                    try {
                        let result = await eaasClient.getActiveSession().changeMedia(postObj);
                        console.log("change media result");
                        console.log(result);
                        growl.success($translate.instant('JS_MEDIA_CHANGETO') + mediaItem.chosen_medium_label);
                        mediaItem.currentMediumLabel = mediaItem.chosen_medium_label;
                        $scope.$close();
                    }
                    catch(e) {
                        console.log(e);
                    }
                    finally {
                        $("html, body").removeClass("wait");
                        this.isChangeMediaSubmitting = false;
                    }
                };
            }],
            controllerAs: "openChangeMediaDialogCtrl"
        });
    };

        vm.checkpoint = async function () {
            window.onbeforeunload = null;
            vm.waitModal.show("Creating checkpoint. This might take some time...");
            
            try { 
                let newEnvId = await eaasClient.checkpoint();
                vm.waitModal.hide();

                if (!newEnvId) {
                    growl.error(status, { title: "Snapshot failed" });
                    $state.go('admin.standard-envs-overview', {}, { reload: true }); 
                }
                else
                {
                    console.log("Checkpointed environment saved as: " + newEnvId);
                    growl.success(status, { title: "New snapshot created." });
                    $state.go('admin.edit-env', { envId: newEnvId }, { reload: true });    
                }
                eaasClient.release();
            }
            catch (e)
            {
                console.log(e);
                vm.waitModal.hide();
                console.error(e);
                const details = (e instanceof ClientError) ? e.toJson() : e.toString();
                $state.go('error', { errorMsg: { title: "Emulation Error", message: details } });
                eaasClient.release();
            }       
        };

        vm.switchEmulators = async function (component) {
           
            let loadingElement = $("#emulator-loading-connections");
            loadingElement.attr("hidden", false);
            
            await eaasClient.disconnect();
            let session = eaasClient.getSession(component.id); 
         
            await eaasClient.connect($("#emulator-container")[0], session);
            loadingElement.attr("hidden", true);
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

            if (eaasClient.getActiveSession() && eaasClient.getActiveSession().hasPointerLock()) {
                eaasClient.getActiveSession().setPointerLock();
            }

            // Fix to close emulator on page leave
            $scope.$on('$locationChangeStart', function (event) {
                eaasClient.release();
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
            let modal;
            try {
                modal = $uibModal.open({
                    animation: false,
                    template: require('../../../../../landing-page/src/app/modules/client/landing-page/modals/detach.html'),
                    resolve: {
                        currentEnv: function () {
                            return chosenEnv;
                        },
                        localConfig: function () {
                            return localConfig;
                        },
                        eaasClient: () => {
                            return eaasClient;
                        }
                    },
                    controller: "DetachModalController as detachModalCtrl"
                });
                modal.closed.then(() => $('#emulator-container').show());
            }
            finally {
                modal.close();
            }
        };

    vm.openSaveEnvironmentDialog = async function() {
        let saveDialog = function()
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
                    this.envDescription = `<p>Revision date: ${new Date().toISOString()}</p><p><br></p>`;

                    this.saveEnvironment = async function() {
                        this.isSavingEnvironment = true;
                        window.onbeforeunload = null;

                        let snapshotRequest = new SnapshotRequestBuilder(this.type);
                        snapshotRequest.setTitle(this.envName);
                        snapshotRequest.setMessage(this.envDescription);
                        snapshotRequest.enableRelativeMouse(this.isRelativeMouse);
                        snapshotRequest.removeVolatileDrives(!this.cleanRemovableDrives);

                        let result;
                        vm.waitModal.show("Saving... ", "Please wait while session data is stored. This may take a while...");
                        try {
                            result = await eaasClient.getActiveSession().createSnapshot(snapshotRequest, vm.isNetworkEnvironment); 
                            console.log(result);
                        } catch(e) {
                            console.log("given error: " + e.message);
                            growl.error(e.name, {title: 'Error ' + e.message});
                            vm.waitModal.hide();
                        }
                        finally {
                            vm.waitModal.hide();
                            eaasClient.release(true);

                            if(vm.isNetworkEnvironment)
                                $state.go('admin.networking', {}, {reload: true});
                            else 
                                $state.go('admin.edit-env', { envId: result}, { reload: true });   

                            $scope.$close();
                            window.isSavingEnvironment = false;
                        }
                        $('#emulator-container').show();
                    };

                    this.showEmu = function() {
                        $('#emulator-container').show();
                    };
                }],
                controllerAs: "openSaveEnvironmentDialogCtrl"
            });
            modal.closed.then(() => $('#emulator-container').show());
        };

        $('#emulator-container').hide();

        try {
            await confirmDialog($uibModal, 
                $translate.instant('CONFIRM_SNAPSHOT_H'), 
                $translate.instant('CONFIRM_SNAPSHOT_T'));
                saveDialog();
        }
        catch(e)
        {
            $('#emulator-container').show();
            console.log(e);
        }
        // modal.closed.then(() => $('#emulator-container').show());
    };
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

    vm.connectKeyboard = async function() {
        await eaasClient.getActiveSession().connectKeyboard();
    }

    vm.disconnectKeyboard = async function() {
        await eaasClient.getActiveSession().disconnectKeyboard();
    }

    vm.connectMouse = async function() {
        await eaasClient.getActiveSession().connectMouse();
    }

    vm.disconnectMouse = async function() {
        await eaasClient.getActiveSession().disconnectMouse();
    }
}];
