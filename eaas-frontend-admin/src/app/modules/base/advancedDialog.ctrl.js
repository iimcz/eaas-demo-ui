module.exports = ['$state', '$http', '$scope', '$uibModal', 'localConfig', 'kbLayouts', 'growl', 'REST_URLS', 'helperFunctions',
    function ($state, $http, $scope, $uibModal, localConfig, kbLayouts, growl, REST_URLS, helperFunctions) {
        var vm = this;
        $scope.runtime = 0;
        $scope.hideTextArea = true;

        vm.showEmilEnvs = function () {
            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getDatabaseContent, "emilEnvironment", "de.bwl.bwfla.emil.datatypes.EmilEnvironment")).then(function (response) {
                if (response.status === 200) {
                    console.log("response", response.data);
                    console.log(JSON.stringify("response.data"));
                    vm.response = response.data;
                    $('#json-renderer').jsonViewer(response.data, {withQuotes: false});
                    growl.success("Done");
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            });
        };
        vm.showObjectEmilEnvs = function () {
            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getDatabaseContent, "emilObjectEnvironment", "de.bwl.bwfla.emil.datatypes.EmilObjectEnvironment")).then(function (response) {
                if (response.status === 200) {
                    console.log("response", response.data);
                    console.log(JSON.stringify("response.data"));
                    vm.response = response.data;
                    $('#json-renderer').jsonViewer(response.data, {withQuotes: false});
                    growl.success("Done");
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            });
        };
        vm.showContainerEmilEnvs = function () {
            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getDatabaseContent, "emilContainerEnvironment", "de.bwl.bwfla.emil.datatypes.EmilContainerEnvironment")).then(function (response) {
                if (response.status === 200) {
                    console.log("response", response.data);
                    console.log(JSON.stringify("response.data"));
                    vm.response = response.data;
                    $('#json-renderer').jsonViewer(response.data, {withQuotes: false});
                    growl.success("Done");
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            });
        };
    }];