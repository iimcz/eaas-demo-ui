module.exports = function($state, $stateParams, objectList, $translate, $uibModal) {
    var vm = this;

    vm.objectList = objectList.data.objects;

    vm.menuOptions = [
        [$translate.instant('JS_MENU_RENDER'), function ($itemScope) {
            $state.go('wf-b.choose-env', {objectId: $itemScope.object.id});
        }],
        null, // Dividier
        [$translate.instant('JS_MENU_EDIT'), function ($itemScope) {
            window.location.href = "admin/#/wf-s/edit-object-characterization?objectId=" + $itemScope.object.id;
        }],
        [$translate.instant('JS_MENU_DETAILS'), function ($itemScope) {
               $uibModal.open({
                    animation: true,
                    templateUrl: 'partials/wf-b/help-emil-dialog.html',
                    controller: function($scope) {
                        this.helpTitle = "Object Details " + $itemScope.object.title;
                        this.helpText = $itemScope.object.summary;
                    },
                    controllerAs: "helpDialogCtrl"
                });
        }]
    ];
};