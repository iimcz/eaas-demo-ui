import {_fetch} from './utils.js';

export class Task {
    constructor(taskId, api, idToken = null) {

        if(!taskId)
            throw new Error("retrieving task ID failed");

        this.API_URL = api;
        this.idToken = idToken;
        this.taskId = taskId;
        this.pollStateIntervalId = setInterval(() => { this._pollState(); }, 1000);

        this.done = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;     
        });
    }

    async _pollState()
    {
        try {
            let result = await _fetch(`${this.API_URL}tasks/${this.taskId}`, "GET", null, this.idToken);
            
            if(result.status === "1")
            {
                clearInterval(this.pollStateIntervalId);
                throw new Error(result.message);
                
            }
            if(result.isDone)
            {
                this._resolve(result);
                clearInterval(this.pollStateIntervalId);
            }
        }
        catch(e)
        {
            this._reject(e);
        }
    }
}

export class WaitModal {
    constructor($uibModal) {
        this.uibModal = $uibModal;
        this.modal = undefined;
    }

    show(title, message) {
        this.modal = this.uibModal.open({
            animation: true,
            backdrop  : 'static',
            keyboard  : false,
            template: require ('./templates/waitModal.html'),
            controller: ["$scope", function($scope) {
                $scope.title = title;
                $scope.message = message;
            }],
            controllerAs: "importDlgCtrl"
        });
    }

    hide() {
        if(this.modal)
            this.modal.close();
    }

}