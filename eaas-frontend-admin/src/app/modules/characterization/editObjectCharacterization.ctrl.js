module.exports = ['$scope', '$state', '$stateParams', '$uibModal', '$http',
                     'localConfig', 'objEnvironments', 'environmentList', 'growl', '$translate', 'metadata', 'helperFunctions', 'REST_URLS',
                      function ($scope, $state, $stateParams, $uibModal, $http, localConfig, objEnvironments, environmentList, growl, $translate, metadata, helperFunctions, REST_URLS) {
     var vm = this;

     vm.objEnvironments = objEnvironments.data.environmentList;
     vm.objectId = $stateParams.objectId;
     vm.metadata = metadata.data;
     vm.suggested = objEnvironments.data.suggested;
     vm.fileFormats = objEnvironments.data.fileFormats;

     vm.hasEnvironments = false;
     if(objEnvironments && objEnvironments.length > 0)
         vm.hasEnvironments = false;

     vm.automaticCharacterization = function(updateClassification, updateProposal) {
         if (window.confirm($translate.instant('JS_START_CHAR'))) {
             $("html, body").addClass("wait");
             $(".fullscreen-overlay-spinner").show();

             $http.get(localConfig.data.eaasBackendURL
                 + helperFunctions.formatStr(REST_URLS.objectEnvironmentsUrl, $stateParams.objectId, updateClassification, updateProposal))
                 .then(function(response) {
                 if (response.data.status !== "0") {
                     growl.error(response.data.message, {title: 'Error ' + response.data.status});
                     return;
                 }
                 vm.objEnvironments.length = 0;
                 vm.objEnvironments.push.apply(vm.objEnvironments, response.data.environmentList);
             })['finally'](function() {
                 $("html, body").removeClass("wait");
                 $(".fullscreen-overlay-spinner").hide();
                 $state.reload();
             });
         }
     };

     vm.openDefaultEnvDialog = function(osId, osLabel) {
         $uibModal.open({
             animation: true,
             template: require('./modals/set-default-environment.html'),
             controller: function($scope, helperFunctions, REST_URLS) {
                 this.defaultEnv = null;
                 this.environments = environmentList.data.environments;
                 this.osId = osId;
                 this.osLabel = osLabel;

                 this.setEnvironment = function() {
                     $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.setDefaultEnvironmentUrl, this.osId, this.defaultEnv.envId))
                         .then(function(response) {
                             if (response.data.status !== "0") {
                                 growl.error(response.data.message, {title: 'Error ' + response.data.message});
                                 $scope.$close();
                             }
                             else {
                                 console.log("set default env for " + osId + " defaultEnv " + this.defaultEnv.envId);
                             }
                     })['finally'](function() {
                         $scope.$close();
                         $state.reload();
                     });

                 };
             },
             controllerAs: "setDefaultEnvDialogCtrl"
         });
     };

     vm.openAddEnvDialog = function() {
         $uibModal.open({
             animation: true,
             template: require('./modals/add-environment.html'),
             controller: function($scope) {
                 this.newEnv = null;
                 this.environments = environmentList.data.environments;
                 this.addEnvironment = function() {
                     // check if environment was already added
                     for (var i = 0; i < vm.objEnvironments.length; i++) {
                         if (vm.objEnvironments[i].id === this.newEnv.envId) {
                             growl.warning($translate.instant('JS_ENV_ERR_DUP'));
                             return;
                         }
                     }

                     vm.objEnvironments.push({
                         "id": this.newEnv.envId,
                         "label": this.newEnv.title
                     });
                     $scope.$close();
                 }
             },
             controllerAs: "addEnvDialogCtrl"
         });
     };

     vm.removeEnvironment = function(env) {
         if (vm.objEnvironments.length === 1) {
             growl.error($translate.instant('JS_ENV_ERR_ZERO'));
             return;
         }

         var i;
         for (i = 0; i < vm.objEnvironments.length; i++) {
             if (vm.objEnvironments[i].id === env.id) {
                 break;
             }
         }
         vm.objEnvironments.splice(i, 1);
     };

         vm.resetChanges = function()
         {
             if (window.confirm($translate.instant('CHAR_CONFIRM_RESET_T'))) {
                 $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
                     objectId: $stateParams.objectId,
                     environments: []
                 }).then(function() {
                     $state.go('wf-s.object-overview');
                 });
             }
         }

     vm.saveCharacterization = function() {
         $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
             objectId: $stateParams.objectId,
             environments: vm.objEnvironments
         }).then(function() {
             $state.go('wf-s.object-overview');
         });
     };
 }];