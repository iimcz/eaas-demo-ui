module.exports = ['softwareList', '$scope', '$stateParams', function (softwareList, $scope, $stateParams) {
   var vm = this;
   vm.swList = softwareList.data.descriptions;

   vm.pageSize = "25";

    $scope.onPageSizeChanged = function() {
        vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {headerName: "Name", field: "label", sort: "asc"},
            {headerName: "Operating System", field: "isOperatingSystem"},
            {headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true}
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        return  `<button id="single-button" ui-sref="admin.edit-object-characterization({swId: data.id, objectId: data.id, objectArchive: data.archiveId})" type="button" class="dropbtn">
                  {{'SW_OVERVIEW_SW_EDIT'| translate}}
                </button>`;
    }

    vm.updateTable = function(index)
    {
        vm.gridOptions.api.setRowData(null);
        var rowData = [];
        if (vm.view === 2) // remote objects
        {
            vm.swList.forEach(element => {
                if(element.archive === "Remote Objects")
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem});
                }
            });
        }
        else if(vm.view === 1) {
             vm.swList.forEach(element => {
                 console.log(element);
                if(element.archive !== "Remote Objects" && element.isPublic)
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem});
                }
            });
        }
        else {
            vm.swList.forEach(element => {
                if(element.archive !== "Remote Objects")
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem});
                }
            });
        }
        vm.rowCount = rowData.length;
        vm.gridOptions.api.setRowData(rowData);
        vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
        vm.gridOptions.api.sizeColumnsToFit();
    }

    vm.gridOptions = {
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
        suppressRowClickSelection: true,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: true,
        animateRows: true,
        onGridReady: function (params) {
            vm.gridOptions.api.sizeColumnsToFit();
        },
        pagination: true,
        paginationPageSize: Number(vm.pageSize),
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
        new agGrid.Grid(gridDiv, vm.gridOptions);
        vm.gridOptions.api.sizeColumnsToFit();
    });
}];