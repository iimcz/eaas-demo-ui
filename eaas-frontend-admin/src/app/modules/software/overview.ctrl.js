module.exports = ['softwareList', '$scope', '$stateParams', function (softwareList, $scope, $stateParams) {
   var vm = this;
   vm.swList = softwareList.data.descriptions;

   console.log(vm.swList);

    vm.initColumnDefs = function () {
        return [
            {headerName: '', width: 41, checkboxSelection: true, suppressSorting: true,
                suppressMenu: true},
            {headerName: "ID", field: "id"},
            {headerName: "Label", field: "label"},
            {headerName: "Operating System", field: "isOperatingSystem"},
            {headerName: "Edit", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true}
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.switchAction = switchAction;
        params.$scope.selected = $scope.selected;
        params.$scope.landingPage = vm.landingPage;

        return  `<button id="single-button" type="button" class="dropbtn">
                  {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                </button>`;

    }

    function onRowSelected(event) {
        if ($scope.gridOptions.api.getSelectedRows().length > 0)
            $('#overviewDeleteButton').show();
        else
            $('#overviewDeleteButton').hide();
    }

    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: vm.swList,
        rowHeight: 31,
        groupUseEntireRow:  true,
        rowSelection: 'multiple',
        angularCompileRows: true,
        rowMultiSelectWithClick: true,
        enableColResize: true,
        enableSorting: true,
        enableFilter: true,
        enableCellChangeFlash: true,
        onRowSelected: onRowSelected,
        suppressRowClickSelection: true,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: true,
        animateRows: true,
        onGridReady: function (params) {
            $scope.gridOptions.api.sizeColumnsToFit();
            },
        pagination: true,
        paginationPageSize: 20,
        paginationNumberFormatter: function(params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };


    if (softwareList.data.status !== "0") {
       $state.go('error', {errorMsg: {title: "Load Environments Error " + softwareList.data.status, message: softwareList.data.message}});
       return;
   }

   vm.softwareList = softwareList.data.descriptions;

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, gridOptions);
        gridOptions.api.sizeColumnsToFit();
    });
}];