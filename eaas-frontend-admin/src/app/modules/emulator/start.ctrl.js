import {stopClient} from "./utils/stop-client";
import {startNetworkEnvironment} from "EaasLibs/javascript-libs/network-environment-utils/start-network-environment.js";
import {requestPointerLock, ClientError} from "EaasClient/eaas-client.js";
import {attach} from "EaasLibs/javascript-libs/network-environment-utils/attach.js";
import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";
import { TcpGatewayConfig, ClientOptions } from "EaasClient/lib/clientOptions";

module.exports = ['$rootScope', '$uibModal', '$scope', '$state', '$stateParams', '$cookies', '$translate', '$http', 'localConfig', 'growl', 'Environments', 'EmilNetworkEnvironments', 'chosenEnv', 'eaasClient',
    function ($rootScope, $uibModal, $scope, $state, $stateParams, $cookies, $translate, $http, localConfig, growl, Environments, EmilNetworkEnvironments, chosenEnv, eaasClient) {
        var vm = this;
        vm.eaasClient = eaasClient;

        window.$rootScope = $rootScope;
        $rootScope.emulator.state = '';
        $rootScope.emulator.detached = false;
        vm.emulator = $rootScope.emulator;

        if ($stateParams.containerRuntime != null) {
            $scope.containerRuntime = $stateParams.containerRuntime;
            if(chosenEnv == null) chosenEnv = {};
                chosenEnv.networking = $stateParams.containerRuntime.networking;
        }

        vm.runEmulator = async (selectedEnvs, attachId) => {
            await chosenEnv;

            window.onbeforeunload = function (e) {
                var dialogText = $translate.instant('MESSAGE_QUIT');
                e.returnValue = dialogText;
                return dialogText;
            };

            window.onunload = function () {
                if(eaasClient)
                   eaasClient.release();
                window.onbeforeunload = null;
            };

            vm.getOutput = function () {
                $("#emulator-loading-container").hide();

                let _header = localStorage.getItem('id_token') ? {"Authorization": "Bearer " + localStorage.getItem('id_token')} : {};

                async function f() {
                    const containerOutput = await fetch(eaasClient.sessions.find((session) => eaasClient.activeView.componentId === session.componentId).getContainerResultUrl(), {
                        headers: _header,
                    });
                    const containerOutputBlob = await containerOutput.blob();
                    // window.open(URL.createObjectURL(containerOutputBlob), '_blank');

                    var downloadLink = document.createElement("a");
                    downloadLink.href = URL.createObjectURL(containerOutputBlob);
                    downloadLink.download = "output-data.zip";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                };
                f();
            };

            this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
            if ($stateParams.objectId)
                this.link += "&objectId=" + $stateParams.objectId;

            eaasClient.onEmulatorStopped = function () {
                if ($rootScope.emulator.state == 'STOPPED')
                    return;

                $rootScope.emulator.state = 'STOPPED';
                $rootScope.emulator.detached = false;
                $("#emulator-container").hide();
                $("#emulator-loading-container").show();
                $("#emulator-loading-container").text($translate.instant('JS_EMU_STOPPED'));

                $scope.$apply();
            };

            // fallback to defaults when no cookie is found
            var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {
                language: {name: 'us'},
                layout: {name: 'pc105'}
            };

            let clientOptions = new ClientOptions();
            try {
                if (chosenEnv) {
                    if (chosenEnv.networking) {
                        if (chosenEnv.networking.connectEnvs)
                            clientOptions.enableNetworking();

                        clientOptions.getNetworkConfig().enableInternet(chosenEnv.networking.enableInternet);
                        try {
                            let tcpGatewayConfig = new TcpGatewayConfig(chosenEnv.networking.serverIp, chosenEnv.networking.serverPort);
                            tcpGatewayConfig.enableSocks(chosenEnv.networking.enableSocks);
                            tcpGatewayConfig.enableLocalMode(chosenEnv.networking.localServerMode);
                            clientOptions.getNetworkConfig().setTcpGatewayConfig(tcpGatewayConfig);
                        }
                        catch(e)
                        {
                            // TcpGatewayConfig throws if serverIp / port is not set. 
                        }
                    }
                    clientOptions.setXpraEncoding(chosenEnv.xpraEncoding);
                }
            }
            catch(e)
            {
                console.error(e);
                const details = (e instanceof ClientError) ? e.toJson() : e.toString();
                $state.go('error', { errorMsg: { title: "Emulation Error", message: details } });
            }
            // console.log(params);

            let components = [];
            for (let i = 0; i < selectedEnvs.length; i++) {
                let component;

                if (selectedEnvs[i].envType === "container" && selectedEnvs[i].runtimeId) {
                    let runtimeEnv =  vm.environments.find(function(element) {
                        return element.envId = selectedEnvs[i].runtimeId;
                    });
                    component = new MachineComponentBuilder(selectedEnvs[i].runtimeId, runtimeEnv.archive);
                    component.setLinuxRuntime(
                        {
                            userContainerEnvironment: selectedEnvs[i].envId,
                            userContainerArchive: selectedEnvs[i].archive,
                            networking: selectedEnvs[i].networking,
                            input_data: selectedEnvs[i].input_data
                        }
                    );
                } else {
                    //since we can observe only single environment, keyboardLayout and keyboardModel are not relevant
                    component = new MachineComponentBuilder(selectedEnvs[i].envId, selectedEnvs[i].archive);
                    component.setObject(selectedEnvs[i].objectId, selectedEnvs[i].objectArchive);
                    component.setSoftware(selectedEnvs[i].softwareId);
                }
                components.push(component);
            }

            let archive = (chosenEnv) ? chosenEnv.archive : "default";
            let environmentId= "";
            if (chosenEnv && chosenEnv.envId)
                environmentId = chosenEnv.envId;
            else
                environmentId = $stateParams.envId;

            let component = new MachineComponentBuilder(environmentId, archive);
            component.setObject( $stateParams.objectId, $stateParams.objectArchive);
            component.setSoftware($stateParams.softwareId);
            component.setKeyboard(kbLayoutPrefs.language.name, kbLayoutPrefs.layout.name);
            component.setLinuxRuntime($stateParams.containerRuntime);

            if ($stateParams.type == 'saveUserSession') {
                component.lockEnvironment(true);
                // console.log("locking user session");
            }
            component.setInteractive(true);
            components.push(component);

            $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                console.log("onStateChange");
                if (!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            $scope.$on('$destroy', function (event) {
                stopClient($uibModal, $rootScope.emulator.detached, eaasClient);
            });

            try {
                if ($stateParams.componentId && $stateParams.session) {
                    if (!$stateParams.session.network)
                        throw new Error("reattch requires a network session");
                    
                    await eaasClient.attach($stateParams.session, $("#emulator-container")[0], $stateParams.componentId);
                    $rootScope.emulator.detached = true;
                } else
                    {
                    if ($stateParams.isNetworkEnvironment) {
                        await startNetworkEnvironment(vm, eaasClient, chosenEnv, Environments, $http, $uibModal, localConfig);
                    } else {
                        await eaasClient.start(components, clientOptions, attachId);
                    }
                    await eaasClient.connect($("#emulator-container")[0]);
/*
                eaasClient.realEnvId = $stateParams.realEnvId;

            } else {
                eaasClient.realEnvId = undefined;
*/
                    $rootScope.idsData = eaasClient.envsComponentsData;
                    $rootScope.idsData.forEach(function (idData) {
                        if (idData.env) {
                            Environments.get({ envId: idData.env.data.environment }).$promise.then(function (response) {
                                idData.title = response.title;
                            });
                        }
                    });
                }

                $("#emulator-loading-container").hide();
                $("#emulator-container").show();
                $rootScope.emulator.mode = eaasClient.mode;
                $rootScope.emulator.state = 'STARTED';
                if (eaasClient.params.pointerLock === "true") {
                    growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                    requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                }
                $scope.$apply();
                $rootScope.$broadcast("emulatorStart", "success");

                if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) {
                    $rootScope.networkTcpInfo = eaasClient.networkTcpInfo;
                    $rootScope.tcpGatewayConfig = eaasClient.tcpGatewayConfig;
                }

            }
            catch (e) {
                console.error(e);

                const details = (e instanceof ClientError) ? e.toJson() : e.toString();
                $state.go('error', { errorMsg: { title: "Emulation Error", message: details } });
            }
        }

        async function dealWithIt(resultPromise)
        {
            try {
                let data = await resultPromise;
                if(data.attachComponentId)
                    vm.runEmulator(data.selected, data.attachComponentId.id);
                else
                    vm.runEmulator(data.selected);
            }
            catch(error)
            {
                let isObjectEnv = false;
                if ($stateParams.objectId != null)
                    isObjectEnv = true;
                $state.go('admin.standard-envs-overview', {showObjects: isObjectEnv}, {reload: false});
            }
        }
        
        if ($stateParams.session || $stateParams.isNetworkEnvironment) {
            vm.runEmulator([]);
        } else if (!chosenEnv || !chosenEnv.networking || !chosenEnv.networking.connectEnvs) {
            vm.runEmulator([]);
        }
        else {
            let modal = $uibModal.open({
                template: require('./modals/connected-envs.html'),
                animation: false,
                resolve: {
                    environments : (Environments) => Environments.query().$promise,
                    sessionIds : ($http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds)
                },
                controller: "EmulatorConnectedEnvsController as connectedEnvs"
            });

            modal.closed.then(() => dealWithIt(modal.result));
        }
    }];
