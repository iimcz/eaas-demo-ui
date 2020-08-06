import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";
import {requestPointerLock, ClientError} from "EaasClient/eaas-client.js";

module.exports = ['$state', 'eaasClient', '$scope', '$stateParams', 'growl', '$translate',
    function ($state, eaasClient, $scope, $stateParams, growl, $translate) {

        var vm = this;
        console.log($stateParams.url);
        console.log($stateParams.mediumType);
        console.log($stateParams.envId);

        if(!$stateParams.envId)
        $state.go('error', {
            errorMsg: {
                title: "Error ",
                message: "No environments ID provided"
            }
        });

        let component = new MachineComponentBuilder($stateParams.envId, "public");
        if($stateParams.url && $stateParams.mediumType)
            component.addUserMedia($stateParams.url, $stateParams.mediumType);

        component.setInteractive(true);

        const run = async () =>  {
            await eaasClient.start([component]);
            await eaasClient.connect($("#emulator-container")[0]);
            vm.started = true;
            window.onbeforeunload = function (e) {
                var dialogText = $translate.instant('MESSAGE_QUIT');
                e.returnValue = dialogText;
                return dialogText;
            };

            window.onunload = function () {
                if (eaasClient)
                    eaasClient.release();
                window.onbeforeunload = null;
            };
            
            $("#emulator-loading-container").hide();
            $("#emulator-container").show();

            if (eaasClient.params.pointerLock === "true") {
                growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
            }
            $scope.$apply();

            $scope.$on('$locationChangeStart', function (event) {
                eaasClient.release();
            });
        }

        run();
    }
];