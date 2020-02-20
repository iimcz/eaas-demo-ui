import {showErrorIfNull} from "EaasLibs/javascript-libs/show-error-if-null.js";
import {attach} from "EaasLibs/javascript-libs/network-environment-utils/attach.js";
import {createDataFromEnv} from "EaasLibs/javascript-libs/eaas-data-creator.js";


module.exports = ['$state', '$sce', '$http', '$stateParams', '$translate', '$uibModal', 'Upload', 'eaasClient', '$scope', 'localConfig', 'Environments', 'EmilNetworkEnvironments', 'buildInfo', 'sessionId', 'connectEnv', 'helperFunctions', 'growl',
    function ($state, $sce, $http, $stateParams, $translate, $uibModal, Upload,
              eaasClient, $scope, localConfig, Environments, EmilNetworkEnvironments, buildInfo, sessionId, connectEnv, helperFunctions, growl) {

        showErrorIfNull(sessionId, $state);
        var vm = this;
        vm.eaasClient = eaasClient;

        async function getSession(id) {
            return await $http.get(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
                response.data.sessionId = id;
                response.data.componentIdToInitialize = response.data.components.find(e => {
                    return e.type === "machine"
                }).componentId;
                return response.data;
            })
        }

        async function attachNewEnvironment(session) {
            const data = createDataFromEnv(connectEnv, "machine");
            session = await eaasClient.attachNewEnv(data, session);
            attach(vm, session, $("#emulator-container")[0], eaasClient, Environments, EmilNetworkEnvironments).then(console.log("attachment is done"))
        }


        getSession(sessionId).then((session) => {
            if (connectEnv)
                attachNewEnvironment(session);
            else
                attach(vm, session, $("#emulator-container")[0], eaasClient, Environments, EmilNetworkEnvironments)
        })
    }];
