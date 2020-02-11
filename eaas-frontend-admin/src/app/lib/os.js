import {_fetch} from './utils.js'
import { is } from '@uirouter/core';

export async function osLocalList()
{
    return _fetch("osList.json", "GET", null);
}
export function getOsById(osList, id)
{
    for (var i = 0; i < osList.length; i++) {
        if (osList[i].id === id)
        {
            return osList[i];
        }
    }
}

export function getOsLabelById(osList, id) {
    let os = getOsById(osList, id);
    if(os)
        return os.label;
    else
        return "n.a.";
}

