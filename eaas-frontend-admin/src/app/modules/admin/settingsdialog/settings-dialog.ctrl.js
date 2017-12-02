module.exports = ['$state', '$http', '$scope', '$uibModal', 'localConfig', 'growl', 'REST_URLS', function($state, $http, $scope, $uibModal, localConfig, growl, REST_URLS) {
    var vm = this;

    vm.importEnvs = function() {
        $scope.$close();

        $http.get(localConfig.data.eaasBackendURL + REST_URLS.initEmilEnvironmentsURL).then(function(response) {
                if (response.data.status === "0") {
                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                    growl.success(response.data.message);
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            }
        );
    };

    vm.syncObjects = function() {
        $scope.$close();

        $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncObjectsUrl).then(function(response) {
                if (response.data.status === "0") {
                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                    growl.success(response.data.message);
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            }
        );
    };

    vm.syncImages = function() {
        $scope.$close();

        $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncImagesUrl).then(function(response) {
                if (response.data.status === "0") {
                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                    growl.success(response.data.message);
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                }
            }
        );
    };

    vm.showSetKeyboardLayoutDialog = function() {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/set-keyboard-layout-dialog.html',
            controller: "setKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
        });
    };
}];