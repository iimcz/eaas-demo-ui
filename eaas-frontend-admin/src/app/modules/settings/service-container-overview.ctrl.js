module.exports = ['$http', '$state', 'growl', 'localConfig', 'containerList', '$uibModal', '$timeout', 'WizardHandler', 'REST_URLS', 'Environments',
    function ($http, $state, growl, localConfig, containerList, $uibModal, $timeout, WizardHandler, REST_URLS, Environments) {

        var container = this;

        // initialize default values of the form
        container.imageSize = 1024;
        container.imageType = '';
        container.importMethod = '';
    
        container.imageId = "";
        container.env = [];
        container.args = [];
        container.tag = "";
        container.imageInput = "/input";
        container.imageOutput = "/output";
        container.customSubdir = null;
        container.isCustomSubdir = false;

        container.runtime = "1";
        container.imageType = "dockerhub";
        container.list = containerList.container;
        container.runtimes = [];

        Environments.query().$promise.then(function (response) {
            container.envs = response;
            container.envs.forEach(function (element) {
                
                if (!element.linuxRuntime)
                    return;
                
                container.runtimes.push(element);
            });
        });

        container.checkState = function (_taskId, stayAtPage) {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function (response) {
                if (response.data.status == "0") {
                    if (response.data.isDone) {

                        container.id = response.data.userData.environmentId;
                        container.saveImportedContainer();
                    }
                    else
                        $timeout(function () {
                            container.checkState(_taskId, stayAtPage);
                        }, 2500);
                }
                else {
                    container.modal.close();
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
        };

        container.saveImportedContainer = function () {
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveImportedContainer, {
                id: container.id,
                title: container.selectedContainer.title,
                description: container.selectedContainer.description,
                author: "OpenSLX",
                enableNetwork: true,
                runtimeId: container.selectedRuntime.envId,
            }).then(function (response) {
                if (response.data.status == "0") {
                    growl.success("import successful.");
                    container.modal.close();
                    $state.go('admin.settings', {}, {});
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
        };

        //Next Step
        container.import = function () {

            var convertedEnv = [];
            var convertedArgs = [];
            var escapeEl = document.createElement('textarea');

            var unescape = function (html) {
                escapeEl.innerHTML = html;
                return escapeEl.textContent;
            };

            for (var _e in container.env) {
                convertedEnv.push(unescape(container.env[_e]));
            }

            for (var _a in container.args) {
                convertedArgs.push(unescape(container.args[_a]));
            }

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.importContainerUrl,
                {
                    urlString: container.selectedContainer.imageUrl,
                    runtimeID: container.runtime,
                    name: container.selectedContainer.id,
                    tag: (container.tag) ? container.tag : "latest",
                    processArgs: container.args,
                    processEnvs: container.env,
                    inputFolder: container.imageInput,
                    outputFolder: container.imageOutput,
                    imageType: container.imageType,
                    title: container.selectedContainer.title,
                    description: container.selectedContainer.description,
                    author: "OpenSLX",
                }).then(function (response) {

                    if (response.data.status === "0") {
                        var taskId = response.data.taskId;
                        container.modal = $uibModal.open({
                            backdrop: 'static',
                            animation: true,
                            templateUrl: 'partials/wait.html'
                        });
                        container.checkState(taskId, true);
                    }
                    else {
                        $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + container.description}});
                    }
            }, function(error) {
                console.log(error);
                $state.go('error', {errorMsg: {title: 'Error ' + error}});
            });
        };
    }];
