module.exports = ["$http", "$scope", "$state", "$stateParams", "growl", "localConfig", "$timeout", "helperFunctions", "Upload", "REST_URLS", "$uibModal", "repositoriesList",
    function($http, $scope, $state, $stateParams, growl, localConfig, $timeout, helperFunctions, Upload, REST_URLS, $uibModal, repositoriesList) {

       var vm = this;

       vm.importRequest = {
          objectIDs : [],
          archive: null
       };

       vm.repositories = repositoriesList.data.archives;

       vm.add = function()
       {
           console.log(vm.selectedFiles);
           if(!vm.allFiles)
               vm.allFiles = [];

           vm.allFiles = vm.allFiles.concat(vm.selectedFiles);
       };

       vm.import = function()
       {
           vm.importRequest.archive = vm.selectedArchive;

           console.log(vm.importRequest);

           $http.post(localConfig.data.eaasBackendURL + REST_URLS.syncObjectsUrl, vm.importRequest).then(function(response) {
              if (response.data.status === "0") {
                  growl.success(response.data.message);
                  $state.go('admin.object-overview', {}, {reload: true});

              } else {
                  growl.error(response.data.message, {title: 'Error ' + response.data.status});
              }
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

           if (vm.allFiles && vm.allFiles.length) {
               var uploadCnt = 0;
               for (var i = 0; i < vm.allFiles.length; i++) {
                 uploadCnt++;
                 Upload.upload({
                   url: localConfig.data.eaasBackendURL + "EmilObjectData/upload",
                         data: {file: vm.allFiles[i], 'mediaType' : vm.mediumType, 'objectId' : vm.objectId}
                     }).then(function (resp) {
                         console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                         uploadCnt--;
                         if(uploadCnt === 0) {
                           $http.post(localConfig.data.eaasBackendURL + REST_URLS.pushUploadUrl, {
                                                       objectId: vm.objectId
                           }).then(function(response) {
                               if (response.data.status === "0") {
                                   $state.go('admin.object-overview', {}, {reload: true});
                               }
                               else
                               {
                                   $state.go('error', {errorMsg: {title: "Load Environments Error " + response.data.status, message: response.data.message}});
                               }
                               modal.close();
                           });
                         }
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
           }

        }
}];