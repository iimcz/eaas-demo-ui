module.exports = function($rootScope, $scope, $window, $state, $http, $timeout, $uibModal, $stateParams, $sce,
                          mediaCollection, growl, localConfig, $translate, chosenEnv, objMetadata, objEnvironments, userSession, environmentMetaData) {

    $scope.html = '<ul><li>render me please</li></ul>';
    $scope.trustedHtml = $sce.trustAsHtml($scope.html)
    var vm = this;
    vm.objEnvironments = objEnvironments.data.environmentList;

    function showHelpDialog(helpText) {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/help-emil-dialog.html',
            controller: function($scope) {
                this.helpText = helpText;
            },
            controllerAs: "helpDialogCtrl"
        });
    }

    vm.enablePrinting = chosenEnv.data.enablePrinting;
    vm.shutdownByOs = chosenEnv.data.shutdownByOs;
    vm.emulator = $rootScope.emulator;
    vm.userCtx = $stateParams.userId;
    vm.media = mediaCollection.data.medium;

    vm.help = function() {
        showHelpDialog(chosenEnv.data.helpText);
    };

    vm.screenshot = function() {
        window.open(window.eaasClient.getScreenshotUrl());
    };

    var printSuccessFn = function(data) {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/printed-list-dialog.html',
            controller: function($scope) {
                this.printJobs = data;

                this.download = function(label)
                {
                    window.open(window.eaasClient.downloadPrint(label));
                }
            },
            controllerAs: "openPrintDialogCtrl"
        });
        // window.open(window.eaasClient.getPrintUrl());
    };

    vm.openPrintDialog = function ()
    {
        window.eaasClient.getPrintJobs(printSuccessFn);
    }

    vm.sendCtrlAltDel = function() {
        window.eaasClient.sendCtrlAltDel();
    };

    vm.saveSession = function() {

        if(window.eaasClient.getEmulatorState() != "STOPPED")
        {
            if (!window.confirm("Please make sure to shutdown the guest OS before creating derivatives")) { // $translate.instant('JS_DELENV_OK')
                return;
            }
        }

        var postReq = {};
        postReq.type = "saveUserSession";
        postReq.objectId = $stateParams.objectId;
        postReq.userId = $stateParams.userId;
        postReq.envId = $stateParams.envId;

        var waitModal = $uibModal.open({
            animation: true,
            templateUrl: 'partials/save-wait-dialog.html'
        });

        window.onbeforeunload = null;
        var snapshotDoneFunc = function(data, status) {
            waitModal.close();
            $uibModal.open({
                animation: true,
                templateUrl: 'partials/save-done-dialog.html',
                controller: function($scope) {
                    this.done = function () {
                        window.eaasClient.release();
                        $('#emulator-container').hide();
                        window.location = localConfig.data.stopEmulatorRedirectURL;
                    };

                    this.start = function() {
                        window.eaasClient.release();
                        $('#emulator-container').hide();
                        $state.go('wf-b.choose-env', {objectId : $stateParams.objectId}, {reload: true});
                    }
                },
                controllerAs: "saveSessionWaitDlg"
            });
        };
        window.eaasClient.snapshot(postReq, snapshotDoneFunc);
    }

    vm.restartEmulator = function() {

        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/confirm-restart-dialog.html',
            controller: function($scope) {
                this.isUserSession = $stateParams.isUserSession;

                this.confirmed = function(deleteUserSession)
                {
                    window.eaasClient.release();
                    if(deleteUserSession)
                    {
                        $http.get(localConfig.data.eaasBackendURL + formatStr(deleteSessionUrl, userSession.data.envId))
                            .then(function(response) {
                                $state.go('wf-b.choose-env', {objectId : $stateParams.objectId}, {reload: true});
                            });
                    }
                    else
                        $state.reload();
                };
            },
            controllerAs: "confirmRestartDialogCtrl"
        });
    };

    vm.stopEmulator = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/confirm-stop-dialog.html',
            controller: function($scope) {
                this.confirmed = function()
                {
                    window.onbeforeunload = null;
                    window.eaasClient.release();
                    $('#emulator-stopped-container').show();
                    window.location = localConfig.data.stopEmulatorRedirectURL;
                };
            },
            controllerAs: "confirmStopDialogCtrl"
        });
    };

    var currentMediumLabel = mediaCollection.data.medium.length > 0 ? mediaCollection.data.medium[0].items[0].label : null;

    var eaasClientReadyTimer = function() {
        if ((window.eaasClient !== undefined) && (window.eaasClient.driveId !== undefined) && (window.eaasClient.driveId !== null)) {
            vm.driveId = window.eaasClient.driveId;
            return;
        }

        $timeout(eaasClientReadyTimer, 100);
    };
    $timeout(eaasClientReadyTimer);

    vm.openChangeEnvDialog = function() {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/choose-env-dialog.html',
            controller: function($scope) {
                this.custom_env = null;
                this.title = objMetadata.data.title;
                this.environments = objEnvironments.data.environmentList;

                this.changeEnv= function()
                {
                    window.eaasClient.release();
                    $state.go('wf-b.emulator', {envId: this.custom_env.id});
                };
            },
            controllerAs: "changeEnvDialogCtrl"
        });
    };


    var changeMediaDlgFunc = function() {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/change-media-dialog.html',
            controller: function($scope) {
                this.chosen_medium_label = currentMediumLabel;
                this.media = mediaCollection.data.medium;
                this.isChangeMediaSubmitting = false;

                this.changeMedium = function(newMediumLabel) {
                    if (newMediumLabel == null) {
                        growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                        return;
                    }

                    var postObj = {};
                    postObj.objectId = $stateParams.objectId;
                    postObj.driveId = window.eaasClient.driveId;
                    postObj.label = newMediumLabel;

                    var changeSuccsessFunc = function(data, status) {
                        growl.success($translate.instant('JS_MEDIA_CHANGETO') + newMediumLabel);
                        currentMediumLabel = newMediumLabel;
                        $scope.$close();
                        $("html, body").removeClass("wait");
                    };

                    $("html, body").addClass("wait");
                    eaasClient.changeMedia(postObj, changeSuccsessFunc);
                };
            }
            ,
            controllerAs: "openChangeMediaDialogCtrl"
        });
    };

    var changeMediaNotAvailableDlgFunc = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/help-emil-dialog.html',
            controller: function($scope) {
                this.helpTitle = $translate.instant('CHANGEM_TITLE');
                this.helpText = $translate.instant('CHANGEM_ALT_TEXT');
            },
            controllerAs: "helpDialogCtrl"
        });
    };

    if(environmentMetaData.data.mediaChangeSupport)
        vm.openChangeMediaDialog = changeMediaDlgFunc;
    else
        vm.openChangeMediaDialog = changeMediaNotAvailableDlgFunc;

    vm.mediaChangeEnabled = false;
    var i;
    for(i = 0; i < mediaCollection.data.medium.length; i++)
        if(mediaCollection.data.medium[i].items.length > 1)
            vm.mediaChangeEnabled = true;
};