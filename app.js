(function() {
	function formatStr(format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};

	// EMIL core api
	var changeMediaURL = "Emil/changeMedia?sessionId={0}&objectId={1}&driveId={2}&label={3}";
	
	// object data connector
	var mediaCollectionURL = "EmilObjectData/mediaDescription?objectId={0}";
	var loadEnvsUrl = "EmilObjectData/environments?objectId={0}";
	var metadataUrl = "EmilObjectData/metadata?objectId={0}";
	var getObjectListURL = "EmilObjectData/list";
	
	// environments data connector
	var getAllEnvsUrl = "EmilEnvironmentData/getAllEnvironments";
	var getEmilEnvironmentUrl = "EmilEnvironmentData/environment?envId={0}";
	var getUserSessionUrl = "EmilUserSession/session?userId={0}&objectId={1}";
	var deleteSessionUrl = "EmilUserSession/delete?sessionId={0}";

	angular.module('emilUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap', 'ui.select', 'angular-growl', 
				   'dibari.angular-ellipsis', 'ui.bootstrap.contextMenu', 'pascalprecht.translate', 'smart-table', 'angular-page-visibility'])

	.controller('setKeyboardLayoutDialogController', function($scope, $cookies, $translate, kbLayouts, growl) {
		this.kbLayouts = kbLayouts.data;

		var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs');

		if (kbLayoutPrefs) {
			this.chosen_language = kbLayoutPrefs.language;
			this.chosen_layout = kbLayoutPrefs.layout;
		}

		this.saveKeyboardLayout = function() {
			if (!this.chosen_language || !this.chosen_layout) {
				growl.error($translate.instant('SET_KEYBOARD_DLG_SAVE_ERROR_EMPTY'));
				return;
			}

			$cookies.putObject('kbLayoutPrefs', {"language": this.chosen_language, "layout": this.chosen_layout}, {expires: new Date('2100')});

			growl.success($translate.instant('SET_KEYBOARD_DLG_SAVE_SUCCESS'));
			$scope.$close();
		};
	})

	.config(function($stateProvider, $urlRouterProvider, growlProvider, $httpProvider, $translateProvider) {
		/*
		 * Internationalization 
		 */
		$translateProvider.useStaticFilesLoader({
			prefix: 'locales/',
			suffix: '.json'
		});

		// escape HTML in the translation
		$translateProvider.useSanitizeValueStrategy('escape');

		$translateProvider.registerAvailableLanguageKeys(['en', 'de'], {
		  'en_*': 'en',
		  'de_*': 'de'
		});

		// automatically choose best language for user
		$translateProvider.determinePreferredLanguage();
		// $translateProvider.preferredLanguage('en');

		var httpResponseErrorModal = null;

		// Add a global AJAX error handler
		$httpProvider.interceptors.push(function($q, $injector, $timeout) {
			return {
				responseError: function(rejection) {
					if (httpResponseErrorModal === null) {
						httpResponseErrorModal = $injector.get('$uibModal').open({
							animation: true,
							backdrop: 'static',
							templateUrl: 'partials/server-error-dialog.html'
						});
					}

					return $timeout(function() {
						var $http = $injector.get('$http');

						var req = $http(rejection.config);
						req.then(function() {
							if (httpResponseErrorModal !== null) {
								httpResponseErrorModal.close();
								httpResponseErrorModal = null;
							}
						});
						return req;
					}, 5000);
				}
			};
		});

		// For any unmatched url
		$urlRouterProvider.otherwise("/object-overview");

		// Now set up the states
		$stateProvider
			.state('error', {
				url: "/error",
				templateUrl: "partials/error.html",
				params: {
					errorMsg: {title: "", message: ""}
				},
				controller: function($state, $stateParams) {
					if ($stateParams.errorMsg.title === "" && $stateParams.errorMsg.title === "") {
						$state.go('object-overview');
						return;
					}

					this.errorMsg = $stateParams.errorMsg;
				},
				controllerAs: "errorCtrl"
			})
			.state('object-overview', {
				url: "/object-overview",
				templateUrl: "partials/object-overview.html",
				resolve: {
					localConfig: function($http) {
						return $http.get("config.json");
					},
					objectList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getObjectListURL);
					}/*,
					environmentList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getAllEnvsUrl);
					}*/
				},
				controller: function($state, $stateParams, objectList, $translate, $uibModal) {
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
				},
				controllerAs: "objectOverviewCtrl"
			})
			.state('wf-b', {
				abstract: true,
				url: "/wf-b?objectId",
				templateUrl: "partials/wf-b/base.html",
				resolve: {
					localConfig: function($http) {
						return $http.get("config.json");
					},
					objEnvironments: function($stateParams, $http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(loadEnvsUrl, $stateParams.objectId));
					},
					objMetadata: function($stateParams, $http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(metadataUrl, $stateParams.objectId));
					},
					allEnvironments: function($stateParams, $http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getAllEnvsUrl);
					},
					userSession: function($stateParams, $http, localConfig) {
					    return $http.get(localConfig.data.eaasBackendURL + formatStr(getUserSessionUrl, "testuser01", $stateParams.objectId))
					},
					kbLayouts: function($http) {
						return $http.get("kbLayouts.json");
					}
				},
				controller: function($scope, $uibModal, objMetadata, kbLayouts) {
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
								kbLayouts: function() {
									return kbLayouts; // refers to outer kbLayouts variable
								}
							},
							controller: "setKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
						});
					};

					$scope.$on('showSetKeyboardLayoutDialog', function(event, args) {
						vm.showSetKeyboardLayoutDialog();
					});
				},
				controllerAs: "baseCtrl"
			})
			.state('wf-b.choose-env', {
				url: "/choose-environment",
				views: {
					'wizard': {
						templateUrl: 'partials/wf-b/choose-env.html',
						controller: function ($scope, $state, $cookies, objMetadata, objEnvironments, allEnvironments, growl, $translate, userSession, $uibModal, $http, localConfig) {
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
                                	templateUrl: 'partials/wf-b/user-session-dialog.html',
                                	controller: function($scope) {
                                        this.startDefault = function() {
                                            $scope.$close();
                                            if (objEnvironments.data.environmentList.length === 1)
                                            {
                                                $state.go('wf-b.emulator', {envId: objEnvironments.data.environmentList[0].id});
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
                                            $state.go('wf-b.emulator', {envId: userSession.data.envId});
                                        };

                                        this.deleteSession = function() {
                                            if (window.confirm($translate.instant('JS_DELENV_OK'))) {

                                                $http.get(localConfig.data.eaasBackendURL + formatStr(deleteSessionUrl, userSession.data.envId))
                                                .then(function(response) {
                                                    $scope.$close();
                                                    if (objEnvironments.data.environmentList.length === 1)
                                                    {
                                                        $state.go('wf-b.emulator', {envId: objEnvironments.data.environmentList[0].id});
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
                                	},
                                	controllerAs: "userSessionDialogCtrl"
                                });
                            }
                            else {
                                if (objEnvironments.data.environmentList.length === 1)
                                {
                                  $state.go('wf-b.emulator', {envId: objEnvironments.data.environmentList[0].id});
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
						},
						controllerAs: "chooseEnvCtrl"
					},
					'metadata': {
						templateUrl: 'partials/wf-b/metadata.html',
						controller: function ($scope, objMetadata) {
							this.metadata = objMetadata.data.metadata;
						},
						controllerAs: "metadataCtrl"
					}
				}
			})
			.state('wf-b.emulator', {
				url: "/emulator?envId",
				resolve: {
					chosenEnv: function($http, $stateParams, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(getEmilEnvironmentUrl, $stateParams.envId));
					},
					mediaCollection: function($http, $stateParams, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(mediaCollectionURL, $stateParams.objectId));
					}
				},
				views: {
					'wizard': {
						templateUrl: "partials/wf-b/emulator.html",
						controller: function ($scope, $sce, $state, $stateParams, $cookies, $translate, growl, localConfig) {
							var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

							window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

							eaasClient.addOnConnectListener(function () {
								$("#emulator-loading-container").hide();
								$("#emulator-container").show();

								if (eaasClient.params.pointerLock === 'true') {
                                    growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
									BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
								}
							});

							eaasClient.onError = function(message) {
								$state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
							};

							eaasClient.startEnvironment($stateParams.envId, {
								keyboardLayout: kbLayoutPrefs.language.name,
								keyboardModel: kbLayoutPrefs.layout.name,
								object: $stateParams.objectId,
								userContext: "testuser01"
							});
						},
						controllerAs: "startEmuCtrl"
					},
					'actions': {
						templateUrl: 'partials/wf-b/actions.html',
						controller: function ($scope, $window, $state, $http, $timeout, $uibModal, $stateParams, $timeout, mediaCollection, growl, localConfig, $translate, $pageVisibility, chosenEnv) {
							var vm = this;
							
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
							
							vm.help = function() {
								showHelpDialog(chosenEnv.data.helpText);
							};

							vm.screenshot = function() {
								 window.open(window.eaasClient.getScreenshotUrl());
							};

							vm.printEnvOut = function() {
								 window.open(window.eaasClient.getPrintUrl());
							};

                            vm.sendCtrlAltDel = function() {
                            	window.eaasClient.sendCtrlAltDel();
                            };

                            vm.saveSession = function() {
                                var postReq = {};
                                postReq.type = "saveUserSession";
                                postReq.objectId = $stateParams.objectId;
                                postReq.userContext = "testuser01";
                                postReq.envId = $stateParams.envId;

                                snapshotDoneFunc = function(data, status) {
                                    growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
                                    window.eaasClient.release();
                                    $('#emulator-stopped-container').show();
                                    window.location = localConfig.data.stopEmulatorRedirectURL;
                                };
                                window.eaasClient.snapshot(postReq, snapshotDoneFunc);
                            }

							vm.restartEmulator = function() {
								window.eaasClient.release();
								$state.reload();
							};

							vm.stopEmulator = function () {
								window.eaasClient.release();
								$('#emulator-stopped-container').show();	
								window.location = localConfig.data.stopEmulatorRedirectURL;
							};

							var currentMediumLabel = mediaCollection.data.medium.length > 0 ? mediaCollection.data.medium[0].items[0].label : null;

							var eaasClientReadyTimer = function() {
								if ((window.eaasClient !== undefined) && (window.eaasClient.driveId !== undefined) && (window.eaasClient.driveId !== null)) {
									vm.driveId = window.eaasClient.driveId;
									return;
								}

                                $timeout(eaasClientReadyTimer, 100);
							};
                            $timeout(eaasClientReadyTimer);

							vm.openChangeMediaDialog = function() {
								$uibModal.open({
									animation: true,
									templateUrl: 'partials/wf-b/change-media-dialog.html',
									controller: function($scope) {
										this.chosen_medium_label = currentMediumLabel;
                                        this.media = mediaCollection.data.medium;
										this.isChangeMediaSubmitting = false;

										this.changeMedium = function(newMediumLabel) {
											if (newMediumLabel == null) {
												growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
												return;
											}

											postObj = {};
                                            postObj.objectId = $stateParams.objectId;
                                            postObj.driveId = window.eaasClient.driveId;
                                            postObj.label = newMediumLabel;

                                            changeSuccsessFunc = function(data, status) {
                                                growl.success($translate.instant('JS_MEDIA_CHANGETO') + newMediumLabel);
                                                currentMediumLabel = newMediumLabel;
                                                $scope.$close();
                                                $("html, body").removeClass("wait");
                                            };

                                            $("html, body").addClass("wait");
                                            eaasClient.changeMedia(postObj, changeSuccsessFunc);
										};
									}
									,
									controllerAs: "openChangeMediaDialogCtrl"
								});
							};

							/*
							vm.openChangeMediaNativeDialog = function() {
								$uibModal.open({
									animation: true,
									templateUrl: 'partials/wf-b/change-media-native-dialog.html',
									controller: function($scope) {
										this.helpmsg = initData.data.helpmsg;
									},
									controllerAs: "openChangeMediaNativeDialogCtrl"
								});
							}
							*/
							
						//	var closeEmulatorOnTabLeaveTimer = null;
						//	var leaveWarningShownBefore = false;
							
						//	var deregisterOnPageFocused = $pageVisibility.$on('pageFocused', function() {								
						//		$timeout.cancel(closeEmulatorOnTabLeaveTimer);
						//	});

						//	var deregisterOnPageBlurred = $pageVisibility.$on('pageBlurred', function() {
						//		if (!leaveWarningShownBefore) {
						//			$window.alert($translate.instant('JS_EMU_LEAVE_PAGE'));
						//			leaveWarningShownBefore = true;
						//		}
								
						//		closeEmulatorOnTabLeaveTimer = $timeout(function() {
						//			vm.stopEmulator();
						//		}, 3 * 60 * 1000);
						//	});
							
						//	$scope.$on("$destroy", function() {
						//		deregisterOnPageFocused();
						//		deregisterOnPageBlurred();
						//	});
						},
						controllerAs: "actionsCtrl"
					},
					'metadata': {
						templateUrl: 'partials/wf-b/metadata.html',
						controller: function ($scope, objMetadata) {
							this.metadata = objMetadata.data.metadata;
						},
						controllerAs: "metadataCtrl"
					}
				}
			});

		growlProvider.globalTimeToLive(5000);
	});
})();
