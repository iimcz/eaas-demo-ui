module.exports = ['$state', '$scope', '$stateParams', 'objectList', 'localConfig', function ($state, $scope, $stateParams, objectList, localConfig) {
    console.log("local ", localConfig);
    var vm = this;
    vm.config = localConfig.data;
    vm.objectList = objectList.data.objects;

    if (objectList.data.status !== "0") {
        $state.go('error', {
            errorMsg: {
                title: "Load Environments Error " + objectList.data.status,
                message: objectList.data.message
            }
        });
        return;
    }

    console.log(vm.objectList);

    $scope.onPageSizeChanged = function () {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {
                headerName: "title", field: "title"
            },
            {
                headerName: "description", field: "description", cellRenderer: descriptiponRenderer, suppressSorting: true,
                suppressMenu: true
            },
            {
                headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        return `<button id="single-button" ui-sref="admin.edit-object-characterization({objectId: data.id, userDescription: data.description})" type="button" class="dropbtn">
                  {{'OBJECTS_DETAILS'| translate}}
                </button>`;
    }
    function descriptiponRenderer(params) {
        params.$scope.selected = $scope.selected;
        return `<abbr title="{{data.description}}">{{data.description}}</abbr>`;
    }

    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: vm.objectList,
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
        paginationPageSize: 20,
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