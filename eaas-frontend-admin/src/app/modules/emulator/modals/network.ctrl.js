module.exports = ['$state', '$http', '$scope', 'currentEnv', 'eaasClient', 'localConfig', 'growl', 
    function ($state, $http, $scope, currentEnv, eaasClient, localConfig, growl) {

        var modalCtrl = this;

        modalCtrl.hasOpenPorts = eaasClient.getActiveSession().hasSharedNetworkPorts();

        /*
        this.network = currentEnv.network;
        this.env = currentEnv;
        console.log(this.env);
        this.getServerAddress = function()
        {
            let out = "http://" + this.network;
            return out;
        }
        */

        /*
        function formatStr(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }
        */

        /*
        function replaceMulti(text, searchGoal, replacement) {
            if (text)
                return text.split(searchGoal).join(replacement);
        }
        */

        // let helptext = replaceMulti(replaceMulti(this.env.networking.helpText, '$$host$$', this.hostname), '$$port$$', this.port);

        /*
        this.localServerMode = currentEnv.networking.localServerMode;
        console.log(this.localServerMode);
        */


        this.localConnectionPort = 8080;

        this.getLocalProxy = function () {
            return eaasClient.getActiveSession().getProxyURL({localPort: modalCtrl.localConnectionPort}).then(
                function (result) {
                    // use the result here
                    modalCtrl.proxy = result;
                    $scope.$apply();
                    document.getElementById("eaas-proxy-iframe").contentWindow.location = result;
                }
            )
        };
    }];