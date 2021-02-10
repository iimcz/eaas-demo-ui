import {
    ContainerImageBuilder,
    EmulatorBuilder,
} from "../../lib/containerBuilder.js";
import {
    WaitModal,
    Task
} from "../../lib/task.js";

module.exports = ['$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate', '$timeout', '$uibModalStack',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($http, $state, $scope, $stateParams,
        localConfig, growl, $translate, $timeout, $uibModalStack, $uibModal, helperFunctions, nameIndexes, REST_URLS) {
        var vm = this;
        vm.nameIndexes = nameIndexes.data;
        vm.emulators = window.EMULATORS_LIST;
        vm.initRowData = function () {
            let rowData = [];
            for (let i = 0; i < window.EMULATORS_LIST.length; i++) {
                let rowElement = {};
                rowElement.entries = [];
                rowElement.name = window.EMULATORS_LIST[i];
                if (vm.nameIndexes.entries.entry) {
                    vm.nameIndexes.entries.entry.forEach(
                        (element) => {
                            if (element.key.indexOf(window.EMULATORS_LIST[i]) !== -1) {
                                rowElement.entries.push(element);
                            }
                        }
                    );
                }
                rowData.push(rowElement);

            }
            return rowData;
        };

        function editBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            return `<button id="single-button" ui-sref="admin.emulators_details({entries: data.entries, emuName: data.name})" type="button" class="dropbtn">
                  {{'EMULATORS_DETAILS'| translate}}
                </button>`;
        }

        vm.import = function () {
            $uibModal.open({
                animation: false,
                template: require('./modals/import-emulator.html'),
                controller: ["$scope", function ($scope) {

                    var _vm = this;
                    _vm.doImport = async function () {
                        const api = localConfig.data.eaasBackendURL;
                        const idToken = localStorage.getItem('id_token');
                        if (_vm.imageUrl) {
                            try {
                                _vm.modal = $uibModal.open({
                                    backdrop: 'static',
                                    animation: true,
                                    templateUrl: 'partials/wait.html'
                                });
                                let imageBuilder = new ContainerImageBuilder(_vm.imageUrl, "dockerhub");
                                imageBuilder.setTag((_vm.tag) ? _vm.tag : "latest");
                                let imageBuilderResult = await imageBuilder.build(api, idToken);
                                let task = new Task(imageBuilderResult.taskId, api, idToken);

                                let buildResult = await task.done;
                                let object = JSON.parse(buildResult.object);
                                console.log(object);

                                let emulatorBuilder = new EmulatorBuilder(object.containerUrl, object.metadata);
                                let importResult = await emulatorBuilder.build(api, idToken);
                                task = new Task(importResult.taskId, api, idToken);
                                await task.done;
                                $uibModalStack.dismissAll();
                            } catch (e) {
                                console.log(e);
                                $state.go('error', {
                                    errorMsg: {
                                        title: e
                                    }
                                });
                                $uibModalStack.dismissAll();
                            }
                        } else {
                            try {
                                _vm.modal = $uibModal.open({
                                    backdrop: 'static',
                                    animation: true,
                                    templateUrl: 'partials/wait.html'
                                });
                                let builder = new EmulatorBuilder(_vm.qcowImageUrl);
                                let builderResult = await builder.build(api, idToken);
                                let task = new Task(builderResult.taskId, api, idToken);

                                await task.done;
                                $uibModalStack.dismissAll();
                            } catch (e) {
                                console.log(e); 
                                $state.go('error', {
                                    errorMsg: {
                                        title: 'Error ' + e
                                    }
                                });
                                $uibModalStack.dismissAll();
                            }
                        }
                    };
                }],
                controllerAs: "importEmulatorCtrl"
            });
        };

        vm.initColumnDefs = function () {
            return [{
                    headerName: "Name",
                    field: "name"
                },
                {
                    headerName: "Number of images",
                    valueGetter: function aPlusBValueGetter(params) {
                        return params.data.entries.length;
                    }
                },
                {
                    headerName: "",
                    field: "edit",
                    cellRenderer: editBtnRenderer,
                    suppressSorting: true,
                    suppressMenu: true
                }
            ];
        };

        $scope.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowData: vm.initRowData(),
            rowHeight: 31,
            groupUseEntireRow: true,
            rowSelection: 'multiple',
            angularCompileRows: true,
            rowMultiSelectWithClick: true,
            enableColResize: true,
            enableSorting: true,
            enableFilter: true,
            enableCellChangeFlash: true,
            suppressRowClickSelection: true,
            domLayout: 'autoHeight',
            suppressHorizontalScroll: true,
            animateRows: true,
            onGridReady: function (params) {
                $scope.gridOptions.api.sizeColumnsToFit();
            },
            pagination: false,
            paginationNumberFormatter: function (params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };
    }
];