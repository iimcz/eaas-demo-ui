module.exports = ["$uibModal", "localConfig", "kbLayouts", "buildInfo", function($uibModal, localConfig, kbLayouts, buildInfo) {
    var vm = this;

    vm.open = function() {
        $uibModal.open({
            animation: false,
            template: require('./modals/help.html')
        });
    }

    vm.config = localConfig.data;
    vm.buildInfo = buildInfo.data.version;

    vm.showSettingsDialog = function() {
        $uibModal.open({
            animation: false,
            template: require('./modals/settings.html'),
            resolve: {
                localConfig: function () {
                    return localConfig;
                },
                kbLayouts: function () {
                    return kbLayouts;
                }
            },
            controller: "SettingsDialogController as settingsDialogCtrl"
        });
    };
}];