module.exports = function ($rootScope, $scope, $sce, $state, $stateParams, $cookies, $translate, chosenEnv, growl, localConfig) {

    if(!chosenEnv || chosenEnv.data.status === '1')
        $state.go('error', {errorMsg: {title: "Die Bereitstellungsumgebung konnte nicht geladen werden."}});

    var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

    window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

    this.objectId = $stateParams.objectId;

    $rootScope.initIdleTimer(10);

    window.onbeforeunload = function(e) {
        var dialogText = $translate.instant('MESSAGE_QUIT');
        e.returnValue = dialogText;
        return dialogText;
    };

    $rootScope.idleTimeoutWarnFn = function()
    {
        $uibModal.open({
            animation: true,
            template: require('./modals/help-emil-dialog.html'),
            controller: function($scope) {
                this.helpTitle = $translate.instant('TIMEOUT_DLG_TITLE');
                this.helpText = $translate.instant('TIMEOUT_DLG_MESSAGE');
            },
            controllerAs: "helpDialogCtrl"
        });
    }

    $rootScope.idleTimeoutFn = function()
    {
        window.onbeforeunload = null;
        window.eaasClient.release();
        $('#emulator-stopped-container').show();
        window.location = localConfig.data.stopEmulatorRedirectURL;
    }

    window.onunload = function() {
        window.onbeforeunload = null;
        $rootScope.disableIdleTimer();
    }

    eaasClient.onError = function(message) {
        $state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
    };

    window.eaasClient.onEmulatorStopped = function() {
        if($rootScope.emulator.state == 'STOPPED')
            return;

        $rootScope.emulator.state = 'STOPPED';
        $("#emulator-container").hide();
        $("#emulator-loading-container").show();
        $("#emulator-loading-container").text($translate.instant('JS_EMU_STOPPED'));
        $scope.$apply();
    };

    var params = {
        keyboardLayout: kbLayoutPrefs.language.name,
        keyboardModel: kbLayoutPrefs.layout.name,
        object: $stateParams.objectId,
        userId: $stateParams.userId
    };

    if($stateParams.isUserSession)
        params.lockEnvironment = true;

    eaasClient.startEnvironment($stateParams.envId, params).then(function () {
        eaasClient.connect().then(function() {
            $("#emulator-loading-container").hide();
            $("#emulator-container").show();

            if (eaasClient.params.pointerLock === 'true') {
                growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
            }
        });
    });
};