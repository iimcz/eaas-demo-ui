module.exports = ['$scope' , '$state', '$http', 'localConfig', 'growl', 'current',
    function($scope, $state, $http, localConfig, growl, current) {

        var vm = this;

        vm.currentVersion = current.data.version;
        vm.currentChannel = current.data.channel;
        vm.latestVersion = undefined;

        vm.updateList = [];

        $http.get(localConfig.data.eaasBackendURL + "operator/api/v1/channels/" +  vm.currentChannel + "/releases/latest").then(
            function(response) 
            {
                vm.latestVersion = response.data.version;
            }
        );  
        $http.get(localConfig.data.eaasBackendURL + "operator/api/v1/channels/" +  vm.currentChannel + "/releases").then(
            function(response)
            {
                vm.updateList = response.data.sort( (a, b)  => { 
                    return Date.parse(a.date) < Date.parse(b.date); 
                });
            }
        );
    }];