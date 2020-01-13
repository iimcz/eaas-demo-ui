import {imageList, importEmptyImage, importImage} from '../../lib/images.js'
import {WaitModal} from '../../lib/task.js'

module.exports = ['$state', '$scope', '$http', 'localConfig', '$uibModal',
    function ($state, $scope, $http, localConfig, $uibModal)
{
    var vm = this;
    vm.config = localConfig.data;
    vm.pageSize = "10";
    vm.imageList = [];

    vm.updateData = function () {
        if ($scope.gridOptions && $scope.gridOptions.api != null) {
            $scope.gridOptions.api.setRowData(vm.imageList);
            $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            $scope.gridOptions.api.sizeColumnsToFit();
        }
    };

    vm.updateTable = async function()
    {
        if ($scope.gridOptions && $scope.gridOptions.api)
            $scope.gridOptions.api.setRowData(null);
        vm.imageList = await imageList($http, localConfig);
        vm.updateData();
    };
    vm.updateTable(0, "default");

    vm.importDlg = function () {
        $uibModal.open({
            animation: true,
            template: require ('./modals/import.html'),
            controller: ["$scope", "localConfig", function($scope, localConfig) {

                this.import = async () => 
                {
                    console.log(this.label);
                    console.log(this.hdsize);
                    console.log(this.hdurl);
                    console.log(this.mode);

                    let waitModal = new WaitModal($uibModal);
                    waitModal.show("Import", "Please wait");
                    let result = undefined;
                    if(this.mode ==='create')
                        result = await importEmptyImage(localConfig, this.hdsize, this.label);
                    else
                        result = await importImage(localConfig, this.hdurl, this.label);
                    waitModal.hide();
                    console.log(result);
                    
                }
            }],
            controllerAs: "importDlgCtrl"
        });
    }

    $scope.onPageSizeChanged = function () {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "imageId"},
            {
                headerName: "Label", field: "label", sort: "asc"
            },
            {
                headerName: "", field: "Actions", cellRenderer: detailsBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function detailsBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        params.$scope.ctrl = vm;

        params.$scope.changeClass = function (id) {
            if (($("#dropdowm" + id).is(":visible"))) {
                return "dropbtn2";
            } else {
                return "dropbtn";
            }
        };

        let imageActions = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"
                ng-class="changeClass(data.id)"
                uib-dropdown-toggle
                ng-disabled="disabled">
                  {{\'CHOOSE_ACTION\'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                  <li role="menuitem">
                    <a class="dropdown-content" ng-click="ctrl.details(data.imageId)">details</a>
                  </li>
                  <li role="menuitem">
                    <a class="dropdown-content"
                        ng-click="ctrl._delete(data.imageId)">delete</a></li>
                </ul>
             </div>`;
        return imageActions;
    }

    vm._delete = function(imageId) {

        if (!window.confirm(`Please confirm deleting this disk?`))
            return false;
    }

    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
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
        pagination: true,
        paginationPageSize: 10,
        paginationNumberFormatter: function (params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, gridOptions);
        gridOptions.api.sizeColumnsToFit();
    });
}];
