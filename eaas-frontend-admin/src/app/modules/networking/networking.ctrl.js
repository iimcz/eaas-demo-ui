module.exports = ['$state', '$scope', '$stateParams', '$uibModal', 'groupdIds', 'localConfig', 'REST_URLS', '$http', 'Environments',
    function ($state, $scope, $stateParams, $uibModal, groupdIds, localConfig, REST_URLS, $http, Environments) {
   
    var updatedGroupID = $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds).then(function (response) {
        $scope.groupdIds = response.data;

        if ($scope.gridOptions.api != null) {
            $scope.gridOptions.api.setRowData($scope.groupdIds);
            $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            $scope.gridOptions.api.sizeColumnsToFit();
        }
    });
    
    var vm = this;
    vm.landingPage = localConfig.data.landingPage;
    vm.pageSize = "10";
    vm.config = localConfig.data;
    $scope.groupdIds = groupdIds.data;

    if (groupdIds.status !== 200) {
        $state.go('error', {
            errorMsg: {
                title: "Load Environments Error " + groupdIds.status,
                message: groupdIds.message
            }
        });
        return;
    }

    $scope.onPageSizeChanged = function () {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {headerName: "Name", field: "name"},
            {
                headerName: "", field: "edit", cellRenderer: connectBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function connectBtnRenderer(params) {
        params.$scope.connect = connect;
        params.$scope.deleteSession = deleteSession;
        params.$scope.openLandingPage = openLandingPage;
        params.$scope.connectEnv = connectEnv;
        params.$scope.landingPage = vm.landingPage;
        params.$scope.selected = $scope.selected;
        params.$scope.changeClass = function (id) {
            if (($("#dropdowm" + id).is(":visible"))) {
                return "dropbtn2";
            } else {
                return "dropbtn";
            }
        };

        return `<div class="btn-group" uib-dropdown dropdown-append-to-body>
                    
                    <button id="single-button{{data.id}}" type="button" ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                      {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                    </button>
                    
                    <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem">
                              <a ng-click="connect(data.id)"  class="dropdown-content">Connect</a>           
                        </li>
                        <li role="menuitem">
                              <a ng-click="deleteSession(data.id)"  class="dropdown-content">Delete</a>           
                        </li>
                        <li role="menuitem" ng-if="landingPage">
                              <a ng-click="openLandingPage(data.id)"  class="dropdown-content">Landing Page</a>           
                        </li>
                        <li role="menuitem" ng-if="landingPage">
                              <a ng-click="connectEnv(data.id)"  class="dropdown-content">Connect Environment</a>           
                        </li>
                    </ul>
                    
                </div>`;
    }

    function connect(id) {
        $http.get(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
            response.data.sessionId = id;
            //temporary, until we define which environment we want to visualize first
            const envIdToInitialize = response.data.components.find(e => {return e.type === "machine"}).environmentId;
            const componentId = response.data.components.find(e => {return e.type === "machine"}).componentId;
            $state.go('admin.emulator', {envId: envIdToInitialize, componentId: componentId, session: response.data}, {reload: true});
        })
    }

    function openLandingPage(id) {
        window.open(vm.landingPage + "?sessionId=" + id + "#!/attach-landing-page")
    }
    
    function connectEnv(id) {
        Environments.query().$promise.then((emilEnvs) =>{

            if (emilEnvs.filter(env => env.networkEnabled === true).length === 0) {
                growl.error($translate.instant('NO_ENVIRONMENTS_WITH_NETWORK'));
                $state.go("admin.networking", {}, {reload: true});
            } else
                $uibModal.open({
                    animation: true,
                    template: require('./modals/connectEnvToNetwork.html'),
                    resolve: {
                        localConfig: function () {
                            return localConfig;
                        },
                        environments : () => emilEnvs,
                        sessionId: () => id,
                    },
                    controller: "NetworkGroupManagerCtrl as $ctrl"
                });
        })


    }

    function deleteSession(id) {
        $http.delete(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
            console.log(response);
            $state.go('admin.networking', {}, {reload: true});
        })
    }


    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: $scope.groupdIds,
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
