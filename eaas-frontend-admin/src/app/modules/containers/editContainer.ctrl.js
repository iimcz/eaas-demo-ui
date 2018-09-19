module.exports = ['$http', '$scope', '$state', '$stateParams', 'containerEnvironmentList', 'localConfig', 'growl', '$translate', 'REST_URLS',
    function ($http, $scope, $state, $stateParams, containerEnvironmentList, localConfig, growl, $translate, REST_URLS) {
        var vm = this;
        let handlePrefix = "11270/";


        vm.showDateContextPicker = false;
        var envList = null;

        envList = containerEnvironmentList.data.environments;
        vm.env = null;

        for (var i = 0; i < envList.length; i++) {
            if (envList[i].envId === $stateParams.envId) {
                vm.env = envList[i];
                break;
            }
        }

        if(localConfig.data.features.handle) {
            $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList).then(function (response) {
                if (response.data.handles.includes(handlePrefix + vm.env.envId.toUpperCase())) {
                    vm.handle = handlePrefix + vm.env.envId;
                }
            });
        }

        if (vm.env === null) {
            growl.error("Container not found");
            $state.go('admin.standard-envs-overview', {}, {reload: true});
        }
        vm.envTitle = vm.env.title;
        vm.author = vm.env.author;
        vm.description = vm.env.description;
        vm.envInput = vm.env.input;
        vm.envOutput = vm.env.output;
        vm.processArgs = vm.env.processArgs; // todo deep copy
        vm.processEnvs = vm.env.processEnvs;

        vm.saveEdit = function () {

            vm.env.title = vm.envTitle;
            vm.env.input = vm.envInput;
            vm.env.output = vm.envOutput;
            vm.env.author = vm.author;
            vm.env.description = vm.description;
            vm.env.processArgs = vm.processArgs;
            vm.env.processEnvs = vm.processEnvs;

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateContainerUrl, {
                id: $stateParams.envId,
                title: vm.envTitle,
                author: vm.author,
                description: vm.description,
                outputFolder: vm.envOutput,
                inputFolder: vm.envInput,
                processEnvs: vm.processEnvs,
                processArgs: vm.processArgs
            }).then(function (response) {
                if (response.data.status === "0") {
                    growl.success($translate.instant('JS_ENV_UPDATE'));
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
                $state.go('admin.standard-envs-overview', {showObjects: false, showContainers: true}, {reload: true});
            });
        };
    }];