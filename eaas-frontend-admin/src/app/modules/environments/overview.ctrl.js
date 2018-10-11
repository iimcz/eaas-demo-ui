module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate',
    '$uibModal', 'softwareList', 'helperFunctions', 'containerEnvironmentList', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams, environmentList, objectEnvironmentList,
              localConfig, growl, $translate, $uibModal, softwareList, helperFunctions, containerEnvironmentList, REST_URLS) {




        var vm = this;

        vm.config = localConfig.data;
        vm.landingPage = localConfig.data.landingPage;
        vm.view = 0;
        if($stateParams.showContainers)
            vm.view = 2;
        else if($stateParams.showObjects)
            vm.view = 1;

        if (environmentList.data.status !== "0") {
            $state.go('error', {errorMsg: {title: "Load Environments Error " + environmentList.data.status, message: environmentList.data.message}});
            return;
        }

        vm.exportEnvironment = function(envId) {

            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.exportEnvironmentUrl, envId))
                .then(function(response) {
                    if (response.data.status === "0") {
                        growl.success("export successful");
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
                });

        };

        vm.addSoftware = function(envId) {
            $uibModal.open({
                animation: true,
                template: require('./modals/select-sw.html'),
                controller: ["$scope", function($scope) {
                    this.envId = envId;
                    this.software = softwareList.data.descriptions;
                    this.returnToObjects = $stateParams.showObjects;
                }],
                controllerAs: "addSoftwareDialogCtrl"
            });
        };

        var confirmDeleteFn = function(envId)
        {
            console.log("confirmed");
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                envId: envId,
                deleteMetaData: true,
                deleteImage: true,
                force: true
            }).then(function(_response) {
                if (_response.data.status === "0") {
                    // remove env locally
                    vm.envs = vm.envs.filter(function(env) {
                        return env.envId !== envId;
                    });
                    $rootScope.chk.transitionEnable = true;
                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                    $state.go('admin.standard-envs-overview', {}, {reload: true});
                }
                else {
                    $rootScope.chk.transitionEnable = true;
                    growl.error(_response.data.message, {title: 'Error ' + _response.data.status});
                    $state.go('admin.standard-envs-overview', {}, {reload: true});

                }
            });
        };


        vm.deleteContainer = function (envId) {
            $rootScope.chk.transitionEnable = false;
            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteContainerUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                }).then(function (response) {
                    if (response.data.status === "0") {
                        // remove env locally
                        vm.envs = vm.envs.filter(function (env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                    else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                });
            }
        };

        vm.deleteEnvironment = function(envId) {
            $rootScope.chk.transitionEnable = false;

            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                }).then(function(response) {
                    if (response.data.status === "0") {
                        // remove env locally
                        vm.envs = vm.envs.filter(function(env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                    else if (response.data.status === "2") {

                        $uibModal.open({
                            animation: true,
                            templateUrl: './modals/confirm-delete.html',
                            controller: ["$scope", function($scope) {
                                this.envId = envId;
                                this.confirmed = confirmDeleteFn;
                            }],
                            controllerAs: "confirmDeleteDialogCtrl"
                        });
                    }
                    else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                });
            }
        };
        vm.envs = environmentList.data.environments;
        vm.objEnvs = objectEnvironmentList.data.environments;
        vm.containerEnvs = containerEnvironmentList.data.environments;
        vm.showObjects = $stateParams.showObjects;
        vm.showContainers = $stateParams.showContainers;



        var columnDefs = [
            {headerName: "Name", field: "name"},
            {headerName: "ID", field: "id"},
            {headerName: "Emulator", field: "emulator"}
        ];

        var rowData = [];
        vm.envs.forEach(function(element) {
            rowData.push({name: element.title, id: element.envId, emulator: element.emulator })
        });

        $scope.onPageSizeChanged = function() {
            var value = document.getElementById('page-size').value;
            $scope.gridOptions.api.paginationSetPageSize(Number(value));
        };

        $scope.gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            rowSelection: 'multiple',
            rowMultiSelectWithClick: true,
            enableColResize: true,
            enableSorting: true,
            enableFilter: true,
            domLayout: 'autoHeight',
            animateRows: true,
            onGridReady: function (params) {
                $scope.gridOptions.api.sizeColumnsToFit();
            },
            pagination: true,
            paginationPageSize: 10,
            paginationNumberFormatter: function(params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };

    }];