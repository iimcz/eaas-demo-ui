export async function stopClient($uibModal, onlyDisconnect, download, eaasClient) {
    
    async function _stop(doRelease) {
        const modal = $uibModal.open({
            backdrop: 'static',
            animation: false,
            backdropClass: "white-backdrop",
            template: require('../modals/wait.html')
        });
        if (doRelease)
            await eaasClient.release();
        else
            await eaasClient.stopEnvironment(true);
        window.onbeforeunload = null;
        modal.close();
    }

    if (onlyDisconnect) {
        window.onbeforeunload = null;
        eaasClient.disconnect();
    } else if (download) {
        await _stop(false);
        window.onbeforeunload = null;   
        const modal = $uibModal.open({
            animation: false,
            template: require('../modals/download.html'),
            controller: ['$scope', function ($scope) {

                this.download = function () {
                    eaasClient.deleteOnUnload = false;
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
                downloadLink.download = "output-data.tar.gz";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            };

            if (doDownload)
                await f();
                
            eaasClient.deleteOnUnload = true;
            // window.onbeforeunload = null;
            await _stop(true);
            
        });
    } else {
        _stop(true);
    }
}
