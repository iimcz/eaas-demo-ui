function checkIfContainer(containerRuntime, data) {
    if (containerRuntime != null) {
        data.linuxRuntimeData = {
            userContainerEnvironment: containerRuntime.userContainerEnvironment,
            userContainerArchive: containerRuntime.userContainerArchive,
            isDHCPenabled: containerRuntime.networking.isDHCPenabled
        };
        data.input_data = containerRuntime.input_data;
    }
    return data;
}

function checkKeyboard(kbLayoutPrefs, data) {
    if (typeof kbLayoutPrefs.keyboardLayout != "undefined") {
        data.keyboardLayout = kbLayoutPrefs.keyboardLayout;
    }

    if (typeof kbLayoutPrefs.keyboardModel != "undefined") {
        data.keyboardModel = kbLayoutPrefs.keyboardModel;
    }
    return data;
}

export function createData(envId, archive, type, objectArchive, objectId, userId, softwareId, keyboardLayout, keyboardModel, containerRuntime, nic) {
    let data = {};
    data.type = type;
    data.archive = archive;
    data.environment = envId;
    data.object = objectId;
    data.objectArchive = objectArchive;
    data.userId = userId;
    data.software = softwareId;
    data.nic = nic;
    data = checkIfContainer(containerRuntime, data);
    data = checkKeyboard({keyboardLayout, keyboardModel}, data);
    return data;
}

export function createDataFromEnv(env, type, kbLayoutPrefs, containerRuntime) {
    return createData(env.envId,
        env.archive,
        type,
        env.objectArchive,
        env.objectId,
        env.userId,
        env.softwareId,
        kbLayoutPrefs? kbLayoutPrefs.keyboardLayout : undefined,
        kbLayoutPrefs? kbLayoutPrefs.keyboardModel : undefined,
        containerRuntime,
        env.nic)
}
