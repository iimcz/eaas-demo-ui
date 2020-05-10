import {_fetch} from '../../lib/utils'

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

        vm.migrateDb = async function () {
            try {
                let result = await _fetch(`${localConfig.data.eaasBackendURL}/environment-repository/db-migration`, "GET", 
                    null, localStorage.getItem('id_token'));
                console.log(result);
            }
            catch(e) {
                console.log(e);
                $state.go('error', {});
            }
        };

        vm.downloadLogUrl = localConfig.data.eaasBackendURL + "error-report";
    }
];
 