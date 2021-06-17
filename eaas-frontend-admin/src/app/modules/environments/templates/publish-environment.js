import { _fetch, ClientError, confirmDialog } from "../../../lib/utils.js";

export function publisher($http, $uibModal, $state, $timeout, growl, localConfig, REST_URLS, helperFunctions) {
    async function replicateImage(envId, replicationType) {
        if (replicationType === "import") {
            try {
                await confirmDialog($uibModal, "Replicate Image", `Replication will copy environment data to local storage. Environments copied from the EaaSI Network cannot be deleted from storage once replicated. 
                Do you want to replicate this environment from the network?`);
            }
            catch(e)
            {
                return false;
            }
        }
        else {
            try {
                await confirmDialog($uibModal, "Publish Image", `Resources published to the EaaSI network cannot be easily removed.
                Do not share software or environments with existing access or license restrictions.
                
                Do you want to publish this environment to the network?`);
            }
            catch(e)
            {
                return false;
            }
        }

        console.log("replicating " + envId);
        var modal = $uibModal.open({
            animation: true,
            template: require('../modals/wait.html')
        });
        $http.post(localConfig.data.eaasBackendURL + REST_URLS.replicateImage,
            {
                replicateList: [envId],
                destArchive: "public"
            }).then(function (response) {
            if (response.data.status === "0") {
                var taskId = response.data.taskList[0];
                checkState(taskId, modal);
            } else {
                modal.close();
                growl.error("error replicating image");
                $state.go('admin.standard-envs-overview');
            }
        }, function (response) {
            modal.close();
            growl.error("error replicating image: " + response.data.message);
            $state.go('admin.standard-envs-overview');
        });
    }

    function checkState(_taskId, _modal) {
        var taskInfo = $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function (response) {
            if (response.data.status == "0") {
                if (response.data.isDone) {
                    console.log("task finished " + _taskId);
                    growl.success("replication finished.");
                    $state.go('admin.standard-envs-overview', {}, {reload: true});
                    _modal.close();
                } else
                    $timeout(function () {
                        checkState(_taskId, _modal);
                    }, 2500);
            } else {
                growl.error("error replicating image " + response.data.message);
                _modal.close();
            }
        });
    }

    return replicateImage
}