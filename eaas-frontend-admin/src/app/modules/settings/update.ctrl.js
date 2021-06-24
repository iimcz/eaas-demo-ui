module.exports = ['$scope' , '$state', '$http', 'localConfig', 'growl', 'current',
    function($scope, $state, $http, localConfig, growl, current) {

        var vm = this;

        vm.currentVersion = current.data.version;
        vm.currentChannel = current.data.channel;
        vm.latestVersion = undefined;

        vm.updateList = [];

        vm.load = function() {
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
        }

        /*
            ### Refresh (reload/download) channels's metadata
            POST http://localhost:8000/operator/api/v1/channels/example
            accepts: application/json
        */
        vm.refreshList = function()
        {
            $http.post(localConfig.data.eaasBackendURL + "operator/api/v1/channels/" +  vm.currentChannel, null).then( function(response) {
                vm.load();
            });
        };

        /*
        ### Update to release
        POST http://localhost:8000/operator/api/v1/channels/example/releases/2.0
        accepts: application/json
        */
        vm.update = function(releaseEntry)
        {
            $http.post(localConfig.data.eaasBackendURL + "operator/api/v1/channels/" +  vm.currentChannel + "/releases/" + releaseEntry.version, null).then(

            );
        };

        vm.load();
    }];