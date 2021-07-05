import {_fetch} from './utils.js';

export async function emulatorsList()
{
    return await _fetch("emulators.json", "GET", null);
}

