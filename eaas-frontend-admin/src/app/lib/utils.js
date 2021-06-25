export async function _fetch(url, method = "GET", obj, token = null) {
    let header = {};
    let body = undefined;
    if (token) header.authorization = `Bearer ${typeof token === "function" ? await token() : token}`;
    if (obj) {
        header['content-type'] = "application/json";
        body = JSON.stringify(obj);
    }

    const res = await fetch(url, {
        method,
        headers: header,
        body: body,
    });

    if (res.ok) {
        try {
            return await res.json();
        }
        catch (e) { return; }
    }

    throw new Error(`${res.status} @ ${url} : ${await res.text()}`);
}

export function confirmDialog($uibModal, header, text)
{
    let modal = $uibModal.open({
        animation: true,
        template: require('./modals/confirm.html'),
        backdrop: false,
        controller: ["$scope", function ($scope) {
            this.header = header;
            this.text = text;
        }],
        controllerAs: "confirmCtrl"
    });
    return modal.result;
}  

export async function checkOnlineStatus ()  {
    try {
        const online = await fetch("/admin");
        return online.status >= 200 && online.status < 300; // either true or false
    } catch (err) {
        return false; // definitely offline
    }
}