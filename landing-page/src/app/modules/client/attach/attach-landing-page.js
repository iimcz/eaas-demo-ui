import {showErrorIfNull} from "EaasLibs/javascript-libs/show-error-if-null.js";
import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";

module.exports = ['$state', '$http', 'eaasClient', '$scope', 'localConfig', 'sessionId', 'connectEnv',
    function ($state, $http, eaasClient, $scope, localConfig, sessionId, connectEnv) {

        showErrorIfNull(sessionId, $state);
        var vm = this;
        vm.eaasClient = eaasClient;

        async function getSession(id) {
            return await $http.get(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
                response.data.sessionId = id;
                return response.data;
            })
        }

        async function attachNewEnvironment(session) {
            const component = new MachineComponentBuilder(connectEnv.envId, connectEnv.archive);
            component.setInteractive(true);
            
            await eaasClient.attachNewEnv(session, $("#emulator-container")[0], component);
            vm.started = true;
            $scope.$apply();
        }

        getSession(sessionId).then((session) => {
            if (connectEnv)
                attachNewEnvironment(session);
            else
                eaasClient.attach(session, $("#emulator-container")[0])
        })
    }];
