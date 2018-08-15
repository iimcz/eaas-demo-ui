module.exports = ['$rootScope','$scope','$sce','$state','$stateParams','$translate','localConfig','growl','$uibModal','containerEnvironmentList',
    function ($rootScope, $scope, $sce, $state, $stateParams, $translate, localConfig, growl, $uibModal, containerEnvironmentList) {
        var vm = this;

        $("#container-stopped").hide();

        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);
        eaasClient.onError = function(message) {
            window.onbeforeunload = null;
            $state.go('error', {errorMsg: {title: "Error", message: message.error}});
        };

        window.onbeforeunload = function(e) {
            var dialogText = $translate.instant('MESSAGE_QUIT');
            e.returnValue = dialogText;
            return dialogText;
        };

        window.onunload = function() {
            window.onbeforeunload = null;
        };

        var envList = containerEnvironmentList.data.environments;
        console.log(envList);
        vm.env = null;

        for(var i = 0; i < envList.length; i++) {
            if (envList[i].envId === $stateParams.envId) {
                vm.env = envList[i];
                break;
            }
        }

        window.eaasClient.onEmulatorStopped = function() {
            $("#emulator-loading-container").hide();
            $("#container-running").hide();
            $("#container-stopped").show();
        };

        var params = {};

        vm.downloadLink = function()
        {
            window.open(window.eaasClient.getContainerResultUrl());
        };

        var confirmStartFn = function(inputs)
        {
            params.input_data = [];
            var input = {};
            input.size_mb = 512;
            input.destination = vm.env.input;
            input.content = inputs;
            params.input_data.push(input);

            $("#emulator-loading-container").show();
            eaasClient.startContainer($stateParams.envId, params).then(function () {
                $("#emulator-loading-container").hide();
                $("#container-running").show();

                eaasClient.connect().then(function() {
                    $("#emulator-container").show();

                    if (eaasClient.params.pointerLock === "true") {
                        growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                        BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                    }

                    // Fix to close emulator on page leave
                    $scope.$on('$locationChangeStart', function(event) {
                        eaasClient.release();
                    });
                });


                $scope.$on('$locationChangeStart', function(event) {
                    eaasClient.release();
                });
            });
        };

        $uibModal.open({
            animation: true,
            template: require('./modals/container-run-dialog.html'),
            controller: function($scope) {
                this.run = function()
                {
                    confirmStartFn(this.inputs);
                };
                this.cancel = function()
                {
                    $state.go('admin.standard-envs-overview', {showObjects: false, showContainers: true}, {reload: false});
                };
                this.inputs = [];
            },
            controllerAs: "runContainerDlgCtrl"
        });

    }];


