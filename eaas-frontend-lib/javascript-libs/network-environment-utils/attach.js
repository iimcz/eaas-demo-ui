
/*
export async function attach(controller, session, emulatorDiv, eaasClient, Environments, EmilNetworkEnvironments) {    
    controller.networkSessionEnvironments = [];

    console.log(session);
    
    if (session.network.networkEnvironmentId) {
        controller.env = await EmilNetworkEnvironments.get({envId: session.network.networkEnvironmentId}).$promise;
            if(controller.env.dnsServiceEnvId){
                controller.dnsServiceEnv = Environments.get({envId: controller.env.dnsServiceEnvId})
            }
            if(controller.env.startupEnvId){
                controller.startupEnv = await Environments.get({envId: controller.env.startupEnvId})
            }

            for (const component of session.components) {
                if (component.type === "machine") {
                    console.log("component", component);
                    component.networkElement = session.network.components.find(el => el.componentId === component.componentId);

                    await Environments.get({envId: component.environmentId}).$promise.then((envMetaData) => {
                            const emilEnv = controller.env.emilEnvironments.find((env) => env.macAddress === component.networkElement.hwAddress);
                            controller.networkSessionEnvironments.push({
                                "envId": component.environmentId,
                                "title": envMetaData.title,
                                "label": component.networkElement.networkLabel,
                                "componentId": component.componentId,
                                "networkData": {
                                    serverIp: component.networkElement.serverIp,
                                    serverPorts: component.networkElement.serverPorts,
                                    // an environment doesn't have hwAddress, only if it's a new environment to attach.
                                    fqdn: component.networkElement.hwAddress && emilEnv ? emilEnv.fqdn : undefined
                                }
                            });
                    });
                }
            }
    }
    
    let componentSession = eaasClient.getSession(session.componentIdToInitialize);
    console.log(componentSession);
    await eaasClient.connect(emulatorDiv, componentSession);
}
*/
