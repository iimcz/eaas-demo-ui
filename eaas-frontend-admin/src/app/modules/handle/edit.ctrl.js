module.exports = ['$state', '$scope', '$stateParams', '$http', 'handleValue', 'localConfig', 'helperFunctions' , function($state, $scope, $stateParams, $http, handleValue, localConfig, helperFunctions) {
     $("#newHandleValue").hide();
     $("#editHandleValue").hide();
     var vm = this;
     vm.handleValue = handleValue.data.handleValue;
     vm.handle = $stateParams.handle;

     vm.deleteHandle = function () {
         jQuery.when(
             $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/deleteHandle?handle={0}", encodeURI($stateParams.handle)))).done(
             function () {
                 $state.go('admin.handles', {reload: true});
             })
     };

     vm.showHandleValue = function () {
         $("#newHandleValue").show();
         $("#editHandleValue").show();
         $("#showHandleValue").hide();
     };

     vm.editHandle = function () {
         jQuery.when(
             $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/modifyHandle", encodeURI($stateParams.handle)), {
                 handle: $stateParams.handle,
                 handleValue: document.getElementById("newHandleValue").value
             }),
             vm.handleValue = $stateParams.handle
         ).done(function () {
             $state.go('admin.edit-handle', $stateParams, {reload: true})
         });
     };
 }];