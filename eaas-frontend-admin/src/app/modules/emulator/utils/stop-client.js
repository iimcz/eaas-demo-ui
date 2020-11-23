export async function stopClient($uibModal, download, eaasClient) {
    
    async function _stop(doRelease) {
        let result = null;
       
        const modal = $uibModal.open({
            backdrop: 'static',
            animation: false,
            backdropClass: "white-backdrop",
            template: require('../modals/wait.html')
        });

        if (doRelease)
        {
            console.log("releasing from stop ");
            await eaasClient.release(true);
        }   
        else {
            console.log("trying to stop...");
            result = await eaasClient.stop();
        }

        window.onbeforeunload = null;
        modal.close();
        return result;
    }

    if (download) {
        eaasClient.deleteOnUnload = false;
        window.onbeforeunload = null; 
        window.onunload = null;
        let result = await _stop(false);
        
        console.log(result);
        const modal = $uibModal.open({
            animation: false,
            template: require('../modals/download.html'),
            controller: ['$scope', function ($scope) {

                this.download = function () {
                    modal.close(true);
                };
            }],
            controllerAs: "downloadDialogCtrl"
        });

        await modal.closed.then(async () => {
            let doDownload = await modal.result;
            const f = async (id, __result) => {
                let _header = localStorage.getItem('id_token') ? {
                    "Authorization": "Bearer " + localStorage.getItem('id_token')
                } : {};
                const containerOutput = await fetch(__result.url, {
                    headers: _header,
                });

                const containerOutputBlob = await containerOutput.blob();
                // window.open(URL.createObjectURL(containerOutputBlob), '_blank');

                var downloadLink = document.createElement("a");
                downloadLink.href = URL.createObjectURL(containerOutputBlob);
                console.log(`uvi-output-session-${id}.zip`);
                downloadLink.download = `uvi-output-session-${id}.zip`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            };

            if (doDownload)
            {
                result.forEach(async (e) => {
                    await f(e.id, e.result);
                })
            }
        });
    } else {
        console.log("hard stop")
        _stop(true);
    }
}
