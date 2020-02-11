import {Task} from './task.js'
import {_fetch} from './utils.js'

export async function imagesListRaw($http, localConfig) 
{
    let list = await $http.get(localConfig.data.eaasBackendURL + "environment-repository/images-index");
    if(!list.data.entries.entry)
        return [];
    return list.data.entries.entry;
}

export async function imageList($http, localConfig)
{
    const rawImages = await imagesListRaw($http, localConfig);
    let images = [];
    rawImages.forEach(function(element, i) {
        let image = {
            imageId : element.value.image.id,
            label : element.value.label
        };
        images.push(image);
    });
    
    return images;
}

async function _createEmptyImage(localConfig, size) 
{
    try {
        let result = await _fetch(`${localConfig.data.eaasBackendURL}environment-repository/actions/create-image`, "POST", {
            size: size,
        });
        return result;
    }
    catch (e) 
    {
        throw new Error("environment-repository/create-image: " +
             ' Request failed' 
            + e);
    }   
}

export async function deleteImage(localConfig, imageArchive, imageId) 
{
    try {
        let result = await _fetch(`${localConfig.data.eaasBackendURL}environment-repository/actions/delete-image`, "POST", {
            imageArchive: imageArchive,
            imageId: imageId
        });
        return result;
    }
    catch (e) 
    {
        throw new Error("environment-repository/delete-image: " +
             ' Request failed' 
            + e);
    }   
}


export async function importImage(localConfig, url, label)
{
    try  {
        let result = await _fetch(`${localConfig.data.eaasBackendURL}environment-repository/actions/import-image`,  "POST", {
            url: url,
            label: label
        });
        let task = new Task(result.taskId, localConfig.data.eaasBackendURL);
        let imageResult = await task.done;
        return imageResult.imageId; 
    }
    catch(e) {
        throw new Error("environment-repository/create-image: " 
            +  ' Request failed: ' 
            + e);
    }
}

export async function importEmptyImage(localConfig, size, label)
{
    try {
        let createResult = await _createEmptyImage(localConfig, size, label);
        let task = new Task(createResult.taskId, localConfig.data.eaasBackendURL);
        let userData = await task.done;
        return await importImage(localConfig, userData.imageUrl, label);
    }
    catch(e)
    {
        throw new Error(e); 
    }
}