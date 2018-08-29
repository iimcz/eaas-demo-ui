module.exports = ["$scope", "$state", "$cookies", "objMetadata", "objEnvironments", "allEnvironments", "growl", "$translate", "userSession", "$uibModal", "$http", "localConfig", "helperFunctions", "REST_URLS",
    function($scope, $state, $cookies, objMetadata, objEnvironments, allEnvironments, growl, $translate, userSession, $uibModal, $http, localConfig, helperFunctions, REST_URLS) {
    var vm = this;

    vm.noSuggestion = false;

    if (objEnvironments.data.status !== "0" || objEnvironments.data.environmentList.length === 0) {
        $state.go('error', {errorMsg: {title: "no environment could be determined automatically. please use the admin page to assign an environment manually."}});
    }

    console.log(userSession.envId);
    console.log(userSession.data.envId);
    if(userSession.data.envId)
    {
        $uibModal.open({
            animation: true,
            template: require('./modals/user-session-dialog.html'),
            controller: ["$scope", function($scope) {
                this.startDefault = function() {
                    $scope.$close();
                    if (objEnvironments.data.environmentList.length === 1)
                    {
                        $state.go('access.emulator', {envId: objEnvironments.data.environmentList[0].id});
                        return;
                    }

                    if (objMetadata.data.status !== "0") {
                        $state.go('error', {errorMsg: {title: "Metadata Error " + objMetadata.data.status, message: objMetadata.data.message}});
                        return;
                    }

                    vm.objecttitle = objMetadata.data.title;

                    if(vm.noSuggestion) {
                        if(allEnvironments.data.status === "0") {
                            vm.environments = allEnvironments.data.environments;
                        } else {
                            $state.go('error', {errorMsg: {title: "Environments Error " + objEnvironments.data.status, message: objEnvironments.data.message}});
                        }
                    } else {
                        vm.environments = objEnvironments.data.environmentList;
                    }
                };

                this.startSession = function() {
                    $scope.$close();
                    $state.go('access.emulator', {envId: userSession.data.envId, isUserSession: true});
                };

                this.deleteSession = function() {
                    if (window.confirm($translate.instant('JS_DELENV_OK'))) {

                        $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.deleteSessionUrl, userSession.data.envId))
                        .then(function(response) {
                            $scope.$close();
                            if (objEnvironments.data.environmentList.length === 1)
                            {
                                $state.go('access.emulator', {envId: objEnvironments.data.environmentList[0].id});
                                return;
                            }

                            if (objMetadata.data.status !== "0") {
                                $state.go('error', {errorMsg: {title: "Metadata Error " + objMetadata.data.status, message: objMetadata.data.message}});
                                return;
                            }
                            vm.objecttitle = objMetadata.data.title;
                            if(vm.noSuggestion) {
                                if(allEnvironments.data.status === "0") {
                                    vm.environments = allEnvironments.data.environments;
                                } else {
                                    $state.go('error', {errorMsg: {title: "Environments Error " + objEnvironments.data.status, message: objEnvironments.data.message}});
                                }
                            } else {
                                vm.environments = objEnvironments.data.environmentList;
                            }
                        });
                    }
                };
            }],
            controllerAs: "userSessionDialogCtrl"
        });
    }
    else {
        if (objEnvironments.data.environmentList.length === 1)
        {
          $state.go('access.emulator', {envId: objEnvironments.data.environmentList[0].id});
          return;
        }

        if (objMetadata.data.status !== "0") {
          $state.go('error', {errorMsg: {title: "Metadata Error " + objMetadata.data.status, message: objMetadata.data.message}});
          return;
        }

        vm.objecttitle = objMetadata.data.title;

        if(vm.noSuggestion) {
          if(allEnvironments.data.status === "0") {
              vm.environments = allEnvironments.data.environments;
          } else {
              $state.go('error', {errorMsg: {title: "Environments Error " + objEnvironments.data.status, message: objEnvironments.data.message}});
          }
        } else {
          vm.environments = objEnvironments.data.environmentList;
        }
    }

    if (!$cookies.getObject('kbLayoutPrefs')) {
        growl.warning($translate.instant('CHOOSE_ENV_NO_KEYBOARD_LAYOUT_WARNING'));
        $scope.$emit('showSetKeyboardLayoutDialog');
    }
}];