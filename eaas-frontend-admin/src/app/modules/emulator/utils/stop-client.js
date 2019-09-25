export async function stopClient($uibModal, onlyDisconnect, download, eaasClient) {
    
    async function _stop(doRelease) {
        const modal = $uibModal.open({
            backdrop: 'static',
            animation: false,
            backdropClass: "white-backdrop",
            template: require('../modals/wait.html')
        });
        if (doRelease)
        {
            console.log("releasing from stop ");
            await eaasClient.release();
        }   
        else
            await eaasClient.stopEnvironment(true);
        window.onbeforeunload = null;
        modal.close();
    }

    if (onlyDisconnect) {
        window.onbeforeunload = null;
        eaasClient.disconnect();
    } else if (download) {
        eaasClient.deleteOnUnload = false;
        window.onbeforeunload = null; 
        window.onunload = null;
        await _stop(false);
          
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
            const f = async () => {
                let _header = localStorage.getItem('id_token') ? {
                    "Authorization": "Bearer " + localStorage.getItem('id_token')
                } : {};
                const containerOutput = await fetch(window.eaasClient.getContainerResultUrl(), {
                    headers: _header,
                });
                const containerOutputBlob = await containerOutput.blob();
                // window.open(URL.createObjectURL(containerOutputBlob), '_blank');

                var downloadLink = document.createElement("a");
                downloadLink.href = URL.createObjectURL(containerOutputBlob);
                downloadLink.download = "uvi-output.zip";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                console.log("download done");
            };

            if (doDownload)
                await f();

            console.log("done...");
            await _stop(true);
            
        });
    } else {
        console.log("hard stop");
        _stop(true);
    }
}
