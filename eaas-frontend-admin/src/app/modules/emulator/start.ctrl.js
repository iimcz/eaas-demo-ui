import {stopClient} from "./utils/stop-client";
import {startNetworkEnvironment} from "EaasLibs/javascript-libs/network-environment-utils/start-network-environment.js";
import {requestPointerLock, ClientError} from "EaasClient/eaas-client.js";
import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";
import { TcpGatewayConfig, ClientOptions } from "EaasClient/lib/clientOptions";
import { _fetch } from "../../lib/utils";
import { UviMachineComponentBuilder } from "../../../../../eaas-client/lib/componentBuilder";

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

        vm.runEmulator = async (networkSessionId) => {
            await chosenEnv;

            console.log(networkSessionId);

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

            /*
            this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
            if ($stateParams.objectId)
                this.link += "&objectId=" + $stateParams.objectId;
            */
           
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

            /*
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
            */

            let archive = (chosenEnv) ? chosenEnv.archive : "default";
            let environmentId= "";
            if (chosenEnv && chosenEnv.envId)
                environmentId = chosenEnv.envId;
            else
                environmentId = $stateParams.envId;

            let component = null;
            if($stateParams.uvi)
                componet = new UviMachineComponentBuilder($stateParams.uvi, environmentId, archive); 
            else
                component = new MachineComponentBuilder(environmentId, archive);

            component.setObject( $stateParams.objectId, $stateParams.objectArchive);
            component.setSoftware($stateParams.softwareId);
            component.setKeyboard(kbLayoutPrefs.language.name, kbLayoutPrefs.layout.name);
            component.setLinuxRuntime($stateParams.containerRuntime);

            if ($stateParams.type == 'saveUserSession') {
                component.lockEnvironment(true);
                // console.log("locking user session");
            }
            component.setInteractive(true);
            

            $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                console.log("onStateChange");
                if (!newUrl.endsWith("emulator")) {
                    eaasClient.release();
                    window.onbeforeunload = null;
                }
            });

            $scope.$on('$destroy', function (event) {
                stopClient($uibModal, $stateParams.isNetworkEnvironment || $rootScope.emulator.detached, eaasClient);
            });

            try {
                if ($stateParams.componentId && $stateParams.session) {
                    if (!$stateParams.session.network)
                        throw new Error("reattch requires a network session");
                    
                    await eaasClient.attach($stateParams.session.sessionId, $("#emulator-container")[0], $stateParams.componentId);
                    $rootScope.emulator.detached = true;
                } else if(networkSessionId) {
                    await eaasClient.attachNewEnv(networkSessionId, $("#emulator-container")[0], component);
                    vm.started = true;
                } else
                    {
                    if ($stateParams.isNetworkEnvironment) {
                        await startNetworkEnvironment(vm, eaasClient, chosenEnv, Environments, $http, $uibModal, localConfig);
                    } else {
                        await eaasClient.start([component], clientOptions);
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
        
        if (!chosenEnv || !chosenEnv.envId || !$stateParams.envId) 
            $state.go('admin.standard-envs-overview', {showObjects: ($stateParams.objectId != null)}, {reload: false});

        if ($stateParams.session || $stateParams.isNetworkEnvironment) {
            vm.runEmulator();
        } else if (!chosenEnv || !chosenEnv.networking || !chosenEnv.networking.connectEnvs) {
            vm.runEmulator();
        }
        else {
            // check if there are running sessions. 
            // if we find sessions, allow ad-hoc connections 
            // if no session is found, proceed 
            const f = async () => {
                try {
                    vm.sessionIds = await _fetch(`${localConfig.data.eaasBackendURL}/sessions`, "GET", null, localStorage.getItem('id_token'));
                    if(!vm.sessionIds || vm.sessionIds.length == 0)
                        throw new Error("no running environments found");

                    let modal = $uibModal.open({
                        template: require('./modals/connected-envs.html'),
                        animation: false,
                        backdrop: 'static',
                        resolve: {
                            sessionIds : () => { return vm.sessionIds }
                        },
                        controller: "EmulatorConnectedEnvsController as connectedEnvs"
                    });
                    await modal.closed;
                    
                    try {
                        let data = await modal.result;
                        if(data.session)
                            vm.runEmulator(data.session.id);
                        else 
                            vm.runEmulator();
                    }
                    catch(error)
                    {
                        let isObjectEnv = false;
                        if ($stateParams.objectId != null)
                            isObjectEnv = true;
                        growl.error(error);
                        $state.go('admin.standard-envs-overview', {showObjects: isObjectEnv}, {reload: false});
                    }

                }
                catch(e) {
                    console.log(e);
                    vm.runEmulator();
                }
            }
            f();
        }
    }];
