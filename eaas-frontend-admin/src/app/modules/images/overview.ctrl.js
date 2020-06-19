import {WaitModal} from '../../lib/task.js'

module.exports = ['$state', '$scope', '$http', 'localConfig', '$uibModal', 'Images', 'growl',
    function ($state, $scope, $http, localConfig, $uibModal, Images, growl)
{
    var vm = this;
    vm.config = localConfig.data;
    vm.pageSize = "25";
    vm.imageList = [];

    vm.updateData = function () {
        if ($scope.gridOptions && $scope.gridOptions.api != null) {
            $scope.gridOptions.api.setRowData(vm.imageList);
            $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            $scope.gridOptions.api.sizeColumnsToFit();
        }
    };

    vm.updateTable = async () =>
    {
        if ($scope.gridOptions && $scope.gridOptions.api)
            $scope.gridOptions.api.setRowData(null);
        vm.imageList = await Images.list();
        vm.updateData();
    };
    vm.updateTable(0, "default");

    vm.importDlg = function () {
        let modal = $uibModal.open({
            animation: true,
            template: require ('./modals/import.html'),
            controller: ["$scope", "localConfig", function($scope, localConfig) {

                this.runtime = "https://gitlab.com/emulation-as-a-service/linux-container-base-image/-/jobs/artifacts/master/raw/disk.img?job=build";
                this.cloudInit = "https://gitlab.com/emulation-as-a-service/eaas-container-runtime/-/jobs/artifacts/master/raw/eaas-container-runtime/eaas-container-runtime.iso?job=build";
                this.import = async () => 
                {
                    if(!this.mode)
                    {
                        window.alert("Please select an image type");
                        return;
                    }
                    if(this.mode !== 'runtime' && !this.label)
                    {
                        window.alert("Please set an image label");
                        return;
                    }

                    if(this.mode === "create" && !this.hdsize)
                    {
                        window.alert("Please set disk size");
                        return;
                    } 

                    if(this.mode === "upload" && !this.hdurl)
                    {
                        window.alert("Please set image url");
                        return;
                    }

                    if(this.mode === "rom" && !this.romurl)
                    {
                        window.alert("Please set ROM url");
                        return;
                    }
                    modal.close();
                    
                    let date = new Date();
                    let shortDate =  date.getFullYear() + "/" + (date.getMonth() + 1) + "/" +  date.getDate();
                    console.log(shortDate);
                    let waitModal = new WaitModal($uibModal);
                    waitModal.show("Import", "Please wait");
                    let result = undefined;
                    try {
                        if(this.mode ==='create')
                            result = await Images.createEmpty(this.hdsize, this.label);
                        else if(this.mode === "rom")
                        {
                            result = await Images.import(this.romurl, this.label, "roms");
                        }
                        else if(this.mode === "runtime") {
                            result = await Images.import(this.runtime, `Runtime Image (${shortDate})`, "runtime");
                            result = await Images.import(this.cloudInit, `CloudInit (${shortDate})`, "runtime");
                        }
                        else
                            result = await Images.import(this.hdurl, this.label);
                    }
                    catch(e)
                    {
                        console.log(e);
                        growl.error(e.name + ': ' + e.message);
                    }
                    finally {
                        waitModal.hide();
                        $state.reload();
                    }
                }
            }],
            controllerAs: "importDlgCtrl"
        });
    }

    $scope.onPageSizeChanged = function () {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    function diskEntryRenderer()
    {
        return `
        <div style="padding-top: 10px; padding-bottom: 10px;" >
        <div class="overview-label">{{data.label}}<br>
            <span class="overview-content">
                <b>ID: </b> {{data.imageId}} &nbsp; 
            </span></div></div>`;
    }

    vm.initColumnDefs = function () {
        return [
            {headerName: "User Images", field: "", cellRenderer: diskEntryRenderer, width: 600},
            {
                headerName: "", field: "Actions", cellRenderer: detailsBtnRenderer, suppressSorting: true,
                suppressMenu: true, width: 150
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
                    <a class="dropdown-content"
                        ng-click="ctrl._delete(data.imageId)">delete</a></li>
                </ul>
             </div>`;
        return imageActions;
    }

    vm._delete = function(imageId) {

        if (!window.confirm(`Please confirm deleting disk: ${imageId}?` ))
            return false;

        Images.delete("default", imageId);
        $state.reload();
    }

    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowHeight: 75,
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
        paginationPageSize: Number(vm.pageSize),
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
