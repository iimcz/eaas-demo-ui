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
	var objectEnvironmentsUrl = "EmilObjectData/environments?objectId={0}&updateClassification={1}&updateProposal={2}";
	var getObjectListURL = "EmilObjectData/list";
	var getSoftwareListURL = "EmilObjectData/list?archiveId={0}";
	var syncObjectsUrl = "EmilObjectData/sync";
	var mediaCollectionURL = "EmilObjectData/mediaDescription?objectId={0}";
	var metadataUrl = "EmilObjectData/metadata?objectId={0}";



	// environment data api
	var getAllEnvsUrl = "EmilEnvironmentData/list?type={0}";
	var getRemoteEnvsUrl = "EmilEnvironmentData/remoteList?host={0}&type={1}";
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
	var syncImagesUrl = "EmilEnvironmentData/sync";
	var exportEnvironmentUrl = "EmilEnvironmentData/export?envId={0}";
	var setDefaultEnvironmentUrl = "EmilEnvironmentData/setDefaultEnvironment?osId={0}&envId={1}";
	var getTaskState = "EmilEnvironmentData/taskState?taskId={0}";
	var getEmilEnvironmentUrl = "EmilEnvironmentData/environment?envId={0}";

	var userSessionListUrl = "EmilUserSession/list";
	var deleteSessionUrl = "EmilUserSession/delete?sessionId={0}";

	var overrideObjectCharacterizationUrl = "Emil/overrideObjectCharacterization";
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
        vm.serverLogUrl = localConfig.data.eaasBackendURL + "Emil/serverLog";
        vm.usageLogUrl = localConfig.data.eaasBackendURL + "Emil/usageLog";
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

	.controller('editObjectCharacterizationController', function ($scope, $state, $stateParams, $uibModal, $http,
	localConfig, objEnvironments, environmentList, growl, $translate, metadata) {
        var vm = this;

        vm.objEnvironments = objEnvironments.data.environmentList;
        vm.objectId = $stateParams.objectId;
        vm.metadata = metadata.data;
        vm.suggested = objEnvironments.data.suggested;
        vm.fileFormats = objEnvironments.data.fileFormats;

        vm.hasEnvironments = false;
        if(objEnvironments && objEnvironments.length > 0)
            vm.hasEnvironments = false;

        vm.automaticCharacterization = function(updateClassification, updateProposal) {
            if (window.confirm($translate.instant('JS_START_CHAR'))) {
                $("html, body").addClass("wait");
                $(".fullscreen-overlay-spinner").show();

                $http.get(localConfig.data.eaasBackendURL
                    + formatStr(objectEnvironmentsUrl, $stateParams.objectId, updateClassification, updateProposal))
                    .then(function(response) {
                    if (response.data.status !== "0") {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        return;
                    }
                    vm.objEnvironments.length = 0;
                    vm.objEnvironments.push.apply(vm.objEnvironments, response.data.environmentList);
                })['finally'](function() {
                    $("html, body").removeClass("wait");
                    $(".fullscreen-overlay-spinner").hide();
                    $state.reload();
                });
            }
        };

        vm.openDefaultEnvDialog = function(osId, osLabel) {
            $uibModal.open({
                animation: true,
                templateUrl: 'partials/wf-s/set-default-environment-dialog.html',
                controller: function($scope) {
                    this.defaultEnv = null;
                    this.environments = environmentList.data.environments;
                    this.osId = osId;
                    this.osLabel = osLabel;

                    this.setEnvironment = function() {
                        $http.get(localConfig.data.eaasBackendURL + formatStr(setDefaultEnvironmentUrl,
                            this.osId, this.defaultEnv.envId))
                            .then(function(response) {
                                if (response.data.status !== "0") {
                                    growl.error(response.data.message, {title: 'Error ' + response.data.message});
                                    $scope.$close();
                                }
                                else
                                    console.log("set default env for " + osId + " defaultEnv " + this.defaultEnv.envId);

                        })['finally'](function() {
                            $scope.$close();
                            $state.reload();
                        });

                    };
                },
                controllerAs: "setDefaultEnvDialogCtrl"
            });
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
                        for (var i = 0; i < vm.objEnvironments.length; i++) {
                            if (vm.objEnvironments[i].id === this.newEnv.envId) {
                                growl.warning($translate.instant('JS_ENV_ERR_DUP'));
                                return;
                            }
                        }

                        vm.objEnvironments.push({
                            "id": this.newEnv.envId,
                            "label": this.newEnv.title
                        });
                        $scope.$close();
                    }
                },
                controllerAs: "addEnvDialogCtrl"
            });
        };

        vm.removeEnvironment = function(env) {
            if (vm.objEnvironments.length === 1) {
                growl.error($translate.instant('JS_ENV_ERR_ZERO'));
                return;
            }

            var i;
            for (i = 0; i < vm.objEnvironments.length; i++) {
                if (vm.objEnvironments[i].id === env.id) {
                    break;
                }
            }
            vm.objEnvironments.splice(i, 1);
        };

        vm.saveCharacterization = function() {
            $http.post(localConfig.data.eaasBackendURL + overrideObjectCharacterizationUrl, {
                objectId: $stateParams.objectId,
                environments: vm.objEnvironments
            }).then(function() {
                $state.go('wf-s.object-overview');
            });
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
					osList : function($http) {
					    return $http.get("osList.json");
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
						controller: function ($stateParams, $state, $http, localConfig, growl, objectList, softwareObj, osList) {
							var vm = this;

							vm.isNewSoftware = $stateParams.swId === "-1";

							if (vm.isNewSoftware) {
								vm.selectedObject = null;
								vm.objectList = objectList.data.objects;
							} else {
								vm.selectedObject = {id: $stateParams.swId, title: $stateParams.swId};
								vm.objectList = [vm.selectedObject];
							}
                            vm.osList = osList;
                         //   console.log(vm.osList);

							vm.softwareObj = softwareObj.data;

							vm.save = function() {
								if("softwareArchiveId" in localConfig.data)
									 vm.softwareObj.archiveId = localConfig.data.softwareArchiveId;
								
								vm.softwareObj.objectId = vm.selectedObject.id;
								vm.softwareObj.label = vm.selectedObject.title;

								if(vm.softwareObj.isOperatingSystem && vm.operatingSystemId)
								{
								    vm.operatingSystemId.puids.forEach(function(puid) {
                                       if(!vm.softwareObj.nativeFMTs.includes(puid.puid))
                                       {
                                           vm.softwareObj.nativeFMTs.push(puid.puid);
                                       }
                                    });

								}
                                // console.log(JSON.stringify(vm.softwareObj));
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
						controller: function ($http, $scope, $state, $stateParams, systemList, softwareList, growl, localConfig, $uibModal, $timeout) {
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

							vm.checkState = function(_taskId, _modal)
                            {
                                taskInfo = $http.get(localConfig.data.eaasBackendURL + formatStr(getTaskState, _taskId)).then(function(response){
                                    if(response.data.status == "0")
                                    {
                                        if(response.data.isDone)
                                        {
                                            _modal.close();
                                            growl.success("import finished.");
                                            $state.go('wf-s.emulator', {envId: response.data.userData.environmentId, type: 'saveImport' });
                                        }
                                        else
                                           $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                                    }
                                    else
                                    {
                                        _modal.close();
                                    }
                                });
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
										$state.go('wf-s.emulator', {envId: response.data.id, type: 'saveCreatedEnvironment', softwareId: vm.selectedSoftware.id});
									});
								} else {
									$http.post(localConfig.data.eaasBackendURL + importImageUrl, 
									{
                                        urlString: vm.hdurl,
                                        templateId: vm.selectedSystem.id,
                                        label: vm.name, urlString: vm.hdurl,
                                        nativeConfig: vm.native_config,
                                        rom: vm.rom
									}).then(function(response) {
										if(response.data.status == "0") {
                                            var taskId = response.data.taskId;
                                            modal = $uibModal.open({
                                                animation: true,
                                                templateUrl: 'partials/import-wait.html'
                                            });
                                            vm.checkState(taskId, modal);
                                        }
                                        }, function(response) {
                                            console.log("error");
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
					  controller: function ($http, $timeout, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, WizardHandler, $uibModal) {
						  var vm = this;
						  vm.isObjectEnvironment = false;

						  var setEnvList = function (localEnvironmentList, remoteEnvironmentList) {
                              var envMap = {};

                              localEnvironmentList.forEach(function (env) {

                                  env.isAvailableRemote = false; // init with false, may be switched, if found in remote
                                  env.upload = false;
                                  envMap[env.envId] = env;
                              });

                              remoteEnvironmentList.forEach(function (env) {
                                  if (envMap[env.envId]) {
                                      envMap[env.envId].isAvailableRemote = true;
                                      envMap[env.envId].upload = true;
                                  }
                              });

                              vm.envList = Object.keys(envMap).map(function(key) {
                                  return envMap[key];
                              });
                          };

						  vm.fetchArchivesFromRemote = function (URI, type) {
							  if (!URI) {
							  	growl.error('Please enter a valid URI');
							  	return;
							  }
                              vm.uri = encodeURIComponent(URI);
                              remoteEnvironmentList = $http.get(localConfig.data.eaasBackendURL + formatStr(getRemoteEnvsUrl, encodeURIComponent(URI), type)).then(function(response) {
                                if(response.data.status == "0")
                                {
                                    if(type == "base")
                                        setEnvList(environmentList.data.environments, response.data.environments);
                                    else if(type == "object"){

                                        setEnvList(objectEnvironmentList.data.environments, response.data.environments);
                                        vm.isObjectEnvironment = true;
                                        vm.objectImportType = "byRef";
                                    }
                                    WizardHandler.wizard().next();
                                }
                                else
                                {
                                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                }
                              });
                          };

                          vm.isSyncing = false;
                          vm.syncArchives = function (envs) {
                              vm.isSyncing = true;
                              growl.info($translate.instant('SYNC_START_INFO'));

                              var uploads = new Array();
                              for (var i = 0; i < envs.length; i++)
                              {
                                 var e = envs[i];

                                 if(e.isAvailableRemote)
                                    continue;
                                 if(!e.upload)
                                    continue;

                                 uploads.push(e.envId);

                              }


                              vm.checkState = function(_taskId, _modal)
                              {
                                    taskInfo = $http.get(localConfig.data.eaasBackendURL + formatStr(getTaskState, _taskId)).then(function(response){
                                        if(response.data.status == "0")
                                        {
                                            if(response.data.isDone)
                                            {
                                                _modal.close();
                                                vm.isSyncing = false;
                                                growl.success("upload finished.");
                                            }
                                            else
                                               $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                                        }
                                        else
                                        {
                                            _modal.close();
                                            vm.isSyncing = false;
                                        }
                                    });
                              };


                              var exportEmbedded = false;
                              if(vm.objectImportType == "embedded")
                                exportEmbedded = true;
                              growl.info("starting sync ");
                              $http({
                                method: 'POST',
                                url: localConfig.data.eaasBackendURL + "EmilEnvironmentData/exportToRemoteArchive",
                                data: {
                                    envId: uploads,
                                    wsHost: vm.uri,
                                    exportObjectEmbedded: exportEmbedded,
                                    objectArchiveHost: vm.remoteObjectArchiveURI
                                }}).then(function(response) {
                                   if(response.data.status == "0") {
                                        var taskId = response.data.taskId;
                                        modal = $uibModal.open({
                                        	animation: true,
                                        	templateUrl: 'partials/import-wait.html'
                                        });
                                        vm.checkState(taskId, modal);
                                   }
                              }, function(response) {
                                  console.log("error");
                              });
                        };
					  },
					  controllerAs: "synchronizeImageArchivesCtrl"
				  }
			  }
			})
			.state('wf-s.object-overview', {
                url: "/objects",
                resolve: {
                    localConfig: function($http) {
                        return $http.get("config.json");
                    },
                    objectList: function($http, localConfig) {
                        return $http.get(localConfig.data.eaasBackendURL + getObjectListURL);
                    }
                },
                views: {
                	'wizard': {
                        templateUrl: "partials/wf-s/objects.html",

                        controller: function($state, $stateParams, objectList) {
                            var vm = this;
                            vm.objectList = objectList.data.objects;
                        },
                        controllerAs: "objectOverviewCtrl"
                    }
                }
            })
            .state('wf-s.user-session-overview', {
                url: "/user-sessions",
                resolve: {
                    localConfig: function($http) {
                        return $http.get("config.json");
                    },
                    sessionList: function($http, localConfig) {
                        return $http.get(localConfig.data.eaasBackendURL + userSessionListUrl);
                    }
                },
                views: {
                    'wizard': {
                        templateUrl: "partials/wf-s/user-sessions.html",

                        controller: function($state, $stateParams, sessionList, $translate, $http, localConfig, growl) {
                            var vm = this;
                            vm.sessionList = sessionList.data.environments;

                            vm.deleteSession = function(_envId)
                            {
                                if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                                    $http.get(localConfig.data.eaasBackendURL + formatStr(deleteSessionUrl, _envId))
                                    .then(function(response) {
                                        if (response.data.status === "0") {
                                            growl.success($translate.instant('JS_DELENV_SUCCESS'));
                                            $state.go('wf-s.user-session-overview', {});
                                        } else {
                                            growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                            $state.go('wf-s.user-session-overview', {});
                                        }
                                    });
                                }
                            };
                        },
                        controllerAs: "sessionListCtrl"
                    }
                }
            })
			.state('wf-s.standard-envs-overview', {
				url: "/standard-envs-overview",
				params: {
					showObjects: false
				},
				resolve : {
				    softwareList: function($http, localConfig) {
                    	return $http.get(localConfig.data.eaasBackendURL + getSoftwarePackageDescriptions);
                    }
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/standard-envs-overview.html',
						controller: function ($http, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, $uibModal, softwareList) {
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

							vm.addSoftware = function(envId) {
                                $uibModal.open({
                                	animation: true,
                                	templateUrl: 'partials/wf-s/select-sw-dialog.html',
                                	controller: function($scope) {
                                	    this.envId = envId;
                                	    this.software = softwareList.data.descriptions;
                                	},
                                    controllerAs: "addSoftwareDialogCtrl"
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
							this.enablePrinting = this.env.enablePrinting;

							this.shutdownByOs = this.env.shutdownByOs;

							this.saveEdit = function() {
							    console.log("save time: " + this.showDateContextPicker);
							    var timecontext = null;
							    if(this.showDateContextPicker)
							    {
								    console.log('Date(UNIX Epoch): ' + vm.datetimePicker.date.getTime());
								    timecontext = vm.datetimePicker.date.getTime();
								}

                                this.env.title = this.envTitle;
                                this.env.description = this.envDescription;
                                this.env.helpText = this.envHelpText;
								$http.post(localConfig.data.eaasBackendURL + updateDescriptionUrl, {
									envId: $stateParams.envId,
									title: this.envTitle,
									description: this.envDescription,
									helpText: this.envHelpText,
									time: timecontext,
									enablePrinting: vm.enablePrinting,
									enableRelativeMouse: this.enableRelativeMouse,
									shutdownByOs: this.shutdownByOs
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
                			(($stateParams.softwareId != null) ?
                			    formatStr(mediaCollectionURL, $stateParams.softwareId) :
                			    formatStr(mediaCollectionURL, $stateParams.objectId)));
                		},
                    chosenEnv: function($http, $stateParams, localConfig) {
                             if($stateParams.type != "saveImport" && $stateParams.type != 'saveCreatedEnvironment')
                                 return $http.get(localConfig.data.eaasBackendURL + formatStr(getEmilEnvironmentUrl, $stateParams.envId));
                             else
                                 return {};
                        }
                },
				params: {
					envId: "-1",
					type: 'saveRevision',
					softwareId: null,
					isUserSession: false,
					objectId: null,
					userId: null
				},
				views: {
					'wizard': {
						templateUrl: "partials/wf-s/emulator.html",
						controller: function ($scope, $sce, $state, $stateParams, $cookies, $translate, localConfig, growl) {
							window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

							eaasClient.onError = function(message) {
								$state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
							};

                            $scope.onExit = function() {
                                return ('close?');
                            };
                            window.onbeforeunload =  $scope.onExit;

							// fallback to defaults when no cookie is found
							var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

							var params = {
								keyboardLayout: kbLayoutPrefs.language.name,
								keyboardModel: kbLayoutPrefs.layout.name
							};

							params.software = $stateParams.softwareId;
							params.object = $stateParams.objectId;
							params.userContext = $stateParams.userId;


							eaasClient.startEnvironment($stateParams.envId, params).then(function () {
                                eaasClient.connect().then(function() {
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
                            });
						},
						controllerAs: "startEmuCtrl"
					},
					'actions': {
						templateUrl: 'partials/wf-s/actions.html',
						controller: function ($scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, mediaCollection,
						    $timeout, $translate, $pageVisibility, chosenEnv) {
							var vm = this;
                            vm.type = $stateParams.type;

							if(chosenEnv.data)
							    vm.enablePrinting = chosenEnv.data.enablePrinting;
							else
							    vm.enablePrinting = false;
							
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

							vm.sendCtrlAltDel = function() {
                            	window.eaasClient.sendCtrlAltDel();
                            };

							vm.stopEmulator = function () {
								window.eaasClient.release();
								$('#emulator-stopped-container').show();
								$window.onbeforeunload = null;
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
                            			this.objectId = $stateParams.softwareId;
                            			if(!this.objectId)
                            			    this.objectId = $stateParams.objectId;

                            			this.changeMedium = function(newMediumLabel) {
                                            if (newMediumLabel == null) {
                                                growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                                                return;
                                            }

                                            this.isChangeMediaSubmitting = true;

                                            postObj = {};
                                            postObj.objectId = this.objectId;
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

                                        this.type = $stateParams.type;
                                        if(!this.type)
                                            alert("ERROR: invalid type");

										this.isSavingEnvironment = false;
										this.saveEnvironment = function() {

                                            this.isSavingEnvironment = true;
                                            vm.stopEmulator();

											var postReq = {};
											postReq.type = this.type;
											postReq.envId = $stateParams.envId;
											postReq.message = this.envDescription;
											postReq.title = this.envName;
											postReq.softwareId = $stateParams.softwareId;
											postReq.objectId = $stateParams.objectId;
											postReq.userId = $stateParams.userId;

											snapshotDoneFunc = function(data, status) {
											    if(data.status === '1') {
											        snapshotErrorFunc(data.message);
                                                    return;
                                                }

                                                growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
                                                window.eaasClient.release();
                                                $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                                $scope.$close();
                                                this.isSavingEnvironment = false;
                                            };

                                            snapshotErrorFunc = function(error) {
                                                growl.error(error, {title: 'Error ' + error});
                                                $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                                $scope.$close();
                                                this.isSavingEnvironment = false;
                                            };

	                                        window.eaasClient.snapshot(postReq, snapshotDoneFunc, snapshotErrorFunc);
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
						return $http.get(localConfig.data.eaasBackendURL + formatStr(objectEnvironmentsUrl, $stateParams.objectId, "false", "false"));
					},
					metadata : function($stateParams, $http, localConfig) {
					    return $http.get(localConfig.data.eaasBackendURL + formatStr(metadataUrl, $stateParams.objectId));
					}
				},
				views: {
					'wizard': {
						templateUrl: 'partials/wf-s/edit-object-characterization.html',
						controller: "editObjectCharacterizationController as editObjectCharacterizationCtrl"
					}
				}
			});
			
		growlProvider.globalTimeToLive(5000);
	});
})();
