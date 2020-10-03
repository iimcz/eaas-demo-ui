module.exports = ['$state', 'currentEnv', 'eaasClient',
    function ($state, curentEnv, eaasClient) {

        var modalCtrl = this;

        this.network = curentEnv.network;
        this.env = curentEnv;

        function formatStr(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }

        this.showEmu = function() {
            $('#emulator-container').show();
        }

        this.detachTime;
        this.sessionName;
        this.componentName = eaasClient.componentId;
        this.detach = function () {
            eaasClient.detach(this.sessionName, this.detachTime, this.componentName);
            $state.go('admin.networking', {});
        };
}];