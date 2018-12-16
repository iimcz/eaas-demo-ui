module.exports = ['$state', '$http', '$scope', '$uibModal', '$timeout', 'localConfig', 'kbLayouts', 'growl', '$uibModalStack', 'REST_URLS', 'helperFunctions',
    function ($state, $http, $scope, $uibModal, $timeout, localConfig, kbLayouts, growl, $uibModalStack, REST_URLS, helperFunctions) {
        var vm = this;
        vm.emulator = null;
        vm.emulatorType = null;
        vm.fstype = "ext4";
        vm.alias = "";
        vm.version = null;
        vm.emulators = ["qemu-system", "basilisk2", "beebem", "hatari", "kegs-sdl", "pce-atari-st", "pce-ibmpc", "sheepshaver", "vice-sdl"];
        $scope.runtime = 0;
        $scope.hideTextArea = true;
        // FIXME combine showDatabase functions, remove hardcoded className
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
        vm.getNameIndexes = function () {
            $http.get(localConfig.data.eaasBackendURL + REST_URLS.getNameIndexes).then(function (response) {
                if (response.status === 200) {
                    console.log("response!!!! ", response);
                    console.log("response.data", response.data);

                    growl.success("Done");
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            });
        };

        //Next Step
        vm.import = function () {

            var convertedEnv = [];
            var convertedArgs = [];
            var escapeEl = document.createElement('textarea');

            if (vm.imageType === "dockerhub") {
                vm.archiveType = "dockerhub";
            }

            var unescape = function (html) {
                escapeEl.innerHTML = html;
                return escapeEl.textContent;
            };

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.importEmulator,
                {
                    urlString: vm.imageUrl,
                    runtimeID: vm.runtime,
                    name: vm.name,
                    tag: vm.tag,
                    alias: vm.alias,
                    version: vm.version,
                    emulatorType: vm.emulatorType,
                    fstype: vm.fstype,
                    isEmulator: true,
                    processArgs: [""],
                    processEnvs: vm.env,
                    inputFolder: vm.imageInput,
                    outputFolder: vm.imageOutput,
                    imageType: vm.archiveType,
                    title: vm.title,
                    description: vm.containerDescription,
                    author: vm.author,
                    guiRequired: vm.gui
                }).then(function (response) {

                if (response.data.status === "0") {
                    var taskId = response.data.taskId;
                    vm.modal = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        templateUrl: 'partials/wait.html'
                    });
                    vm.checkState(taskId, true);
                    $uibModalStack.dismissAll();
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + vm.description}});
                }
            });
        };

        vm.checkState = function (_taskId, stayAtPage) {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function (response) {
                if (response.data.status == "0") {
                    if (response.data.isDone) {

                        vm.id = response.data.userData.environmentId;
                        vm.modal.close();
                        growl.success("import successful.");
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                    else
                        $timeout(function () {
                            vm.checkState(_taskId, stayAtPage);
                        }, 2500);
                }
                else {
                    vm.modal.close();
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
        };

    }];