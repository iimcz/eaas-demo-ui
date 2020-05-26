import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";
import { ClientOptions, NetworkComponentConfig, TcpGatewayConfig } from "EaasClient/lib/clientOptions";

export async function startNetworkEnvironment(controller, eaasClient, networkEnivornment, Environments, $http, $uibModal, localConfig) {
 
 //    controller.networkSessionEnvironments = [];

    const components = [];
    const clientOptions = new ClientOptions();

    clientOptions.enableNetworking();
    clientOptions.getNetworkConfig().setNetwork(networkEnivornment.network);
    clientOptions.getNetworkConfig().setGateway(networkEnivornment.gateway);
    clientOptions.getNetworkConfig().enableInternet(networkEnivornment.enableInternet);
    if(!networkEnivornment.dnsServiceEnvId)
        clientOptions.getNetworkConfig().enableSlirpDhcp(networkEnivornment.isDHCPenabled);

    try {
        let tcpGatewayConfig = new TcpGatewayConfig(networkEnivornment.networking.serverIp, networkEnivornment.networking.serverPort);
        tcpGatewayConfig.enableSocks(networkEnivornment.networking.enableSocks);
        tcpGatewayConfig.enableLocalMode(networkEnivornment.networking.localServerMode);
        clientOptions.getNetworkConfig().setTcpGatewayConfig(tcpGatewayConfig);
    }
    catch(e) {
        // do nothing
    }

   //  networkEnivornment.networking.envId = networkEnivornment.envId;

    for (const networkElement of networkEnivornment.emilEnvironments) {
        let env = await Environments.get({envId: networkElement.envId}).$promise;
        let component;

        if (env.runtimeId) {
            const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
            let modal = $uibModal.open({
                animation: true,
                template: require('EaasAdmin/app/modules/containers/modals/container-run-dialog-modified.html'),
                resolve: {
                    currentEnv: function () {
                        return env;
                    },
                    localConfig: function () {
                        return localConfig;
                    }
                },
                controller: "ContainerInputDialog as runContainerDlgCtrl"
            });

            let input_data = [];
            let input = {};
            input.size_mb = 512;
            input.destination = env.input;
            input.content = await modal.result;
            input_data.push(input);
            component = new MachineComponentBuilder(env.runtimeId, runtimeEnv.archive);
            component.setLinxRuntime(
                {
                    userContainerEnvironment: env.envId,
                    userContainerArchive: env.archive,
                    networking: env.networking,
                    input_data: input_data
                });
        } else {
            component = new MachineComponentBuilder(env.envId, env.archive);
            component.setEthernetAddress(networkElement.macAddress);
            component.setObject(env.objectId, env.objectArchive);
        }
        
        if(networkElement.toVisualize) {
            component.setInteractive();
            controller.componentIdToInitialize = component.getId();
        }

        let networkComponentConfig = new NetworkComponentConfig(networkElement.label, networkElement.macAddress);
        networkComponentConfig.setServerConfiguration(networkElement.serverIp, networkElement.serverPorts);
        component.setNetworkConfig(networkComponentConfig);
        
        components.push(component);
        
        /*
        controller.networkSessionEnvironments.push({
            "envId": env.envId,
            "title": env.title,
            "label": networkElement.label,
            // we miss the componentId here, but that should not matter. ideally we store this data within the eaas client
            "networkData": {
                serverIp: networkElement.serverIp,
                serverPorts: networkElement.serverPorts,
                fqdn: networkElement.fqdn
            }
        });
        */
    }

    if(networkEnivornment.startupEnvId){
        controller.startupEnv = await Environments.get({envId: networkEnivornment.startupEnvId}).$promise;
    }

    if (networkEnivornment.dnsServiceEnvId) {
        let env = await Environments.get({envId: networkEnivornment.dnsServiceEnvId}).$promise;
        if (env.runtimeId) {
            const runtimeEnv = await Environments.get({envId: env.runtimeId}).$promise;
            controller.dnsServiceEnv = env;
            let component;
            let input_data = [];
            let input = {};
            input.size_mb = 512;
            input.destination = env.input;

            const url = await $http.get(localConfig.data.eaasBackendURL + "network-environments/" + networkEnivornment.envId + "?jsonUrl=true");
            input.content = [{
                "action": "copy",
                "url": sessionStorage.DEBUG_network_json_url ? sessionStorage.DEBUG_network_json_url : url.data.url,
                "compression_format": "tar",
                "name": "network.json",
            }];
            input_data.push(input);
            component = new MachineComponentBuilder(env.runtimeId, runtimeEnv.archive);

            component.setLinuxRuntime(
            {
                userContainerEnvironment: env.envId,
                userContainerArchive: env.archive,
                networking: env.networking,
                input_data: input_data
            });

            let networkComponentConfig = new NetworkComponentConfig("DNS/DHCP Service");
            component.setNetworkConfig(networkComponentConfig);
            components.push(component);

            /*
            controller.networkSessionEnvironments.push({
                "envId": env.envId,
                "title": env.title,
                "label": "dns",
                "componentId": componentSession.componentId,
                "networkData": {
                    serverIp: "",
                    serverPorts: []
                }
            });
            */
        }
    }
    await eaasClient.start(components, clientOptions);
}
