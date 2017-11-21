module.exports = function($scope, $window, $state, $http, $timeout, $uibModal, $stateParams, mediaCollection, growl, localConfig, $translate, chosenEnv) {    
    var vm = this;
                        
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
    
    vm.help = function() {
        showHelpDialog(chosenEnv.data.helpText);
    };

    vm.screenshot = function() {
         window.open(window.eaasClient.getScreenshotUrl());
    };

    vm.printEnvOut = function() {
         window.open(window.eaasClient.getPrintUrl());
    };

    vm.sendCtrlAltDel = function() {
        window.eaasClient.sendCtrlAltDel();
    };

    vm.saveSession = function() {
        var postReq = {};
        postReq.type = "saveUserSession";
        postReq.objectId = $stateParams.objectId;
        postReq.userContext = "testuser01";
        postReq.envId = $stateParams.envId;

        snapshotDoneFunc = function(data, status) {
            growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
            window.eaasClient.release();
            $('#emulator-stopped-container').show();
            window.location = localConfig.data.stopEmulatorRedirectURL;
        };
        window.eaasClient.snapshot(postReq, snapshotDoneFunc);
    }

    vm.restartEmulator = function() {
        window.eaasClient.release();
        $state.reload();
    };

    vm.stopEmulator = function () {
        window.eaasClient.release();
        $('#emulator-stopped-container').show();    
        window.location = localConfig.data.stopEmulatorRedirectURL;
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

    vm.openChangeMediaDialog = function() {
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

                    postObj = {};
                    postObj.objectId = $stateParams.objectId;
                    postObj.driveId = window.eaasClient.driveId;
                    postObj.label = newMediumLabel;

                    changeSuccsessFunc = function(data, status) {
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
};