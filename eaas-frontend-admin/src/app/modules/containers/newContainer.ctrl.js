module.exports = ['$http', '$scope', '$state', '$stateParams', 'runtimeList', 'growl', 'localConfig', '$uibModal', '$timeout', 'WizardHandler', 'helperFunctions', 'REST_URLS',
    function ($http, $scope, $state, $stateParams, runtimeList, growl, localConfig, $uibModal, $timeout, WizardHandler, helperFunctions, REST_URLS) {

        var container = this;
        container.runtimes = runtimeList.data.runtimes;
        console.log(container.runtimes);
        $stateParams.type = 'saveImport';
        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

        // initialize default values of the form
        container.imageSize = 1024;
        container.imageType = 'size';


        container.landingPage = localConfig.data.landingPage;

        container.imageId = "";
        container.env = [];
        container.args = [];

        //TODO: ?
        container.onSelectRuntime = function (item, model) {
            container.runtime = item.id;
        };

        container.isValid = function () {

            if (!container.imageInput || !container.imageOutput) {
                growl.error("input / ouput folder are required");
                return false;
            }

            if (container.args.length == 0) {
                growl.error("process is required");
                return false;
            }

            if (!container.name) {
                growl.error("container name is required");
                return false;
            }

            if (!container.imageUrl) {
                growl.error("image file / image URL is required");
                return false;
            }

            return true;
        };

        container.isMetaDataValid = function () {

            if (!container.title) {
                growl.error("Title is required");
                return false;
            }
            if (!container.containerDescription) {
                growl.error("Description is required");
                return false;
            }
            // if (!container.author) {
            //     growl.error("Author is required");
            //     return false;
            // }


            return true;
        };

        container.checkState = function (_taskId, stayAtPage) {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function (response) {
                if (response.data.status == "0") {
                    if (response.data.isDone) {

                        container.id = response.data.userData.environmentId;
                        container.modal.close();
                        growl.success("import successful.");
                        if (typeof stayAtPage == "undefined" || !stayAtPage)
                            $state.go('admin.standard-envs-overview', {}, {reload: true});
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

            if (!container.isMetaDataValid())
                return;

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveImportedContainer, {
                id: container.id,
                title: container.title,
                description: container.containerDescription,
                author: container.author
            }).then(function (response) {
                if (response.data.status == "0") {
                    growl.success("import successful.");
                    WizardHandler.wizard('containerImportWizard').next();
                    // $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
        };

        container.saveHandle = function () {
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                handle: "11270/" + container.id,
                value: localConfig.data.landingPage + "?id=" + container.id,
            }).then(function (response) {
                console.log("response  ", response);
                console.log("response.status   ", response.status);
                if (response.status === 200) {
                    container.handleValue = "http://hdl.handle.net/11270/" + container.id;} else {
                    growl.error('Handle is not defined!!');
                }

            });
        };

        //Next Step
        container.import = function () {

            if (!container.isValid())
                return;

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
                    urlString: container.imageUrl,
                    runtimeID: container.runtime,
                    name: container.name,
                    processArgs: container.args,
                    processEnvs: container.env,
                    inputFolder: container.imageInput,
                    outputFolder: container.imageOutput,
                    imageType: container.archiveType,
                    title: container.title,
                    description: container.containerDescription,
                    author: container.author,
                    guiRequired: container.gui
                }).then(function (response) {

                if (response.data.status === "0") {

                    var taskId = response.data.taskId;
                    container.modal = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        templateUrl: 'partials/wait.html'
                    });
                    container.checkState(taskId, true);
                    WizardHandler.wizard('containerImportWizard').next();
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + container.description}});
                }
            });
        };
    }];