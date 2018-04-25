/*
 * Import third party libraries
 */

import angular from 'angular';
import 'angular-loading-bar';
import 'textangular';
import ngSanitize from 'angular-sanitize';
import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies';
import 'angular-ui-router';
import 'angular-ui-bootstrap';
import 'ui-select';
import 'angular-growl-v2';
import 'angular-ellipsis';
import 'angular-bootstrap-contextmenu';
import 'angular-translate';
import 'angular-translate-loader-static-files';
import 'angular-smart-table';
import 'chart.js';
import 'angular-chart.js';
import 'angular-ui-mask';
import 'angular-wizard';
import 'bootstrap-ui-datetime-picker';
import 'sortablejs';
import 'sortablejs/ng-sortable';

/*
 * Import legacy emulator libraries
 */

var $ = require('jquery');
window.$ = window.jQuery = $; // publish jQuery into window scope for emulator libs

const appendScript = function(scriptText) {
    let script   = document.createElement("script");
    script.type  = "text/javascript";
    script.text  = scriptText;
    document.body.appendChild(script);
};

import guacamolejs from 'raw-loader!../../../common/eaas-client/guacamole/guacamole.js';
appendScript(guacamolejs);

import eaasclientjs from 'raw-loader!../../../common/eaas-client/eaas-client.js';
appendScript(eaasclientjs);

/*
 * Import application specific modules
 */

import './modules/helpers.js';
import './modules/modules.js';

/*
 * Import stylesheets
 */
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import 'ui-select/dist/select.css';
import 'angular-growl-v2/build/angular-growl.css';
import 'angular-loading-bar/build/loading-bar.css';
import 'textangular/dist/textAngular.css'
import 'font-awesome/css/font-awesome.css';
import 'angular-wizard/dist/angular-wizard.css';
import '../../../common/eaas-client/guacamole/guacamole.css';
import '../../../common/eaas-client/eaas-client.css';
import './app.css';

export default angular.module('emilAdminUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap',
                                   'ui.mask', 'ui.select', 'angular-growl', 'smart-table', 'ng-sortable', 'pascalprecht.translate', 
                                   'textAngular', 'mgo-angular-wizard', 'ui.bootstrap.datetimepicker', 'chart.js', 'emilAdminUI.helpers', 'emilAdminUI.modules'])

.constant('kbLayouts', require('./../public/kbLayouts.json'))

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

.controller('setKeyboardLayoutDialogController', ['$scope', '$cookies', '$translate', 'kbLayouts', 'growl', function($scope, $cookies, $translate, kbLayouts, growl) {
    this.kbLayouts = kbLayouts;

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
}])

.controller('editObjectCharacterizationController', ['$scope', '$state', '$stateParams', '$uibModal', '$http', 'localConfig', 'objEnvironments', 'environmentList', 'growl', '$translate', 'metadata', 'helperFunctions', 'REST_URLS', function ($scope, $state, $stateParams, $uibModal, $http, localConfig, objEnvironments, environmentList, growl, $translate, metadata, helperFunctions, REST_URLS) {
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
                + helperFunctions.formatStr(REST_URLS.objectEnvironmentsUrl, $stateParams.objectId, updateClassification, updateProposal))
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
            controller: function($scope, helperFunctions, REST_URLS) {
                this.defaultEnv = null;
                this.environments = environmentList.data.environments;
                this.osId = osId;
                this.osLabel = osLabel;

                this.setEnvironment = function() {
                    $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.setDefaultEnvironmentUrl, this.osId, this.defaultEnv.envId))
                        .then(function(response) {
                            if (response.data.status !== "0") {
                                growl.error(response.data.message, {title: 'Error ' + response.data.message});
                                $scope.$close();
                            }
                            else {
                                console.log("set default env for " + osId + " defaultEnv " + this.defaultEnv.envId);
                            }
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
        $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
            objectId: $stateParams.objectId,
            environments: vm.objEnvironments
        }).then(function() {
            $state.go('wf-s.object-overview');
        });
    };
}])

.config(['$stateProvider', '$urlRouterProvider', 'growlProvider', '$httpProvider', '$translateProvider', '$provide', function($stateProvider, $urlRouterProvider, growlProvider, $httpProvider, $translateProvider, $provide) {
    /*
     * Use ng-sanitize for textangular, see https://git.io/vFd7y
     */
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) {
        taOptions.forceTextAngularSanitize = false;
        return taOptions;
    }]);

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
                buildInfo: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl);
                }
            },
            controller: ['$uibModal', 'localConfig', 'buildInfo', function($uibModal, localConfig, buildInfo) {
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
                        template: require('./modules/admin/settingsdialog/settings-dialog.html'),
                        resolve: {
                            localConfig: function () {
                                return localConfig;
                            }
                        },
                        controller: "SettingsDialogController as settingsDialogCtrl"
                    });
                };
            }],
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
                        const getFirstNumber = (str) => parseInt(str.match(/\d+/)[0], 10);

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
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
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
                objectList: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    // Don't fetch list for edit
                    if ($stateParams.swId != "-1") {
                        return null;
                    }
                    if("softwareArchiveId" in localConfig.data)
                    {
                        return $http.get(localConfig.data.eaasBackendURL +
                            helperFunctions.formatStr(REST_URLS.getSoftwareListURL, localConfig.data.softwareArchiveId));
                    }
                    else {
                        return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getObjectListURL);
                    }
                },
                osList : function($http) {
                    return $http.get("osList.json");
                },
                softwareObj: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
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

                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getSoftwareObjectURL, $stateParams.swId));
                },
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-i/sw-ingest.html',
                    controller: function ($stateParams, $state, $http, localConfig, growl, objectList, softwareObj, osList, REST_URLS) {
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
                                console.log("add presets");
                                vm.operatingSystemId.puids.forEach(function(puid) {
                                   if(!vm.softwareObj.nativeFMTs.includes(puid.puid))
                                   {
                                       vm.softwareObj.nativeFMTs.push(puid.puid);
                                   }
                                });

                            }
                            // console.log(JSON.stringify(vm.softwareObj));
                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveSoftwareUrl, vm.softwareObj).then(function(response) {
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
                systemList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getEnvironmentTemplates);
                },
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
                }
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-i/new-image.html',
                    controller: function ($http, $scope, $state, $stateParams, systemList, softwareList, growl, localConfig, $uibModal, REST_URLS) {
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
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.createEnvironmentUrl, {
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
                                 var modal = $uibModal.open({
                                    animation: true,
                                    backdrop: 'static',
                                    templateUrl: 'partials/import-wait.html'
                                 });

                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.importImageUrl,
                                        {
                                            urlString: vm.hdurl, 
                                            templateId: vm.selectedSystem.id, 
                                            label: vm.name, urlString: vm.hdurl, 
                                            nativeConfig: vm.native_config
                                        },
                                        {
                                            timeout: "6000000"
                                        }
                                        ).then(function(response) {
                                    if (response.data.status !== "0") 
                                        growl.error(response.data.message, {title: 'Error ' + response.data.status});

                                    modal.close();
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
                environmentList: function($http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "base"));
                },
                objectEnvironmentList: function($http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "object"))
                },
                buildInfo: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl);
                }
            },
            controller: ['$state', '$uibModal', '$http', 'localConfig', 'growl', 'buildInfo', function($state, $uibModal, $http, localConfig, growl, buildInfo) {
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
                        templateUrl: require('./modules/admin/settingsdialog/settings-dialog.html'),
                        resolve: {
                            localConfig: function() {
                                return localConfig;
                            }
                        },
                        controller: "SettingsDialogController as settingsDialogCtrl"
                    });
                };
            }],
            controllerAs: "baseCtrl"
        })
        .state('wf-s.synchronize-image-archives', {
          url: "/synchronize-image-archives",
          views: {
              'wizard': {
                  templateUrl: 'partials/wf-s/synchronize-image-archives.html',
                  controller: ['$http', '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate', 'WizardHandler', function ($http, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, WizardHandler) {
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
                  }],
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
                objectList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getObjectListURL);
                }
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/objects.html",

                    controller: ['$state', '$stateParams', 'objectList', function($state, $stateParams, objectList) {
                        var vm = this;
                        vm.objectList = objectList.data.objects;
                    }],
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
                sessionList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.userSessionListUrl);
                }
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/user-sessions.html",

                    controller: ['$state', '$stateParams', 'sessionList', '$translate', '$http', 'localConfig', 'growl', 'helperFunctions', 'REST_URLS', function($state, $stateParams, sessionList, $translate, $http, localConfig, growl, helperFunctions, REST_URLS) {
                        var vm = this;
                        vm.sessionList = sessionList.data.environments;
                        console.log(vm.sessionList);

                        vm.deleteSession = function(_envId)
                        {
                            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                                console.log(_envId);
                                $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.deleteSessionUrl, _envId))
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
                    }],
                    controllerAs: "sessionListCtrl"
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
                    controller: ['$http', '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate', 'helperFunctions', 'REST_URLS', function ($http, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, helperFunctions, REST_URLS) {
                        var vm = this;
                        
                        if (environmentList.data.status !== "0") {
                            $state.go('error', {errorMsg: {title: "Load Environments Error " + environmentList.data.status, message: environmentList.data.message}});
                            return;
                        }
                        
                        vm.exportEnvironment = function(envId) {
                                
                            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.exportEnvironmentUrl, envId))
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
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
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
                    }],
                    controllerAs: "standardEnvsOverviewCtrl"
                }
            }
        })
        .state('wf-s.new-env', {
            url: "/new-env",
            resolve: {
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
                }
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-s/new-env.html',
                    controller: ['$scope', '$state', '$stateParams', 'environmentList', 'softwareList', 'growl', function ($scope, $state, $stateParams, environmentList, softwareList, growl) {
                        this.envs = environmentList.data.environments;
                        this.software = softwareList.data.descriptions;
                    }],
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
                    controller: ['$http', '$scope', '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate', 'helperFunctions', 'REST_URLS', function ($http, $scope, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, helperFunctions, REST_URLS) {
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
                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateDescriptionUrl, {
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
                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.forkRevisionUrl, {
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
                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.revertRevisionUrl, {
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
                    }],
                    controllerAs: "editEnvCtrl"
                }
            }
        })
        .state('wf-s.emulator', {
            url: "/emulator",
            resolve: {
                mediaCollection: function($http, $stateParams, localConfig, helperFunctions, REST_URLS) {
                        return $http.get(localConfig.data.eaasBackendURL +
                        (($stateParams.softwareId != null) ?
                            helperFunctions.formatStr(REST_URLS.mediaCollectionURL, $stateParams.softwareId) :
                            helperFunctions.formatStr(REST_URLS.mediaCollectionURL, $stateParams.objectId)));
                    }
            },
            params: {
                envId: "-1",
                isNewEnv: false,
                isCreateEnv: false,
                isImportEnv: false,
                softwareId: null,
                isNewObjectEnv: false,
                isUserSession: false,
                objectId: null
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/emulator.html",
                    controller: ['$scope', '$sce', '$state', '$stateParams', '$cookies', '$translate', 'localConfig', 'growl', function ($scope, $sce, $state, $stateParams, $cookies, $translate, localConfig, growl) {
                        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

                        eaasClient.onError = function(message) {
                            $state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
                        };

                        // fallback to defaults when no cookie is found
                        var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

                        var params = {
                            keyboardLayout: kbLayoutPrefs.language.name,
                            keyboardModel: kbLayoutPrefs.layout.name
                        };
                        console.log($stateParams);
                        if ($stateParams.isNewEnv || $stateParams.softwareId !== null) {
                            params.software = $stateParams.softwareId;
                        } else if ($stateParams.isNewObjectEnv || $stateParams.isUserSession) {
                            params.object = $stateParams.objectId;
                        }

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
                    }],
                    controllerAs: "startEmuCtrl"
                },
                'actions': {
                    templateUrl: 'partials/wf-s/actions.html',
                    controller: ['$scope', '$window', '$state', '$http', '$uibModal', '$stateParams', 'growl', 'localConfig', 'mediaCollection', '$timeout', '$translate', 'helperFunctions', 'REST_URLS', function ($scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, mediaCollection, $timeout, $translate, helperFunctions, REST_URLS) {
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

                        vm.sendCtrlAltDel = function() {
                            window.eaasClient.sendCtrlAltDel();
                        };

                        vm.stopEmulator = function () {
                            window.eaasClient.release();
                            $('#emulator-stopped-container').show();
                            
                            if($stateParams.isTestEnv)
                            {
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
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

                                        var postObj = {};
                                        postObj.objectId = $stateParams.softwareId;
                                        postObj.driveId = window.eaasClient.driveId;
                                        postObj.label = newMediumLabel;

                                        var changeSuccsessFunc = function(data, status) {
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
                                controller: function($scope, helperFunctions, REST_URLS) {
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
                                        postReq.message = this.envDescription;    

                                        if ($stateParams.isImportEnv)
                                        {
                                            postReq.type = "saveConfiguration";
                                            console.log("is import env");
                                            postReq.commit = true;

                                            var postResult = $http.post(localConfig.data.eaasBackendURL + REST_URLS.commitUrl, postReq);
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
                                        }

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
                                             if ($stateParams.isCreateEnv){
                                                postReq.commit = true;
                                                console.log("is create env");
                                                postReq.softwareId = $stateParams.softwareId;
                                            }
                                            else 
                                                postReq.commit = false;
                                        }

                                        var snapshotDoneFunc = function(data, status) {
                                            growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
                                            window.eaasClient.release();
                                            $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                            $scope.$close();

                                        };
//                                            } else {
//                                                growl.error(response.data.message, {title: 'Error ' + response.data.status});
//                                                $state.go('wf-s.standard-envs-overview', {}, {reload: true});
//                                            }

                                        window.eaasClient.snapshot(postReq, snapshotDoneFunc);

                                    };
                                    
                                    this.deleteEnvironment = function() {
                                        this.isSavingEnvironment = true;
                                        window.eaasClient.release();
                                        $('#emulator-stopped-container').show();
                                        
                                        $scope.$close();
                                        
                                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
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
                    }],
                    controllerAs: "actionsCtrl"
                }
            }
        })
        .state('wf-s.edit-object-characterization', {
            url: "/edit-object-characterization?objectId",
            resolve: {
                objEnvironments: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.objectEnvironmentsUrl, $stateParams.objectId, "false", "false"));
                },
                metadata : function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.metadataUrl, $stateParams.objectId));
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
}]);