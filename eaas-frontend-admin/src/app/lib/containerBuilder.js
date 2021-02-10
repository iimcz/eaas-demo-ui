import {_fetch} from './utils.js';

export class ContainerBuilder {
    constructor(imageSource, urlString) {
        this.imageUrl = urlString;
        this.name = undefined;
        this.processArgs = null;
        this.processEnvs = null;
        this.inputFolder = null;
        this.outputFolder = null;
        this.imageType = imageSource;
        this.title = null;
        this.description = null;
        this.author = null;
        this.guiRequired = undefined;
        this.customSubdir = false;
        this.runtimeId = undefined;
        this.serviceContainer = false;
        this.enableNetwork = false;
    }

    setName(n) {
        this.name = n;
    }

    configureProcess(args, envs)
    {
        this.processArgs = args;
        this.processEnvs = envs;
    }

    setInputFolder(f)
    {
        this.inputFolder = f;
    }

    setOutputFolder(f)
    {
        this.outputFolder = f;
    }

    setTitle(t)
    {
        this.title = t;
    }

    setDescription(d)
    {
        this.description = d;
    }

    setAuthor(a)
    {
        this.author = a;
    }

    setRuntime(runtimeId)
    {
        this.runtimeId = runtimeId;
    }

    enableGui(b)
    {
        this.guiRequired = b;
    }

    setEnableNetwork(b) {
        this.enableNetwork = b;
    }

    setServiceContainer(b) {
        this.serviceContainer = b;
    }

    async build(api, idToken = null) 
    {
        return await _fetch(`${api}EmilContainerData/importContainer`, "POST", this, idToken);
    }
}

export class EmulatorBuilder {
    constructor(url, metadata=null) {
        this.imageUrl = url;
        this.metadata = metadata;
    }

    async build(api, idToken = null)
    {
        return await _fetch(`${api}EmilContainerData/importEmulator`, "POST", this, idToken);
    }
}

export class ContainerImageBuilder {
    constructor(url, containerSource) {
        this.urlString = url;
        this.containerType = containerSource;

        if(this.containerType != "rootfs" && 
            this.containerType != "simg" &&
            this.containerType != "dockerhub")
            throw new Error(`invalid container source '${containerSource}'. valid types are rootfs, simg, dockerhub, readymade`);

        this.tag = undefined;
        this.digest = undefined;
    }

    setTag(tag) {
        this.tag = tag;
    }

    setDigest(d)
    {
        this.digest = d;
    }

    async build(api, idToken = null) {
        return await _fetch(`${api}EmilContainerData/buildContainerImage`, "POST", this, idToken);
    }
    
}