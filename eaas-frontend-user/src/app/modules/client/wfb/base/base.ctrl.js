module.exports = function($scope, $uibModal, objMetadata) {
    function showHelpDialog(helpText) {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/help-emil-dialog.html',
            controller: function($scope) {
                this.helpText = helpText;
            },
            controllerAs: "helpDialogCtrl"
        });
    }

    var vm = this;
    
    vm.open = function() {
        showHelpDialog("Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor " +
                       "invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.");
    };

    vm.showObjectHelpDialog = function() {
        showHelpDialog(objMetadata.help);
    };

    vm.showSetKeyboardLayoutDialog = function() {
        $uibModal.open({
            animation: true,
            templateUrl: 'partials/wf-b/set-keyboard-layout-dialog.html',
            resolve: {
                kbLayouts: function($http) {
                    return $http.get("kbLayouts.json");
                }
            },
            controller: "setKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
        });
    };

    $scope.$on('showSetKeyboardLayoutDialog', function(event, args) {
        vm.showSetKeyboardLayoutDialog();
    });
};