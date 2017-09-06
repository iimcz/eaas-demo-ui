(function() {
	function formatStr(format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	}

    function getFirstNumber(str) {
        return parseInt(str.match(/\d+/)[0], 10);
    }
	
	// object data api
	var loadEnvsUrl = "EmilObjectData/environments?objectId={0}";
	var getObjectListURL = "EmilObjectData/list";
	var getSoftwareListURL = "EmilObjectData/list?archiveId={0}";
	var syncObjectsUrl = "EmilObjectData/sync";
	var mediaCollectionURL = "EmilObjectData/mediaDescription?objectId={0}";

	// environment data api
	var getAllEnvsUrl = "EmilEnvironmentData/list?type={0}";
	var updateDescriptionUrl = "EmilEnvironmentData/updateDescription";
	var deleteEnvironmentUrl = "EmilEnvironmentData/delete";
	var initEmilEnvironmentsURL = "EmilEnvironmentData/init";
	var getEnvironmentTemplates = "EmilEnvironmentData/getEnvironmentTemplates";
	var createImageUrl = "EmilEnvironmentData/createImage?size={0}";
	var prepareEnvironmentUrl = "EmilEnvironmentData/prepareEnvironment";
	var importImageUrl = "EmilEnvironmentData/importImage";
	var createEnvironmentUrl = "EmilEnvironmentData/createEnvironment";
	var commitUrl = "EmilEnvironmentData/commit";
	var forkRevisionUrl = "EmilEnvironmentData/forkRevision";
	var revertRevisionUrl = "EmilEnvironmentData/revertRevision";
	var saveSessionUrl = "EmilEnvironmentData/saveSession";
	var syncImagesUrl = "EmilEnvironmentData/sync";
	var exportEnvironmentUrl = "EmilEnvironmentData/export?envId={0}";

	var overrideObjectCharacterizationUrl = "Emil/overrideObjectCharacterization";
	var characterizeObjectUrl = "Emil/characterizeObject?objectId={0}";
	var buildVersionUrl = "Emil/buildInfo";
	
	// Software archive api
	var getSoftwarePackageDescriptions = "EmilSoftwareData/getSoftwarePackageDescriptions";
	var saveSoftwareUrl = "EmilSoftwareData/saveSoftwareObject";
	var getSoftwareObjectURL = "EmilSoftwareData/getSoftwareObject?softwareId={0}";
	
	
	angular.module('emilAdminUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap',
								   'ui.mask', 'ui.select', 'angular-growl', 'smart-table', 'ng-sortable', 'pascalprecht.translate', 
								   'angular-page-visibility', 'textAngular', 'mgo-angular-wizard', 'ui.bootstrap.datetimepicker', 'chart.js'])

	.component('inputList', {
		templateUrl: 'partials/components/inputList.html',
		bindings: {
			list: '=',
			heading: '@',
			listEmptyNote: '@',
			inputPlaceholder: '@',
			addButtonText: '@'
		}
	})

	.controller('settingsDialogController', function($state, $http, $scope, $uibModal, localConfig, kbLayouts, growl) {		
		var vm = this;

		vm.importEnvs = function() {
			$scope.$close();

			$http.get(localConfig.data.eaasBackendURL + initEmilEnvironmentsURL).then(function(response) {
				if (response.data.status === "0") {
					$state.go('wf-s.standard-envs-overview', {}, {reload: true});
						growl.success(response.data.message);
					} else {
						growl.error(response.data.message, {title: 'Error ' + response.data.status});
					}
				}
			);
		};
	   
		vm.syncObjects = function() {
	    	$scope.$close();
			
			$http.get(localConfig.data.eaasBackendURL + syncObjectsUrl).then(function(response) {
				if (response.data.status === "0") {
					$state.go('wf-s.standard-envs-overview', {}, {reload: true});
			        	growl.success(response.data.message);
			        } else {
			        	growl.error(response.data.message, {title: 'Error ' + response.data.status});
			        }
			    }
		    );
		};
		
		vm.syncImages = function() {
	    	$scope.$close();
			
			$http.get(localConfig.data.eaasBackendURL + syncImagesUrl).then(function(response) {
				if (response.data.status === "0") {
					$state.go('wf-s.standard-envs-overview', {}, {reload: true});
			        	growl.success(response.data.message);
			        } else {
			        	growl.error(response.data.message, {title: 'Error ' + response.data.status});
			        }
			    }
		    );
		};
		
		vm.showSetKeyboardLayoutDialog = function() {
			$uibModal.open({
				animation: true,
				templateUrl: 'partials/set-keyboard-layout-dialog.html',
				resolve: {
					kbLayouts: function() {
						return kbLayouts; // refers to outer kbLayouts variable
					}
				},
				controller: "setKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
			});
		};
	})

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
                    if (((rejection || {}).config || {}).method !== 'GET') {
                        $injector.get('$state').go('error', {errorMsg: {title: "Server Error", message: rejection}});
                        return $q.reject(rejection);
                    }

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
		$urlRouterProvider.otherwise("/wf-i/dashboard");

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
						$state.go('wf-s.standard-envs-overview');
						return;
					}

					this.errorMsg = $stateParams.errorMsg;
				},
				controllerAs: "errorCtrl"
			})
			.state('wf-i', {
				abstract: true,
				url: "/wf-i",
				templateUrl: "partials/base.html",
				resolve: {
					localConfig: function($http) {
						return $http.get("config.json" + '?id=' + new Date().getTime());
					},
					kbLayouts: function($http) {
						return $http.get("kbLayouts.json");
					},
					buildInfo: function($http, localConfig) {
                    	return $http.get(localConfig.data.eaasBackendURL + buildVersionUrl);
                    }
				},
				controller: function($uibModal, localConfig, kbLayouts, buildInfo) {
					var vm = this;
                    this.buildInfo = buildInfo.data.version;
					vm.open = function() {
						$uibModal.open({
							animation: true,
							templateUrl: 'partials/wf-s/help-emil-dialog.html'
						});
					};

					vm.showSettingsDialog = function() {
						$uibModal.open({
							animation: true,
							templateUrl: 'partials/settings-dialog.html',
							resolve: {
								localConfig: function() {
									return localConfig;
								},
								kbLayouts: function() {
									return kbLayouts;
								}
							},
							controller: "settingsDialogController as settingsDialogCtrl"
						});
					};
				},
				controllerAs: "baseCtrl"
			})

			.state('wf-i.dashboard', {
				url: "/dashboard",
                resolve: {
				    clusters: function($http, localConfig) {
                        return $http.get(localConfig.data.dashboardClusterAPIBaseURL, {
                            headers: {
                                'X-Admin-Access-Token': localConfig.data.dashboardAccessToken,
                                'Cache-Control': 'no-cache'
                            }
                        });
                    },
                    allClusterDetails: function ($q, $http, localConfig, clusters) {
                        return $q.all(clusters.data.map(function (cluster) {
                            return $http.get(localConfig.data.dashboardClusterAPIBaseURL + cluster, {
                                    headers: {
                                        'X-Admin-Access-Token': localConfig.data.dashboardAccessToken,
                                        'Cache-Control': 'no-cache'
                                }
                            })
                        }));
                    }
                },
				views: {
					'wizard': {
						templateUrl: 'partials/dashboard.html',
						controller: function (clusters, allClusterDetails) {
                            var allClusterProviders = allClusterDetails.reduce(function(result, clusterResponse, index) {
                                var providers = clusterResponse.data.providers;

                                providers.forEach(function (provider) {
                                    provider.clusterName = clusters.data[index];
                                });

                                return result.concat(providers);
                            }, []);

                            // only keep elements of the type ResourceProvider
                            allClusterProviders = allClusterProviders.filter(function (elem, i, arr) {
                                return elem.__resource_type === 'ResourceProvider';
                            });

                            var resourceProviders = allClusterProviders.map(function (resourceProvider) {
                                var nodes = resourceProvider.resource_allocator.nodes.map(function (node) {
                                    var node_pool_node = resourceProvider.node_pool.nodes.filter(function (n) { return n.id === node.id })[0];

                                    var nodeUsedCPU = 0;
                                    var nodeUsedMemory = 0;
                                    node.allocations.forEach(function (allocation) {
                                        nodeUsedCPU += getFirstNumber(allocation.spec.cpu);
                                        nodeUsedMemory += getFirstNumber(allocation.spec.memory);
                                    });

                                    var nodeAllocations = node.allocations.map(function (allocation) {
                                    	return {
                                    		id: allocation.id,
											allocated_cpu: getFirstNumber(allocation.spec.cpu) / 1000,
                                            allocated_memory: getFirstNumber(allocation.spec.memory)
										};
                                    });

                                    var free_cpu = getFirstNumber(node.free_resources.cpu) / 1000;
                                    var used_cpu = nodeUsedCPU / 1000;
                                    var capacity_cpu = free_cpu + used_cpu;

                                    var free_memory = getFirstNumber(node.free_resources.memory);
                                    var used_memory = nodeUsedMemory;
                                    var capacity_memory = free_memory + used_memory;

                                    return {
                                        id: node.id,
                                        used: node_pool_node.used,
                                        healthy: node_pool_node.healthy,
                                        capacity_cpu: capacity_cpu,
                                        chart_cpu_values: [free_cpu, used_cpu],
                                        capacity_memory: capacity_memory,
                                        chart_memory_values: [free_memory, used_memory],
										allocations: nodeAllocations
                                    };
                                });


                                var capacity_cpu = getFirstNumber(resourceProvider.node_pool.capacity.cpu) / 1000;
                                var free_cpu = resourceProvider.resource_allocator.nodes.reduce(function (r, n) { return r + getFirstNumber(n.free_resources.cpu) }, 0) / 1000;
                                var pending_cpu = getFirstNumber(resourceProvider.node_pool.pending.cpu) / 1000;
                                var used_cpu = capacity_cpu - pending_cpu - free_cpu;

                                var capacity_memory = getFirstNumber(resourceProvider.node_pool.capacity.memory);
                                var free_memory = resourceProvider.resource_allocator.nodes.reduce(function (r, n) { return r + getFirstNumber(n.free_resources.memory) }, 0);
                                var pending_memory = getFirstNumber(resourceProvider.node_pool.pending.memory);
                                var used_memory = capacity_memory - pending_memory - free_memory;

                                return {
                                    name: resourceProvider.name,
                                    type: resourceProvider.type,
                                    cluster_name: resourceProvider.clusterName,
                                    num_requests: resourceProvider.metrics.num_requests,
                                    num_requests_deferred: resourceProvider.metrics.num_requests_deferred,
                                    num_requests_expired: resourceProvider.metrics.num_requests_expired,
                                    num_requests_failed: resourceProvider.metrics.num_requests_failed,
                                    num_nodes: resourceProvider.resource_allocator.num_nodes,
                                    capacity_cpu: capacity_cpu,
                                    chart_cpu_values: [free_cpu, used_cpu, pending_cpu],
                                    capacity_memory: capacity_memory,
                                    chart_memory_values: [free_memory, used_memory, pending_memory],
                                    nodes: nodes,
                                    nodes_usage: [resourceProvider.node_pool.num_used_nodes, resourceProvider.node_pool.num_unused_nodes],
                                    nodes_health: [resourceProvider.node_pool.num_healthy_nodes, resourceProvider.node_pool.num_unhealthy_nodes],
                                    allocation_requests: resourceProvider.allocation_requests || {num_entries: 0}
                                };
                            });

                            var vm = this;

							vm.resourceProviders = resourceProviders;

							vm.chartNodeUsageLabels = ['Used Nodes', 'Unused Nodes'];
							vm.chartNodeHealthLabels = ['Healthy Nodes', 'Unhealthy Nodes'];
                            vm.chartCPULabels = ['Free CPU', 'Used CPU', 'Pending CPU'];
                            vm.chartMemoryLabels = ['Free Memory', 'Used Memory', 'Pending Memory'];
                            vm.chartNodeCPULabels = ['Free CPU', 'Used CPU'];
                            vm.chartNodeMemoryLabels = ['Free Memory', 'Used Memory'];

                            vm.chartNodesOptions = {
                                rotation: Math.PI,
                                circumference: Math.PI,
                                legend: {
                                    display: true,
                                    position: 'bottom'
                                }
                            };

                            vm.chartCPUOptions = {
                                rotation: Math.PI,
                                circumference: Math.PI,
                                legend: {
                                    display: true,
                                    position: 'bottom'
                                },
                                tooltips: {
                                    callbacks: {
                                        label: function (tooltipItem, data) {
                                            return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'm';
                                        }
                                    }
                                }
                            };

                            vm.chartMemoryOptions = {
                                rotation: Math.PI,
                                circumference: Math.PI,
                                legend: {
                                    display: true,
                                    position: 'bottom'
                                },
                                tooltips: {
                                    callbacks: {
                                        label: function (tooltipItem, data) {
                                            return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                                        }
                                    }
                                }
                            };

                            vm.nodeChartCPUOptions = {
                                rotation: Math.PI,
                                circumference: Math.PI,
                                legend: {
                                    display: true,
                                    position: 'bottom'
                                },
                                tooltips: {
                                    callbacks: {
                                        label: function (tooltipItem, data) {
                                            return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'm';
                                        }
                                    }
                                }
                            };

                            vm.nodeChartMemoryOptions = {
                                rotation: Math.PI,
                                circumference: Math.PI,
                                legend: {
                                    display: true,
                                    position: 'bottom'
                                },
                                tooltips: {
                                    callbacks: {
                                        label: function (tooltipItem, data) {
                                            return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                                        }
                                    }
                                }
                            };
						},
						controllerAs: "dashboardCtrl"
					}
				}
			})
			.state('wf-i.sw-overview', {
				url: "/sw-overview",
				resolve: {
					softwareList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getSoftwarePackageDescriptions);
					}
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-i/sw-overview.html',
						controller: function (softwareList) {
							var vm = this;

							if (softwareList.data.status !== "0") {
								$state.go('error', {errorMsg: {title: "Load Environments Error " + softwareList.data.status, message: softwareList.data.message}});
								return;
							}

							vm.softwareList = softwareList.data.descriptions;
						},
						controllerAs: "swOverviewCtrl"
					}
				}
			})
			.state('wf-i.sw-ingest', {
				url: "/sw-ingest",
				params: {
					swId: "-1"
				},
				resolve: {
					objectList: function($stateParams, $http, localConfig) {
						// Don't fetch list for edit
						if ($stateParams.swId != "-1") {
							return null;
						}
						if("softwareArchiveId" in localConfig.data)
						{
							return $http.get(localConfig.data.eaasBackendURL + 
									formatStr(getSoftwareListURL, localConfig.data.softwareArchiveId));
						}
						else {
							return $http.get(localConfig.data.eaasBackendURL + getObjectListURL);
						}
					},
					softwareObj: function($stateParams, $http, localConfig) {
						// return empty object for new software
						if ($stateParams.swId === "-1") {
							return {
								data: {
									objectId: null,
									licenseInformation: "",
									allowedInstances: -1,
									isOperatingSystem: false,
									nativeFMTs: [],
									importFMTs: [],
									exportFMTs: [],
								}
							};
						}

						return $http.get(localConfig.data.eaasBackendURL + formatStr(getSoftwareObjectURL, $stateParams.swId));
					},
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-i/sw-ingest.html',
						controller: function ($stateParams, $state, $http, localConfig, growl, objectList, softwareObj) {
							var vm = this;
							
							vm.isNewSoftware = $stateParams.swId === "-1";

							if (vm.isNewSoftware) {
								vm.selectedObject = null;
								vm.objectList = objectList.data.objects;
							} else {
								vm.selectedObject = {id: $stateParams.swId, title: $stateParams.swId};
								vm.objectList = [vm.selectedObject];
							}

							vm.softwareObj = softwareObj.data;

							vm.save = function() {
								if("softwareArchiveId" in localConfig.data)
									 vm.softwareObj.archiveId = localConfig.data.softwareArchiveId;
								
								vm.softwareObj.objectId = vm.selectedObject.id;
								vm.softwareObj.label = vm.selectedObject.title;
								console.log(JSON.stringify(vm.softwareObj));
								
								$http.post(localConfig.data.eaasBackendURL + saveSoftwareUrl, vm.softwareObj).then(function(response) {
									if (response.data.status === "0") {
										growl.success(response.data.message);
										$state.go('wf-i.sw-overview', {}, {reload: true});
										
									} else {
										growl.error(response.data.message, {title: 'Error ' + response.data.status});
									}
								});
								
							};
						},
						controllerAs: "swIngestCtrl"
					}
				}
			})
			.state('wf-i.new-image', {
				url: "/new-image",
				resolve: {
					systemList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getEnvironmentTemplates);
					},
					softwareList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getSoftwarePackageDescriptions);
					}
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-i/new-image.html',
						controller: function ($http, $scope, $state, $stateParams, systemList, softwareList, growl, localConfig) {
							var vm = this;

							vm.systems = systemList.data.systems;
							vm.softwareList = softwareList.data.descriptions;

							// initialize default values of the form
							vm.hdsize = 1024;
							vm.hdtype = 'size';

							vm.imageId = "";
							
							vm.onSelectSystem = function(item, model) {
								vm.native_config = item.native_config;
							};
							
							vm.start = function() {
								if (vm.hdtype == 'new') {
									$http.post(localConfig.data.eaasBackendURL + createEnvironmentUrl, {
										size: vm.hdsize + 'M',
										templateId: vm.selectedSystem.id, 
										label: vm.name, urlString: vm.hdurl, 
										nativeConfig: vm.native_config
									}).then(function(response) {
										if (response.data.status !== "0") 
											growl.error(response.data.message, {title: 'Error ' + response.data.status});
										$state.go('wf-s.emulator', {envId: response.data.id, isCreateEnv: true, softwareId: vm.selectedSoftware.id});
									});
								} else {
									$http.post(localConfig.data.eaasBackendURL + importImageUrl, 
											{
												urlString: vm.hdurl, 
												templateId: vm.selectedSystem.id, 
												label: vm.name, urlString: vm.hdurl, 
												nativeConfig: vm.native_config
											}).then(function(response) {
										if (response.data.status !== "0") 
											growl.error(response.data.message, {title: 'Error ' + response.data.status});
										$state.go('wf-s.emulator', {envId: response.data.id, isImportEnv: true });
									});	
								}
							};
						},
						controllerAs: "newImageCtrl"
					}
				}
			})
			.state('wf-s', {
				abstract: true,
				url: "/wf-s",
				templateUrl: "partials/base.html",
				resolve: {
					localConfig: function($http) {
						return $http.get("config.json");
					},
					environmentList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(getAllEnvsUrl, "base"));
					},
					objectEnvironmentList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(getAllEnvsUrl, "object"))
					},
					kbLayouts: function($http) {
						return $http.get("kbLayouts.json");
					},
					buildInfo: function($http, localConfig) {
					    return $http.get(localConfig.data.eaasBackendURL + buildVersionUrl);
					}
				},
				controller: function($state, $uibModal, $http, localConfig, kbLayouts, growl, buildInfo) {
					var vm = this;

					this.buildInfo = buildInfo.data.version;

					vm.open = function() {
						$uibModal.open({
							animation: true,
							templateUrl: 'partials/wf-s/help-emil-dialog.html'
						});
					}
					
					vm.showSettingsDialog = function() {
						$uibModal.open({
							animation: true,
							templateUrl: 'partials/settings-dialog.html',
							resolve: {
								localConfig: function() {
									return localConfig;
								},
								kbLayouts: function() {
									return kbLayouts;
								}
							},
							controller: "settingsDialogController as settingsDialogCtrl"
						});
					};
				},
				controllerAs: "baseCtrl"
			})
			.state('wf-s.synchronize-image-archives', {
			  url: "/synchronize-image-archives",
			  views: {
				  'wizard': {
					  templateUrl: 'partials/wf-s/synchronize-image-archives.html',
					  controller: function ($http, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, WizardHandler) {
						  var vm = this;

						  var setEnvList = function (localEnvironmentList, remoteEnvironmentList) {
                              var envMap = {};

                              localEnvironmentList.forEach(function (env) {
                                  env.isAvailableLocal = true;
                                  env.isAvailableRemote = false; // init with false, may be switched, if found in remote
                                  envMap[env.envId] = env;
                              });

                              remoteEnvironmentList.forEach(function (env) {
                                  // environment is in the local archive, switch the isAvailableRemote flag
                                  if (envMap[env.envId]) {
                                      envMap[env.envId].isAvailableRemote = true;
                                      return;
                                  }

                                  env.isAvailableLocal = false;
                                  env.isAvailableRemote = true;
                                  envMap[env.envId] = env;
                              });

                              vm.envList = Object.keys(envMap).map(function(key) {
                                  envMap[key].isAvailableLocalInitial = envMap[key].isAvailableLocal;
                                  envMap[key].isAvailableRemoteInitial = envMap[key].isAvailableRemote;

                                  return envMap[key];
                              });
                          };

						  vm.fetchArchivesFromRemote = function (URI) {
							  // TODO fetch real data from URI
							  if (!URI) {
							  	growl.error('Please enter a valid URI');
							  	return;
							  }

                              var MOCK_REMOTE_BASE = [{"parentEnvId":"3a0d52e5-24df-4daa-bd54-89806877f52614","envId":"cbb628fb-f300-443f-87aa-0d831a879d6414","os":"n.a.","title":"DooM","description":"asdasd\n--\nasdasd\n--\na","version":null,"emulator":"n.a.","helpText":null,"installedSoftwareIds":[]}, {"parentEnvId":"3a0d52e5-24df-4daa-bd54-89806877f52614","envId":"848b8mj","os":"n.a.","title":"FakeDooM2000","description":"asdasd\n--\nasdasd\n--\na","version":null,"emulator":"n.a.","helpText":null,"installedSoftwareIds":[]}];
                              // var MOCK_REMOTE_OBJ = [{"parentEnvId":null,"envId":"7022","os":"n.a.","title":"Hatari TOS 2.06 US","description":"n.a.","version":null,"emulator":"n.a.","helpText":null,"installedSoftwareIds":[]}];

                              setEnvList(environmentList.data.environments, MOCK_REMOTE_BASE);
                              WizardHandler.wizard().next();
                          };

                          vm.isSyncing = false;
                          vm.syncArchives = function (envs) {
                              vm.isSyncing = true;

                              growl.info($translate.instant('SYNC_START_INFO'));

                              // fake rest post
                              setTimeout(function () {
                                  vm.isSyncing = false;

                                  // TODO call setEnvList with updated lists

                                  growl.success($translate.instant('SYNC_SUCCESS_INFO'));
                              }, 7000);
                          };
					  },
					  controllerAs: "synchronizeImageArchivesCtrl"
				  }
			  }
			})
			.state('wf-s.standard-envs-overview', {
				url: "/standard-envs-overview",
				params: {
					showObjects: false
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/standard-envs-overview.html',
						controller: function ($http, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate) {
							var vm = this;
							
							if (environmentList.data.status !== "0") {
								$state.go('error', {errorMsg: {title: "Load Environments Error " + environmentList.data.status, message: environmentList.data.message}});
								return;
							}
							
							vm.exportEnvironment = function(envId) {
									
								$http.get(localConfig.data.eaasBackendURL + formatStr(exportEnvironmentUrl, envId))		
									.then(function(response) {
										if (response.data.status === "0") {
											growl.success("export successful");
										} else {
											growl.error(response.data.message, {title: 'Error ' + response.data.status});
										}
									});
								
							};
							
                                vm.deleteEnvironment = function(envId) {
								if (window.confirm($translate.instant('JS_DELENV_OK'))) {
									$http.post(localConfig.data.eaasBackendURL + deleteEnvironmentUrl, {
										envId: envId,
										deleteMetaData: true
									}).then(function(response) {
										if (response.data.status === "0") {
											// remove env locally
											vm.envs = vm.envs.filter(function(env) {
												return env.envId !== envId;
											});
											
											growl.success($translate.instant('JS_DELENV_SUCCESS'));
											$state.go('wf-s.standard-envs-overview', {}, {reload: true});
										} else {
											growl.error(response.data.message, {title: 'Error ' + response.data.status});
											$state.go('wf-s.standard-envs-overview', {}, {reload: true});

										}
									});
								}
							};
							vm.envs = environmentList.data.environments;
							vm.objEnvs = objectEnvironmentList.data.environments;
							vm.showObjects = $stateParams.showObjects;
						},
						controllerAs: "standardEnvsOverviewCtrl"
					}
				}
			})
			.state('wf-s.new-env', {
				url: "/new-env",
				resolve: {
					softwareList: function($http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + getSoftwarePackageDescriptions);
					}
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/new-env.html',
						controller: function ($scope, $state, $stateParams, environmentList, softwareList, growl) {
							this.envs = environmentList.data.environments;							
							this.software = softwareList.data.descriptions;
						},
						controllerAs: "newEnvCtrl"
					}
				}
			})
			.state('wf-s.edit-env', {
				url: "/edit-env",
				params: {
					envId: "-1",
					objEnv: false
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/edit-env.html',
						controller: function ($http, $scope, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate) {
							var vm = this;

                            vm.showDateContextPicker = false;

							var envList = null;
							console.log($stateParams.objEnv);
							if($stateParams.objEnv)
								envList = objectEnvironmentList.data.environments;
							else 
								envList = environmentList.data.environments;
								
							this.env = null; 
							
							for(var i = 0; i < envList.length; i++) {
								if (envList[i].envId === $stateParams.envId) {
									this.env = envList[i];
									break;
								}
							}

							if(this.env === null)
							{
								growl.error("Environment not found");
								$state.go('wf-s.standard-envs-overview', {}, {reload: true});
							}

							this.envTitle = this.env.title;
							this.envDescription = this.env.description;
							this.envHelpText = this.env.helpText;
							this.enableRelativeMouse = this.env.enableRelativeMouse;

							this.saveEdit = function() {
							    console.log("save time: " + this.showDateContextPicker);
							    if(this.showDateContextPicker)
								    console.log('Date(UNIX Epoch): ' + vm.datetimePicker.date.getTime());

                                this.env.title = this.envTitle;
                                this.env.description = this.envDescription;
                                this.env.helpText = this.envHelpText;
								$http.post(localConfig.data.eaasBackendURL + updateDescriptionUrl, {
									envId: $stateParams.envId,
									title: this.envTitle,
									description: this.envDescription,
									helpText: this.envHelpText,
									time: vm.datetimePicker.date.getTime()
								}).then(function(response) {
									if (response.data.status === "0") {
										growl.success($translate.instant('JS_ENV_UPDATE'));
									} else {
										growl.error(response.data.message, {title: 'Error ' + response.data.status});
									}
									
									$state.go('wf-s.standard-envs-overview', {}, {reload: true});
								});
							};
							
							this.fork = function(revId) {
								$http.post(localConfig.data.eaasBackendURL + forkRevisionUrl, {
									id: revId
								}).then(function(response) {
									if (response.data.status === "0") {
										growl.success($translate.instant('JS_ENV_UPDATE'));
										$state.go('wf-s.standard-envs-overview', {}, {reload: true});
									} else {
										growl.error(response.data.message, {title: 'Error ' + response.data.status});
									}
									$state.go('wf-s.standard-envs-overview', {}, {reload: true});
								});
							};
							
							this.revert = function(currentId, revId) {
								console.log("revert: ");
								console.log(currentId);
								console.log(revId);
								$http.post(localConfig.data.eaasBackendURL + revertRevisionUrl, {
									currentId: currentId,
									revId: revId
								}).then(function(response) {
									if (response.data.status === "0") {
										growl.success($translate.instant('JS_ENV_UPDATE'));
										$state.go('wf-s.standard-envs-overview', {}, {reload: true});
									} else {
										growl.error(response.data.message, {title: 'Error ' + response.data.status});
									}
									$state.go('wf-s.standard-envs-overview', {}, {reload: true});
								});
							};

                            vm.isOpen = false;

                            vm.datetimePicker = {
                            	date: new Date(),
                                datepickerOptions: { },
                                timepickerOptions: {
                                    showMeridian: false
								},
                                buttonBar: {
                                    show: true,
                                    now: {},
                                    today: {},
                                    clear: {
                                        show: false
                                    },
                                    date: {},
                                    time: {},
                                    close: {},
                                    cancel: {}
								}
							};

                            if ($translate.use() === 'de') {
                                vm.datetimePicker.buttonBar = {
                                    show: true,
									now: {
										text: 'Jetzt'
									},
									today: {
										text: 'Heute'
									},
									clear: {
										show: false
									},
									date: {
										text: 'Datum'
									},
									time: {
										text: 'Zeit'
									},
									close: {
										text: 'Schließen'
									},
									cancel: {}
                                }
							}

                            vm.openCalendar = function(e) {
                                e.preventDefault();
                                e.stopPropagation();

                                vm.isOpen = true;
                            };
						},
						controllerAs: "editEnvCtrl"
					}
				}
			})
			.state('wf-s.emulator', {
				url: "/emulator",
				resolve: {
                	mediaCollection: function($http, $stateParams, localConfig) {
                			return $http.get(localConfig.data.eaasBackendURL +
                			formatStr(mediaCollectionURL, $stateParams.softwareId));
                		}
                },
				params: {
					envId: "-1",
					isNewEnv: false,
					isCreateEnv: false,
					isImportEnv: false,
					softwareId: null,
					isNewObjectEnv: false,
					objectId: null
				},
				views: {
					'wizard': {
						templateUrl: "partials/wf-s/emulator.html",
						controller: function ($scope, $sce, $state, $stateParams, $cookies, $translate, localConfig, growl) {
							window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

							eaasClient.addOnConnectListener(function () {
								$("#emulator-loading-container").hide();
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

							eaasClient.onError = function(message) {
								$state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
							};

							// fallback to defaults when no cookie is found
							var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

							var params = {
								keyboardLayout: kbLayoutPrefs.language.name,
								keyboardModel: kbLayoutPrefs.layout.name
							};

							if ($stateParams.isNewEnv || $stateParams.softwareId !== null) {
								params.software = $stateParams.softwareId;
							} else if ($stateParams.isNewObjectEnv) {
								params.object = $stateParams.objectId;
							}

							eaasClient.startEnvironment($stateParams.envId, params);
						},
						controllerAs: "startEmuCtrl"
					},
					'actions': {
						templateUrl: 'partials/wf-s/actions.html',
						controller: function ($scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, mediaCollection, $timeout, $translate, $pageVisibility) {
							var vm = this;
							
							vm.isNewEnv = $stateParams.isNewEnv;
							vm.isNewObjectEnv = $stateParams.isNewObjectEnv;
							
							vm.screenshot = function() {
								window.open(window.eaasClient.getScreenshotUrl());
							};
							vm.printEnvOut = function() {
								window.open(window.eaasClient.getPrintUrl());
							};

							vm.restartEmulator = function() {
								window.eaasClient.release();
								$state.reload();
							};

							vm.stopEmulator = function () {
								window.eaasClient.release();
								$('#emulator-stopped-container').show();
								
								if($stateParams.isTestEnv)
								{
									$http.post(localConfig.data.eaasBackendURL + deleteEnvironmentUrl, {
										envId: $stateParams.envId,
										deleteMetaData: true,
										deleteImage: true
									}).then(function(response) {
										if (response.data.status === "0") {		
											$state.go('wf-s.standard-envs-overview', {}, {reload: true});
										}
									});
								}
								else if ($stateParams.isNewObjectEn)
								    $state.go('wf-s.standard-envs-overview', {showObjects: true}, {reload: true});
								else
									$state.go('wf-s.standard-envs-overview', {}, {reload: true});
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
                            		templateUrl: 'partials/wf-s/change-media-dialog.html',
                            		controller: function($scope) {
                            			this.chosen_medium_label = currentMediumLabel;
                            			this.media = mediaCollection.data.medium;
                            			this.isChangeMediaSubmitting = false;

                            			this.changeMedium = function(newMediumLabel) {
                                            if (newMediumLabel == null) {
                                                growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                                                return;
                                            }

                                            this.isChangeMediaSubmitting = true;

                                            postObj = {};
                                            postObj.objectId = $stateParams.softwareId;
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
                            	    },
                            		controllerAs: "openChangeMediaDialogCtrl"
           						});
                			};

							vm.openSaveEnvironmentDialog = function() {	
								$uibModal.open({
									animation: true,
									templateUrl: 'partials/wf-s/save-environment-dialog.html',
									controller: function($scope) {
										this.isNewEnv = $stateParams.isNewEnv;
										this.isNewObjectEnv = $stateParams.isNewObjectEnv;
										this.isCreateEnv = $stateParams.isCreateEnv;
										this.isImportEnv = $stateParams.isImportEnv;
										
										this.isSavingEnvironment = false;
										this.saveEnvironment = function() {
                                            this.isSavingEnvironment = true;
                                            vm.stopEmulator();

											var postReq = {};											
											postReq.envId = $stateParams.envId;
											postReq.sessionId = window.eaasClient.componentId;
											postReq.message = this.envDescription;	
											
											var __saveSessionUrl = saveSessionUrl;
											if ($stateParams.isNewEnv) {
												postReq.type = "newEnvironment";
												postReq.title = this.envName;
												postReq.softwareId = $stateParams.softwareId;	
												postReq.isObjectEnvironment= false;
											} else if ($stateParams.isNewObjectEnv) {
												postReq.type = "objectEnvironment";
												postReq.objectId = $stateParams.objectId;
												postReq.title = this.envName;
											} else { // same object for save / commit 
												postReq.type = "saveConfiguration";
												if($stateParams.isImportEnv) 
												{
													console.log("is import env");
													postReq.commit = true;
													__saveSessionUrl = commitUrl;
												}
												else if ($stateParams.isCreateEnv)
													{
													postReq.commit = true;
													console.log("is create env");
													// __saveSessionUrl = commitUrl;
													}
												else 
													postReq.commit = false;
											}
											
											postResult = $http.post(localConfig.data.eaasBackendURL + __saveSessionUrl, postReq);
											postResult.then(function(response) {
												$scope.$close();
												if (response.data.status === "0") {
													growl.success(response.data.message, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
													
													$state.go('wf-s.standard-envs-overview', {}, {reload: true});
												} else {
													growl.error(response.data.message, {title: 'Error ' + response.data.status});
							
													$state.go('wf-s.standard-envs-overview', {}, {reload: true});
												}
											});
										};
										
										this.deleteEnvironment = function() {
											this.isSavingEnvironment = true;
											window.eaasClient.release();
											$('#emulator-stopped-container').show();
											
											$scope.$close();
											
											$http.post(localConfig.data.eaasBackendURL + deleteEnvironmentUrl, {
												envId: $stateParams.envId,
												deleteMetaData: true,
												deleteImage: true
											}).then(function(response) {
												if (response.data.status === "0") {		
													$state.go('wf-s.standard-envs-overview', {}, {reload: true});
												} else {
													growl.error(response.data.message, {title: 'Error ' + response.data.status});
													$state.go('wf-s.standard-envs-overview', {}, {reload: true});
												}
											});                         
										};
									},
									controllerAs: "openSaveEnvironmentDialogCtrl"
								});
									
							}
							
							/*
							var closeEmulatorOnTabLeaveTimer = null;
							var leaveWarningShownBefore = false;
							var deregisterOnPageFocused = $pageVisibility.$on('pageFocused', function() {
								$timeout.cancel(closeEmulatorOnTabLeaveTimer);
							});

							var deregisterOnPageBlurred = $pageVisibility.$on('pageBlurred', function() {
								if (!leaveWarningShownBefore) {
									$window.alert($translate.instant('JS_EMU_LEAVE_PAGE'));
									leaveWarningShownBefore = true;
								}
								
								closeEmulatorOnTabLeaveTimer = $timeout(function() {
									vm.stopEmulator();
								}, 3 * 60 * 1000);
							});
							
							$scope.$on("$destroy", function() {
								deregisterOnPageFocused();
								deregisterOnPageBlurred();
							});
							*/
						},
						controllerAs: "actionsCtrl"
					}
				}
			})
			.state('wf-s.edit-object-characterization', {
				url: "/edit-object-characterization?objectId",
				resolve: {
					objEnvironments: function($stateParams, $http, localConfig) {
						return $http.get(localConfig.data.eaasBackendURL + formatStr(loadEnvsUrl, $stateParams.objectId));
					}
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/edit-object-characterization.html',
						controller: function ($scope, $state, $stateParams, $uibModal, $http, localConfig, objEnvironments, environmentList, growl, $translate) {
							var vm = this;
							
							vm.objEnvironments = objEnvironments.data.environments;
							vm.objectId = $stateParams.objectId;
							
							vm.automaticCharacterization = function() {
								if (window.confirm($translate.instant('JS_START_CHAR'))) {
									$("html, body").addClass("wait");
									$(".fullscreen-overlay-spinner").show();
									$http.get(localConfig.data.eaasBackendURL + formatStr(characterizeObjectUrl, $stateParams.objectId)).then(function(response) {
										if (response.data.status !== "0") {
											growl.error(response.data.message, {title: 'Error ' + response.data.status});
											return;
										}
										
										vm.objEnvironments.length = 0;
										vm.objEnvironments.push.apply(vm.objEnvironments, response.data.environments);
									})['finally'](function() {
										$("html, body").removeClass("wait");
										$(".fullscreen-overlay-spinner").hide();
									});
								}
							};
							
							vm.openAddEnvDialog = function() {
								$uibModal.open({
									animation: true,
									templateUrl: 'partials/wf-s/add-environment-dialog.html',
									controller: function($scope) {
										this.newEnv = null;
										this.environments = environmentList.data.environments;
										
										this.addEnvironment = function() {
											// check if environment was already added
											for (var i = 0; i < objEnvironments.data.environments.length; i++) {
												if (objEnvironments.data.environments[i].id === this.newEnv.envId) {
													growl.warning($translate.instant('JS_ENV_ERR_DUP'));
													return;
												}
											}
											
											objEnvironments.data.environments.push({
												"id": this.newEnv.envId,
												"label": this.newEnv.title											
											});											
											$scope.$close();
										};
									},
									controllerAs: "addEnvDialogCtrl"
								});
							};
							
							vm.removeEnvironment = function(env) {
								if (objEnvironments.data.environments.length === 1) {
									growl.error($translate.instant('JS_ENV_ERR_ZERO'));
									return;
								}
								
								var i;
								for (i = 0; i < objEnvironments.data.environments.length; i++) {
									if (objEnvironments.data.environments[i].id === env.id) {
										break;
									}
								}
								
								objEnvironments.data.environments.splice(i, 1);
							};
							
							vm.saveCharacterization = function() {
								$http.post(localConfig.data.eaasBackendURL + overrideObjectCharacterizationUrl, {
									objectId: $stateParams.objectId,
									environments: objEnvironments.data.environments
								}).then(function() {
									$state.go('wf-s.standard-envs-overview');
								});
							};
						},
						controllerAs: "editObjectCharacterizationCtrl"
					}
				}
			});
			
		growlProvider.globalTimeToLive(5000);
	});
})();
