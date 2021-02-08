import {Task} from './task.js';
import {_fetch} from './utils.js';

export class EaasImages
{
    constructor(api, idToken = null) {
        this.api = api;
        this.idToken = idToken;
    }

    async listRaw()
    {
        let list = await _fetch(`${this.api}/environment-repository/images-index`, "GET", null, this.idToken);
        if(!list.entries.entry)
            return [];
        return list.entries.entry;
    }

    async list()
    {
        const rawImages = await this.listRaw();
        let images = [];
        rawImages.forEach(function(element, i) {
            let image = {
                imageId : element.value.image.id,
                label : element.value.label,
                type: element.value.image.type,
            };
            images.push(image)
        });
        
        return images;
    }

    async roms() 
    {
        let rawImages = await this.listRaw();

        let images = [];
        rawImages.forEach(function(element, i) {
            console.log(element);
            let image = {
                imageId : element.value.image.id,
                label : element.value.label,
                type: element.value.image.type,
            };
    
            if(image.type === "roms")
                images.push(image);
        });
        return images;
    }

    async runtimeImages() 
    {
        const rawImages = await this.listRaw();
        let images = [];
        rawImages.forEach(function(element, i) {
            let image = {
                imageId : element.value.image.id,
                label : element.value.label,
                type: element.value.image.type,
            };
            if(image.type === "runtime")
                images.push(image);
        });
        return images;
    }

    async _createEmptyImage(size) 
    {
        try {
            let result = await _fetch(`${this.api}environment-repository/actions/create-image`, "POST", {
                size: size,
            }, this.idToken);
            return result;
        }
        catch (e) 
        {
            throw new Error("environment-repository/create-image: " +
                ' Request failed' 
                + e);
        }   
    }

    async delete(imageArchive, imageId) 
    {
        try {
            let result = await _fetch(`${this.api}environment-repository/actions/delete-image`, "POST", {
                imageArchive: imageArchive,
                imageId: imageId
            }, this.idToken);
            return result;
        }
        catch (e) 
        {
            throw new Error("environment-repository/delete-image: " +
                ' Request failed' 
                + e);
        }   
    }

    async import(url, label, type = undefined)
    {
        let result;

        if(type && type != "runtime" && type != "roms")
            throw new Error("Unknown image type");

        try  {
            result = await _fetch(`${this.api}environment-repository/actions/import-image`,  "POST", {
                url: url,
                label: label,
                imageType: type
            }, this.idToken);
            let task = new Task(result.taskId, this.api, this.idToken);
            let imageResult = await task.done;
            return imageResult.userData.imageId; 
        }
        catch(e) {
            throw new Error("environment-repository/create-image: " 
                +  ' Request failed: ' 
                + e + "\n original message: " + result);
        }
    }

    async createEmpty(size, label)
    {
        try {
            let createResult = await this._createEmptyImage( size, label);
            let task = new Task(createResult.taskId, this.api, this.idToken);
            let result = await task.done;
            return await this.import(result.userData.imageUrl, label);
        }
        catch(e)
        {
            console.log(e);
            throw new Error(e); 
        }
    }
}