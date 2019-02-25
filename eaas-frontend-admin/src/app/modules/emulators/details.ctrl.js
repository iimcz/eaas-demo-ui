module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, $uibModal, helperFunctions, nameIndexes, REST_URLS) {
        var vm = this;

        if (typeof $stateParams.entries == "undefined" || $stateParams.entries == null) {
            growl.error("Error!\nEmulator name is not given");
            $state.go('admin.emulators', {}, {reload: true});
        } else {
            vm.title = $stateParams.emuName.toUpperCase();
        }
        vm.nameIndexes = nameIndexes.data;
        if ($stateParams.entries.length > 0)
            vm.nameIndexes.aliases.entry.find(function (aliasElement) {
                if (aliasElement.value.name === $stateParams.entries[0].value.name && aliasElement.value.alias === "latest") {
                    vm.latestVersion = aliasElement.value.version;
                    return;
                }
            });

        vm.initRowData = function () {
            let rowData = [];
            $stateParams.entries.forEach(function (entry) {
                rowData.push({
                    version: entry.value.version,
                    id: entry.value.image.id,
                    ociSourceUrl: entry.value.provenance.ociSourceUrl.replace('docker://',''),
                    versionTag: entry.value.provenance.versionTag,
                    isLatest: entry.value.version === vm.latestVersion,
                    entry: entry
                })
            });
            return rowData;
        };

        function editBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            params.$scope.showJsonDialog = vm.showJsonDialog;

            return `<button id="single-button" type="button" ng-click="showJsonDialog(data.entry)" class="dropbtn">
                  JSON
                </button>`;
        }

        vm.initColumnDefs = function () {
            return [
                {headerName: "User version", field: "version"},
                {headerName: "ID", field: "id"},
                {headerName: "ociSourceUrl", field: "ociSourceUrl"},
                {headerName: "Docker tag", field: "versionTag"},
                {
                    headerName: "Latest", field: "isLatest",
                    cellStyle: function (params) {
                        if (params.value)
                            return {
                                backgroundColor: '#aaffaa' // light green
                            }
                    }
                },
                {
                    headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                    suppressMenu: true
                }
            ];
        };

        vm.showJsonDialog = function (entry) {
            $uibModal.open({
                animation: false,
                resolve: {
                    entry: function () {
                        return entry;
                    }
                },
                template: require('./modals/emulators-json.modal.html'),
                controller: "EmulatorsJsonModalController as jsonDialogCtrl"
            });
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
    }];