module.exports = function($scope, $sce, $state, $stateParams, $cookies, $translate, growl, localConfig) {    
    var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

    window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

    eaasClient.onError = function(message) {
        $state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
    };

    var params = {
        keyboardLayout: kbLayoutPrefs.language.name,
        keyboardModel: kbLayoutPrefs.layout.name,
        object: $stateParams.objectId,
        userContext: "testuser01"
    };

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