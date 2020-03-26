module.exports = ['$state', '$http', '$scope',  'localConfig', '$uibModal', 'kbLayouts', 'REST_URLS',
    function ($state, $http, $scope, localConfig, $uibModal, kbLayouts, REST_URLS) {

        var vm = this;

        vm.showSetKeyboardLayoutDialog = function () {
            $uibModal.open({
                animation: true,
                template: require('./modals/set-keyboard-layout.html'),
                resolve: {
                    kbLayouts: function () {
                        return kbLayouts; // refers to outer kbLayouts variable
                    }
                },
                controller: "SetKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
            });
        };

        vm.syncImages = function () {
            $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncImagesUrl).then(function (response) {
                    if (response.data.status === "0") {
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                }
            );
        };

    }
];
 