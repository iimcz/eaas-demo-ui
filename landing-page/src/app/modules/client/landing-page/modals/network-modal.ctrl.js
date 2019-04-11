module.exports = ['$state', '$http', '$scope', '$uibModal', 'currentEnv' , 'localConfig', 'growl', '$timeout', '$uibModalStack', 'REST_URLS', 'helperFunctions',
    function ($state, $http, $scope, $uibModal, curentEnv , localConfig, growl, $timeout, $uibModalStack, REST_URLS, helperFunctions) {

        var modalCtrl = this;

        this.network = curentEnv.network;
        this.env = curentEnv;

        if (eaasClient.networkTcpInfo) {
            var url = new URL(eaasClient.networkTcpInfo.replace(/^info/, 'http'));
            var pathArray = url.pathname.split('/');
            modalCtrl.hostname = url.hostname;
            modalCtrl.port = pathArray[2];
            modalCtrl.network = "//" + modalCtrl.hostname + ":" + modalCtrl.port;
        }


        function replaceMulti(text, searchGoal, replacement) {
            if (text)
                return text.split(searchGoal).join(replacement);
        }

        let helptext = replaceMulti(replaceMulti(this.env.helpText, '$$host$$', this.hostname), '$$port$$', this.port);
        this.localServerMode = curentEnv.localServerMode;
        console.log(this.localServerMode);
        this.networkHelp = helptext;
        this.detachTime;
        this.detach = function () {
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.detachSessionUrl, {
                lifetime: this.detachTime,
                lifetime_unit: "minutes",
                resources: [
                    {
                        id: eaasClient.networkId,
                        type: "component",
                        keepalive_url: localConfig.data.eaasBackendURL + "components/" + eaasClient.componentId + "/keepalive"
                    },
                    {
                        id: eaasClient.componentId,
                        type: "network",
                        keepalive_url: localConfig.data.eaasBackendURL + "sessions/" + eaasClient.networkId + "/keepalive"
                    }
                ]
            }).then(function (response) {
                modalCtrl.detachedComponentId = eaasClient.networkId;
                if (response.status === 200) {
                    window.onbeforeunload = function () {
                        eaasClient.disconnect();
                    }.bind(eaasClient);

                    growl.success('Detached! You can easily close this window now');
                } else {
                    growl.error('Unfortunately, this session can not be detached!');
                }
            });

        };
        this.localConnectionPort = 8080;

        this.getLocalProxy = function () {
            return eaasClient.getProxyURL({localPort: modalCtrl.localConnectionPort}).then(
                function (result) {
                    // use the result here
                    modalCtrl.proxy = result;
                    $scope.$apply();
                    document.getElementById("eaas-proxy-iframe").contentWindow.location = result;
                }
            )
        };
    }];