module.exports = ['$state', '$http', '$scope', '$uibModal', 'currentEnv' , 'localConfig', 'growl', '$timeout', '$uibModalStack', 'REST_URLS', 'helperFunctions',
    function ($state, $http, $scope, $uibModal, curentEnv , localConfig, growl, $timeout, $uibModalStack, REST_URLS, helperFunctions) {

        var modalCtrl = this;

        this.network = curentEnv.network;
        this.env = curentEnv;

        function formatStr(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }

        this.detachTime;
        this.sessionName;
        this.detach = function () {
            let url = localConfig.data.eaasBackendURL + formatStr("/sessions/{0}/detach", eaasClient.networkId);
            $http.post(url, {
                lifetime: this.detachTime,
                lifetime_unit: "minutes",
                sessionName: this.sessionName
            }).then(function (response) {
                modalCtrl.detachedComponentId = eaasClient.networkId;
                if (response.status === 204) {
                    eaas.deleteOnUnload = false;
                    window.onbeforeunload = function () {
                        eaasClient.disconnect();
                    }.bind(eaasClient);
                    growl.success('Session detached!');
                    $state.go('admin.standard-envs-overview', {showObjects: false}, {reload: false});
                } else {
                    growl.error('Unfortunately, this session can not be detached!');
                }
            });
        };
}];