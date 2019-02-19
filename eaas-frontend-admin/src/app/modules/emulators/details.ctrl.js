module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, $uibModal, helperFunctions, nameIndexes, REST_URLS) {

        // if (typeof $stateParams.emulatorName == "undefined" || $stateParams.emulatorName == null) {
        //     growl.error("Error!\nEmulator name is not given");
        //     $state.go('admin.emulators', {}, {reload: true});
        // }


        $('#json-renderer').jsonViewer($stateParams.entries, {withQuotes: false});


    }];