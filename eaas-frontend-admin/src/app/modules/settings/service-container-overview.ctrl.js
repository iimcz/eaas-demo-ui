import {WaitModal, Task} from "../../lib/task.js";
import { 
    ContainerImageBuilder,
    ContainerBuilder
 } from "../../lib/containerBuilder.js";

module.exports = ['$http', '$state', 'growl', 'localConfig', 'containerList', '$uibModal', 'REST_URLS', 'Environments',
    function ($http, $state, growl, localConfig, containerList, $uibModal, REST_URLS, Environments) {

        var container = this;

        container.waitModal = new WaitModal($uibModal);

        // initialize default values of the form
        container.imageSize = 1024;
        container.importMethod = '';
    
        container.imageId = "";
        container.env = [];
        container.args = [];
        container.tag = "";
        container.imageInput = "/input";
        container.imageOutput = "/output";
        container.customSubdir = null;
        container.isCustomSubdir = false;

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

        container.saveImportedContainer = async function (containerUrl) 
        {
            let containerBuilder = new ContainerBuilder("dockerhub", containerUrl);
            containerBuilder.setTitle(container.selectedContainer.title);
            containerBuilder.setAuthor("OpenSLX");
            containerBuilder.setDescription(container.selectedContainer.description);
            containerBuilder.setRuntime(container.selectedRuntime.envId);
            containerBuilder.setName(container.selectedContainer.id);
            containerBuilder.setInputFolder(container.imageInput);
            containerBuilder.setOutputFolder(container.imageOutput);
            containerBuilder.setEnableNetwork(true);
            containerBuilder.setServiceContainerId(container.selectedContainer.id);

            try {
                let _result = await containerBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                let task = new Task(_result.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                await task.done;
                growl.success("import successful.");
                container.waitModal.hide();
            }   
            catch(e)
            {
                console.log(e);
                container.waitModal.hide();
                $state.go('error', {errorMsg: {title: e}});   
            }
        };

        container.import = async function () {
            let imageBuilder = new ContainerImageBuilder(container.selectedContainer.imageUrl, "dockerhub");
            imageBuilder.setTag((container.selectedContainer.tag) ? container.selectedContainer.tag : "latest");

            container.waitModal.show("Importing service container");
            let imageBuilderTask = await imageBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
            let task = new Task(imageBuilderTask.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
            let buildResult = await task.done;

            try {
                let object = JSON.parse(buildResult.object);
                container.saveImportedContainer(object.containerUrl);
            }
            catch(e)
            {
                console.log(e);
                container.waitModal.hide();
                $state.go('error', {errorMsg: {title: 'Error ' + e}});
            }
        };
    }];
