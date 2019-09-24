module.exports = ["$http", "$scope", "$state", "$stateParams", "growl", "localConfig", "$timeout", "helperFunctions", "Upload", "REST_URLS", "$uibModal",
    function($http, $scope, $state, $stateParams, growl, localConfig, $timeout, helperFunctions, Upload, REST_URLS, $uibModal) {

        var vm = this;
        vm.classificationFinished = false;
        vm.classificationFailed = false;
        vm.environmentList = [];

        vm.start = function () {
            $state.go('admin.emulator', {
                envId: vm.selectedEnvironmentId,
                enableDownload: vm.writeable,
                uvi: {
                     url: vm.url,
                     filename: vm.filename,
                     writeable: vm.writeable,
                     environments: vm.environmentList,
                 }
            }, {reload: true});
        }

        vm.checkState = function(_taskId, _modal, url, filename)
        {
           $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function(response){
               if(response.data.status == "0")
               {
                   if(response.data.isDone)
                   {
                       _modal.close();
                       if(response.data.object) {
                           console.log(response);
                            let classificationResult = JSON.parse(response.data.object);
                            console.log(classificationResult);
                            if(!classificationResult.environmentList || classificationResult.environmentList.length === 0)
                            {
                                console.log("no environmemnt found");
                                vm.classificationFailed = true;
                            }
                            else
                            {
                                vm.selectedEnvironment = classificationResult.environmentList[0].label;
                                vm.selectedEnvironmentId = classificationResult.environmentList[0].id;
                                vm.environmentList = classificationResult.environmentList;
                            }
                            
                            vm.classificationFinished = true;
                           
                            if(classificationResult.fileFormatMap) {
                                let objectId = classificationResult.objectId;
                                if(objectId) {
                                    let ffmts = classificationResult.fileFormatMap[objectId];
                                    if(ffmts && ffmts.fileFormats && ffmts.fileFormats.length > 0)
                                    {
                                        vm.fileFormat = ffmts.fileFormats[0].puid;
                                        vm.fileFormatLabel = ffmts.fileFormats[0].name;
                                    }
                                } 
                            }
                            vm.filename = filename;
                            vm.url = url;
                       }
                   }
                   else
                       $timeout(function() {vm.checkState(_taskId, _modal, url, filename);}, 2500);
               }
               else
               {
                   console.log(response);
                   _modal.close();
               }
           });
       };

    vm.runUVI = function(modal, url, filename)
    {
        $http.post(localConfig.data.eaasBackendURL + `classification` , {
            url: url,
            filename: "test"
            }).then(function(response) {
                vm.checkState(response.data.taskId, modal, url, filename);
            }, function(error) {
                console.log(error);
                modal.close();
        });
    }
    vm.upload = function()
       {
           var uploadInfo = {
               title : "uploading ",
               msg : "please wait"
           };

           var modal = $uibModal.open({
               animation: true,
               template: require('./modals/wait.html'),
               controller: ["$scope", function($scope) {
                   this.info = uploadInfo;
               }],
               controllerAs: "waitMsgCtrl"
           });
            Upload.upload({
            url: localConfig.data.eaasBackendURL + "upload",
                data: {file: vm.selectedFile}
            })
            .then(function (resp) {
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data.userDataUrl);
                vm.runUVI(modal, resp.data.uploads[0], resp.config.data.file.name);
            }, function (resp) {
                console.log('Error status: ' + resp.status);
                modal.close();
                $state.go('error', {errorMsg: {title: "Load Environments Error " + resp.data.status, message: resp.data.message}});
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                uploadInfo.title = "Uploading Object(s) " + evt.config.data.file.name;
                uploadInfo.msg = 'upload: ' + evt.config.data.file.name + ' (' + progressPercentage + '%)';
            });
    } 
}];