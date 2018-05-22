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

// .constant('kbLayouts', require('./../public/kbLayouts.json'))

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
    .component('containerInputList', {
        templateUrl: 'partials/components/containerInputList.html',
        bindings: {
            list: '=',
            heading: '@',
            listEmptyNote: '@',
            inputPlaceholder: '@',
            addButtonText: '@'
        }
    })


    .run(function($rootScope, $state) {
        $rootScope.emulator = {state : ''};

        $rootScope.chk = {};
        $rootScope.chk.transitionEnable = true;

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (!$rootScope.chk.transitionEnable) {
                event.preventDefault();
                // $scope.toState = toState;
                // $scope.open();
                //  console.log("prevent: $stateChangeStart: "+toState.name);
            }
//            else {
//                console.log("$stateChangeStart: "+toState.name);
//            }
        });
    })

    .controller('settingsDialogController', ['$state', '$http', '$scope', '$uibModal', 'localConfig', 'kbLayouts', 'growl', 'REST_URLS', function ($state, $http, $scope, $uibModal, localConfig, kbLayouts, growl, REST_URLS) {
        var vm = this;
        vm.serverLogUrl = localConfig.data.eaasBackendURL + "Emil/serverLog";
        vm.usageLogUrl = localConfig.data.eaasBackendURL + "Emil/usageLog";
        vm.importEnvs = function () {
            $scope.$close();

            $http.get(localConfig.data.eaasBackendURL + REST_URLS.initEmilEnvironmentsURL).then(function (response) {
                    if (response.data.status === "0") {
                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                        growl.success(response.data.message);
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
                }
            );
        };

        vm.syncObjects = function () {
            $scope.$close();

            $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncObjectsUrl).then(function (response) {
                    if (response.data.status === "0") {
                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                        growl.success(response.data.message);
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
                }
            );
        };

        vm.syncImages = function () {
            $scope.$close();

            $http.get(localConfig.data.eaasBackendURL + REST_URLS.syncImagesUrl).then(function (response) {
                    if (response.data.status === "0") {
                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                        growl.success(response.data.message);
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
                }
            );
        };
        vm.showSetKeyboardLayoutDialog = function () {
            $uibModal.open({
                animation: true,
                templateUrl: 'partials/set-keyboard-layout-dialog.html',
                resolve: {
                    kbLayouts: function () {
                        return kbLayouts; // refers to outer kbLayouts variable
                    }
                },
                controller: "SetKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
            });
        };


    }])

.controller('SetKeyboardLayoutDialogController', ['$scope', '$cookies', '$translate', 'kbLayouts', 'growl', function($scope, $cookies, $translate, kbLayouts, growl) {
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
}])

.controller('editObjectCharacterizationController', ['$scope', '$state', '$stateParams', '$uibModal', '$http',
    'localConfig', 'objEnvironments', 'environmentList', 'growl', '$translate', 'metadata', 'helperFunctions', 'REST_URLS',
    function ($scope, $state, $stateParams, $uibModal, $http, localConfig, objEnvironments, environmentList, growl, $translate, metadata, helperFunctions, REST_URLS) {
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

        vm.resetChanges = function()
        {
            if (window.confirm($translate.instant('CHAR_CONFIRM_RESET_T'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.overrideObjectCharacterizationUrl, {
                    objectId: $stateParams.objectId,
                    environments: []
                }).then(function() {
                    $state.go('wf-s.object-overview');
                });
            }
        }

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
                if (((rejection || {}).config || {}).method !== 'GET' || (rejection && rejection.data && rejection.data.status)) {
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
                buildInfo: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl);
                }
            },
            controller: ['$uibModal', 'localConfig', 'kbLayouts', 'buildInfo', function($uibModal, localConfig, kbLayouts, buildInfo) {
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
                            localConfig: function () {
                                return localConfig;
                            },
                            kbLayouts: function() {
                                return kbLayouts;
                            }
                        },
                        controller: "settingsDialogController as settingsDialogCtrl"
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
                            return elem.__resource_type === 'ResourceProvider';buildInfo
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
                    controller: function ($http, $scope, $state, $stateParams, systemList, softwareList, growl, localConfig, $uibModal, $timeout, helperFunctions, REST_URLS) {
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
                           var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getTaskState, _taskId)).then(function(response){
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
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.createEnvironmentUrl, {
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
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.importImageUrl,
                                    {
                                        urlString: vm.hdurl,
                                        templateId: vm.selectedSystem.id,
                                        label: vm.name, urlString: vm.hdurl,
                                        nativeConfig: vm.native_config,
                                        rom: vm.rom
                                    }).then(function(response) {
                                    if(response.data.status == "0") {
                                        var taskId = response.data.taskId;
                                       var modal = $uibModal.open({
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
        .state('wf-i.new-container', {
            url: "/new-container",
            resolve: {
                // change for containers
                runtimeList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getOriginRuntimeList);
                }
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-i/new-container.html',
                    controller: ['$http', '$scope', '$state', '$stateParams', 'runtimeList', 'growl', 'localConfig', '$uibModal', '$timeout', 'helperFunctions', 'REST_URLS',
                        function ($http, $scope, $state, $stateParams, runtimeList, growl, localConfig, $uibModal, $timeout, helperFunctions, REST_URLS) {

                        var container = this;
                        container.runtimes = runtimeList.data.runtimes;
                        console.log(container.runtimes);

                        // initialize default values of the form
                        container.imageSize = 1024;
                        container.imageType = 'size';

                        container.imageId = "";
                        container.env = [];
                        container.args = [];

                        //TODO: ?
                        container.onSelectRuntime = function(item, model) {
                            container.runtime = item.id;
                        };

                        container.isValid = function() {

                            if(!container.imageInput || !container.imageOutput)
                            {
                                growl.error("input / ouput folder are required");
                                return false;
                            }

                            if(container.args.length == 0)
                            {
                                growl.error("process is required");
                                return false;
                            }

                            if(!container.name)
                            {
                                growl.error("container name is required");
                                return false;
                            }

                            if(!container.imageUrl)
                            {
                                growl.error("image file / image URL is required");
                                return false;
                            }

                            return true;
                        };

                        container.checkState = function(_taskId)
                        {
                           var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function(response){
                                if(response.data.status == "0")
                                {
                                    if(response.data.isDone)
                                    {
                                        container.modal.close();
                                        growl.success("import successful.");
                                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                    }
                                    else
                                        $timeout(function() {container.checkState(_taskId);}, 2500);
                                }
                                else
                                {
                                    container.modal.close();
                                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                                }
                            });
                        };

                        //Next Step
                        container.import = function() {

                            if(!container.isValid())
                                return;

                            var convertedEnv = [];
                            var convertedArgs = [];
                            var escapeEl = document.createElement('textarea');

                            var unescape = function(html) {
                                escapeEl.innerHTML = html;
                                return escapeEl.textContent;
                            };

                            for(var _e in container.env)
                            {
                                convertedEnv.push(unescape(container.env[_e]));
                            }

                            for(var _a in container.args)
                            {
                                convertedArgs.push(unescape(container.args[_a]));
                            }

                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.importContainerUrl,
                                {
                                    urlString: container.imageUrl,
                                    runtimeID: container.runtime,
                                    name: container.name,
                                    processArgs: container.args,
                                    processEnvs: container.env,
                                    inputFolder: container.imageInput,
                                    outputFolder: container.imageOutput,
                                    imageType: container.archiveType,
                                    guiRequired: container.gui
                                }).then(function(response) {
                                if(response.data.status === "0") {
                                    var taskId = response.data.taskId;
                                    container.modal = $uibModal.open({
                                        animation: true,
                                        templateUrl: 'partials/import-wait.html'
                                    });
                                    container.checkState(taskId);
                                }
                                else {
                                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                                }
                            });
                        };
                    }],
                    controllerAs: "newContainerCtrl"
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
                containerEnvironmentList: function($http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "container"))
                },
                kbLayouts: function($http) {
                    return $http.get("kbLayouts.json");
                },
                buildInfo: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl);
                }
            },
            controller: ['$state', '$uibModal', '$http', 'localConfig', 'kbLayouts', 'growl', 'buildInfo', function($state, $uibModal, $http, localConfig, kbLayouts, growl, buildInfo) {
                var vm = this;

                this.buildInfo = buildInfo.data.version;

                vm.open = function() {
                    $uibModal.open({
                        animation: false,
                        templateUrl: 'partials/wf-s/help-emil-dialog.html'
                    });
                }

                vm.showSettingsDialog = function() {
                    $uibModal.open({
                        animation: false,
                        templateUrl: 'partials/settings-dialog.html',
                        resolve: {
                            localConfig: function () {
                                return localConfig;
                            },
                            kbLayouts: function () {
                                return kbLayouts;
                            }
                        },
                        controller: "settingsDialogController as settingsDialogCtrl"
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
                  controller: ['$http', '$timeout',  '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate', 'WizardHandler',
                      '$uibModal', 'helperFunctions' , 'REST_URLS',
                      function ($http, $timeout, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, WizardHandler, $uibModal, helperFunctions, REST_URLS) {
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

                      vm.fetchArchivesFromRemote = function (URI, type, remoteEnvironmentList) {
                          if (!URI) {
                              growl.error('Please enter a valid URI');
                              return;
                          }
                          vm.uri = encodeURIComponent(URI);
                          remoteEnvironmentList = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getRemoteEnvsUrl, encodeURIComponent(URI), type)).then(function(response) {
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
                             var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getTaskState, _taskId)).then(function(response){
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
        .state('wf-s.handles', {
            url: "/handles",
            resolve: {
                localConfig: function($http) {
                    return $http.get("config.json");
                },
                handles: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList);
                }
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/handleList.html",

                    controller: function($state, $stateParams, $http,  handles, localConfig, helperFunctions) {
                        var vm = this;
                        vm.handles = handles.data.handles;

                        $("#addHandleValue").hide();
                        $("#addHandle").hide();
                        $("#save-addHandle-field").hide();

                        vm.showAddHandleDialog = function () {
                            $("#save-addHandle-field").show();
                            $("#addHandle").show();
                            $("#addHandleValue").show();
                            $("#show-addHandle-field").hide();
                        };

                        vm.addHandle = function () {
                            $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/createHandle", encodeURI($stateParams.handle)), {
                                handle: document.getElementById("addHandle").value,
                                handleValue: document.getElementById("addHandleValue").value
                            });

                            $state.reload();
                        };

                    },
                    controllerAs: "handleOverview"
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

                    controller: ['$scope' , '$state', '$stateParams', 'sessionList', '$translate', '$http', 'localConfig', 'growl', '$interval', 'helperFunctions', 'REST_URLS', function($scope, $state, $stateParams, sessionList, $translate, $http, localConfig, growl, $interval, helperFunctions, REST_URLS) {
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

                        var theInterval = $interval(function(){
                            $state.reload();
                        }.bind(this), 10000);

                        $scope.$on('$destroy', function () {
                            $interval.cancel(theInterval)
                        });
                    }],
                    controllerAs: "sessionListCtrl"
                }
            }
        })
        .state('wf-s.standard-envs-overview', {
            url: "/standard-envs-overview",
            params: {
                showObjects: false,
                showContainers: false
            },
            resolve : {
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
                }
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-s/standard-envs-overview.html',
                    controller: ['$rootScope', '$http', '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'containerEnvironmentList', 'localConfig', 'growl', '$translate',
                        '$uibModal', 'softwareList', 'helperFunctions', 'REST_URLS',
                        function ($rootScope, $http, $state, $stateParams, environmentList, objectEnvironmentList, containerEnvironmentList, localConfig, growl, $translate, $uibModal, softwareList, helperFunctions, REST_URLS) {
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

                        vm.addSoftware = function(envId) {
                            $uibModal.open({
                                animation: true,
                                templateUrl: 'partials/wf-s/select-sw-dialog.html',
                                controller: function($scope) {
                                    this.envId = envId;
                                    this.software = softwareList.data.descriptions;
                                    this.returnToObjects = $stateParams.showObjects;
                                },
                                controllerAs: "addSoftwareDialogCtrl"
                            });
                        };

                        var confirmDeleteFn = function(envId)
                        {
                            console.log("confirmed");
                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                                envId: envId,
                                deleteMetaData: true,
                                deleteImage: true,
                                force: true
                            }).then(function(_response) {
                                if (_response.data.status === "0") {
                                    // remove env locally
                                    vm.envs = vm.envs.filter(function(env) {
                                        return env.envId !== envId;
                                    });
                                    $rootScope.chk.transitionEnable = true;
                                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                }
                                else {
                                    $rootScope.chk.transitionEnable = true;
                                    growl.error(_response.data.message, {title: 'Error ' + _response.data.status});
                                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});

                                }
                            });
                        };

                            vm.deleteContainer = function (envId) {
                                $rootScope.chk.transitionEnable = false;
                                if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                                    $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteContainerUrl, {
                                        envId: envId,
                                        deleteMetaData: true,
                                        deleteImage: true,
                                        force: false
                                    }).then(function (response) {
                                        if (response.data.status === "0") {
                                            // remove env locally
                                            vm.envs = vm.envs.filter(function (env) {
                                                return env.envId !== envId;
                                            });
                                            $rootScope.chk.transitionEnable = true;
                                            growl.success($translate.instant('JS_DELENV_SUCCESS'));
                                            $state.go('wf-s.standard-envs-overview', {
                                                showContainers: true,
                                                showObjects: false
                                            }, {reload: true});
                                        }
                                        else {
                                            $rootScope.chk.transitionEnable = true;
                                            growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                            $state.go('wf-s.standard-envs-overview', {
                                                showContainers: true,
                                                showObjects: false
                                            }, {reload: true});
                                        }
                                    });
                                }
                            };


                            vm.deleteEnvironment = function(envId) {
                            $rootScope.chk.transitionEnable = false;

                            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                                    envId: envId,
                                    deleteMetaData: true,
                                    deleteImage: true,
                                    force: false
                                }).then(function(response) {
                                    if (response.data.status === "0") {
                                        // remove env locally
                                        vm.envs = vm.envs.filter(function(env) {
                                            return env.envId !== envId;
                                        });
                                        $rootScope.chk.transitionEnable = true;
                                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                    }
                                    else if (response.data.status === "2") {

                                        $uibModal.open({
                                            animation: true,
                                            templateUrl: 'partials/wf-s/confirm-delete-dialog.html',
                                            controller: function($scope) {
                                                this.envId = envId;
                                                this.confirmed = confirmDeleteFn;
                                            },
                                            controllerAs: "confirmDeleteDialogCtrl"
                                        });
                                    }
                                    else {
                                        $rootScope.chk.transitionEnable = true;
                                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                        $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                    }
                                });
                            }
                        };
                        vm.envs = environmentList.data.environments;

                            for (let i = 0; i < vm.envs.length; i++) {
                                console.log("!!!!! env:" + vm.envs[i].envId);
                            }

                        vm.objEnvs = objectEnvironmentList.data.environments;
                        vm.containerEnvs = containerEnvironmentList.data.environments;

                            for (let i = 0; i < vm.containerEnvs.length; i++) {
                                console.log("!!!!! container: " + vm.containerEnvs[i].envId);
                            }

                        vm.showObjects = $stateParams.showObjects;
                        vm.showContainers = $stateParams.showContainers;
                        }],

                    controllerAs: "standardEnvsOverviewCtrl"
                }
            }
        })
        // .state('wf-s.new-env', {
        //     url: "/new-env",
        //     resolve: {
        //         softwareList: function($http, localConfig, REST_URLS) {
        //             return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
        //         }
        //     },
        //     views: {
        //         'wizard': {
        //             templateUrl: 'partials/wf-s/new-env.html',
        //             controller: ['$scope', '$state', '$stateParams', 'environmentList', 'softwareList', 'growl', function ($scope, $state, $stateParams, environmentList, softwareList, growl) {
        //                 this.envs = environmentList.data.environments;
        //                 this.software = softwareList.data.descriptions;
        //             }],
        //             controllerAs: "newEnvCtrl"
        //         }
        //     }
        // })
        .state('wf-s.edit-env', {
            url: "/edit-env",
            params: {
                envId: null,
                objEnv: false
            },
            resolve: {
                objectDependencies: function($http, localConfig, $stateParams, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getObjectDependencies, $stateParams.envId));
                }
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-s/edit-env.html',
                    controller: function ($http, $scope, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, objectDependencies, helperFunctions, REST_URLS) {
                        var vm = this;

                        vm.showDateContextPicker = false;
                        var envList = null;
                        vm.isObjectEnv = $stateParams.objEnv;

                        this.dependencies = objectDependencies.data;
                        vm.isObjectEnv = $stateParams.objEnv;
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
                        this.nativeConfig = this.env.nativeConfig;
                        this.useXpra = this.env.useXpra;

                        this.shutdownByOs = this.env.shutdownByOs;
                        this.os = this.env.os;
                        this.userTag = this.env.userTag;

                        this.saveEdit = function() {
                            var timecontext = null;
                            if(this.showDateContextPicker)
                            {
                                console.log('Date(UNIX Epoch): ' + vm.datetimePicker.date.getTime());
                                timecontext = vm.datetimePicker.date.getTime();
                            }

                            this.env.title = this.envTitle;
                            this.env.description = this.envDescription;
                            this.env.helpText = this.envHelpText;

                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateDescriptionUrl, {
                                envId: $stateParams.envId,
                                title: this.envTitle,
                                description: this.envDescription,
                                helpText: this.envHelpText,
                                time: timecontext,
                                enablePrinting: vm.enablePrinting,
                                enableRelativeMouse: this.enableRelativeMouse,
                                shutdownByOs: this.shutdownByOs,
                                os: this.os,
                                userTag: this.userTag,
                                nativeConfig: this.nativeConfig,
                                useXpra : this.useXpra
                            }).then(function(response) {
                                if (response.data.status === "0") {
                                    growl.success($translate.instant('JS_ENV_UPDATE'));
                                } else {
                                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                }

                                if (vm.isObjectEnv)
                                    $state.go('wf-s.standard-envs-overview', {showObjects: true}, {reload: true});
                                else
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

                        if(this.env.timeContext)
                        {
                            vm.datetimePicker.date.setTime(this.env.timeContext);
                            vm.showDateContextPicker = true;
                        }

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
        .state('wf-s.edit-container', {
            url: "/edit-container",
            params: {
                envId: null,
            },
            views: {
                'wizard': {
                    templateUrl: 'partials/wf-s/edit-container.html',
                    controller: ['$http', '$scope', '$state', '$stateParams', 'containerEnvironmentList', 'localConfig', 'growl', '$translate', 'REST_URLS', function ($http, $scope, $state, $stateParams, containerEnvironmentList, localConfig, growl, $translate, REST_URLS) {
                        var vm = this;

                        vm.showDateContextPicker = false;
                        var envList = null;

                        envList = containerEnvironmentList.data.environments;
                        this.env = null;

                        for(var i = 0; i < envList.length; i++) {
                            if (envList[i].envId === $stateParams.envId) {
                                this.env = envList[i];
                                break;
                            }
                        }

                        if(this.env === null)
                        {
                            growl.error("Container not found");
                            $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                        }

                        this.envTitle = this.env.title;
                        this.envHelpText = this.env.helpText;
                        this.envInput = this.env.input;
                        this.envOutput = this.env.output;
                        this.processArgs = this.env.processArgs; // todo deep copy
                        this.processEnvs = this.env.processEnvs;

                        this.saveEdit = function() {

                            this.env.title = this.envTitle;
                            this.env.input = this.envInput;
                            this.env.output = this.envOutput;
                            this.env.helpText = this.envHelpText;
                            this.env.processArgs = this.processArgs;
                            this.env.processEnvs = this.processEnvs;

                            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateContainerUrl, {
                                id: $stateParams.envId,
                                title: this.envTitle,
                                helpText: this.envHelpText,
                                outputFolder : this.envOutput,
                                inputFolder : this.envInput,
                                processEnvs : this.processEnvs,
                                processArgs : this.processArgs
                            }).then(function(response) {
                                if (response.data.status === "0") {
                                    growl.success($translate.instant('JS_ENV_UPDATE'));
                                } else {
                                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                                }
                                $state.go('wf-s.standard-envs-overview', {showObjects: false, showContainers: true}, {reload: true});
                            });
                        };
                    }],
                    controllerAs: "editContainerCtrl"
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
                },
                chosenEnv: function($http, $stateParams, localConfig, helperFunctions, REST_URLS) {
                    if($stateParams.type != "saveImport" && $stateParams.type != 'saveCreatedEnvironment')
                        return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getEmilEnvironmentUrl, $stateParams.envId));
                    else
                        return {};
                }
            },
            params: {
                envId: null,
                type: 'saveRevision',
                softwareId: null,
                isUserSession: false,
                objectId: null,
                userId: null,
                returnToObjects: false
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/emulator.html",
                    controller: ['$rootScope', '$scope', '$sce', '$state', '$stateParams', '$cookies', '$translate', 'localConfig', 'growl', function ($rootScope, $scope, $sce, $state, $stateParams, $cookies, $translate, localConfig, growl) {
                        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

                        eaasClient.onError = function(message) {
                            $state.go('error', {errorMsg: {title: "Emulation Error", message: message.error}});
                        };

                        window.onbeforeunload = function(e) {
                            var dialogText = $translate.instant('MESSAGE_QUIT');
                            e.returnValue = dialogText;
                            return dialogText;
                        };

                        window.onunload = function() {
                            window.onbeforeunload = null;
                        }

                        this.link = localConfig.data.baseEmulatorUrl + "/#/emulationSession?environmentId=" + $stateParams.envId;
                        if($stateParams.objectId)
                            this.link += "&objectId=" + $stateParams.objectId;

                        window.eaasClient.onEmulatorStopped = function() {
                            if($rootScope.emulator.state == 'STOPPED')
                                return;

                            $rootScope.emulator.state = 'STOPPED';
                            $("#emulator-container").hide();
                            $("#emulator-loading-container").show();
                            $("#emulator-loading-container").text($translate.instant('JS_EMU_STOPPED'));
                            $scope.$apply();
                        };

                        // fallback to defaults when no cookie is found
                        var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs') || {language: {name: 'us'}, layout: {name: 'pc105'}};

                        var params = {
                            keyboardLayout: kbLayoutPrefs.language.name,
                            keyboardModel: kbLayoutPrefs.layout.name
                        };

                        params.software = $stateParams.softwareId;
                        params.object = $stateParams.objectId;
                        params.userId = $stateParams.userId;

                        if($stateParams.type == 'saveUserSession')
                        {
                            params.lockEnvironment = true;
                            console.log("locking user session");
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
                    controller: ['$rootScope', '$scope', '$window', '$state', '$http', '$uibModal', '$stateParams', 'growl', 'localConfig', 'mediaCollection',
                        '$timeout', '$translate', 'chosenEnv', 'helperFunctions', 'REST_URLS',
                        function ($rootScope, $scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, mediaCollection, $timeout, $translate, chosenEnv, helperFunctions, REST_URLS) {
                        var vm = this;

                        vm.type = $stateParams.type;
                        vm.emulator = $rootScope.emulator;

                        if(chosenEnv.data)
                        {
                            vm.enablePrinting = chosenEnv.data.enablePrinting;
                            vm.shutdownByOs = chosenEnv.data.shutdownByOs;
                        }
                        else
                            vm.enablePrinting = false;

                        vm.screenshot = function() {
                            window.open(window.eaasClient.getScreenshotUrl());
                        };


                        var printSuccessFn = function(data) {
                            $uibModal.open({
                                animation: true,
                                templateUrl: 'partials/wf-s/printed-list-dialog.html',
                                controller: function($scope) {
                                    this.printJobs = data;

                                    this.download = function(label)
                                    {
                                        window.open(window.eaasClient.downloadPrint(label));
                                    }
                                },
                                controllerAs: "openPrintDialogCtrl"
                            });
                            // window.open(window.eaasClient.getPrintUrl());
                        };


                        vm.openPrintDialog = function ()
                        {
                            window.eaasClient.getPrintJobs(printSuccessFn);
                        };



                        vm.restartEmulator = function() {
                            window.eaasClient.release();
                            $state.reload();
                        };

                        vm.sendCtrlAltDel = function() {
                            window.eaasClient.sendCtrlAltDel();
                        };

                        vm.stopEmulator = function () {
                            $uibModal.open({
                                animation: true,
                                templateUrl: 'partials/wf-s/confirm-stop-dialog.html',
                                controller: function($scope) {
                                    this.confirmed = function()
                                    {
                                        window.onbeforeunload = null;
                                        // window.eaasClient.release();
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
                                        else if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                            $state.go('wf-s.standard-envs-overview', {showObjects: true}, {reload: true});
                                        else
                                            $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                    };
                                },
                                controllerAs: "confirmStopDialogCtrl"
                            });
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

                                        var postObj = {};
                                        postObj.objectId = $stateParams.objectId;
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
                            $('#emulator-container').hide();
                            var saveDialog = function()
                            {
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
                                            window.onbeforeunload = null;

                                            var postReq = {};
                                            postReq.type = this.type;
                                            if(postReq.type === 'objectEnvironment')
                                                postReq.embeddedObject = true;
                                            postReq.envId = $stateParams.envId;
                                            postReq.message = this.envDescription;
                                            postReq.title = this.envName;
                                            postReq.softwareId = $stateParams.softwareId;
                                            postReq.objectId = $stateParams.objectId;
                                            postReq.userId = $stateParams.userId;

                                            var snapshotDoneFunc = (data, status) => {
                                                console.log("error status: " + status);

                                                if(status === '1') {
                                                    console.log("error message: " + data.message);

                                                    snapshotErrorFunc(data.message);
                                                    return;
                                                }

                                                growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
                                                window.eaasClient.release();
                                                if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                                    $state.go('wf-s.standard-envs-overview', {showObjects: true}, {reload: true});
                                                else
                                                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                                $scope.$close();
                                                window.isSavingEnvironment = false;
                                            };

                                            var snapshotErrorFunc = error => {
                                                console.log("given error: " + error);
                                                growl.error(error, {title: 'Error ' + error});
                                                if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                                    $state.go('wf-s.standard-envs-overview', {showObjects: true}, {reload: true});
                                                else
                                                    $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                                                $scope.$close();
                                                window.isSavingEnvironment = false;
                                            };

                                            window.eaasClient.snapshot(postReq, snapshotDoneFunc, snapshotErrorFunc);
                                            $('#emulator-container').show();
                                        };
                                        this.showEmu = function() {
                                            $('#emulator-container').show();
                                        }



                                    },
                                    controllerAs: "openSaveEnvironmentDialogCtrl"
                                });
                            };

                            $uibModal.open({
                                animation: true,
                                templateUrl: 'partials/wf-s/confirm-snapshot-dialog.html',
                                controller: function($scope) {
                                    this.confirmed = function()
                                    {
                                        saveDialog();
                                    };
                                    this.showEmu = function() {
                                        $('#emulator-container').show();
                                    }
                                },
                                controllerAs: "confirmSnapshotDialogCtrl"
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
                    }],
                    controllerAs: "actionsCtrl"
                }
            }
        })
        .state('wf-s.container', {
            url: "/container",
            resolve: {
            },
            params: {
                envId: null,
            },
            views: {
                'wizard': {
                    templateUrl: "partials/wf-s/container.html",
                    controller: ['$rootScope','$scope','$sce','$state','$stateParams','$translate','localConfig','growl','$uibModal','containerEnvironmentList',
                        function ($rootScope, $scope, $sce, $state, $stateParams, $translate, localConfig, growl, $uibModal, containerEnvironmentList) {
                        var vm = this;

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
                        }

                        envList = containerEnvironmentList.data.environments;
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
                            console.log("done " + eaasClient.getContainerResultUrl());
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
                        }

                        $uibModal.open({
                            animation: true,
                            templateUrl: 'partials/wf-s/container-run-dialog.html',
                            controller: function($scope) {
                                this.run = function()
                                {
                                    confirmStartFn(this.inputs);
                                }
                                this.cancel = function()
                                {
                                    $state.go('wf-s.standard-envs-overview', {showObjects: false, showContainers: true}, {reload: false});
                                };
                                this.inputs = [];
                            },
                            controllerAs: "runContainerDlgCtrl"
                        });


                    }],
                    controllerAs: "startContainerCtrl"
                },
                'actions': {
                    templateUrl: 'partials/wf-s/container-actions.html',
                    controller: function ($scope, $window, $state, $http, $stateParams) {
                        var vm = this;

                        vm.abort = function () {
                            console.log("aborting container...");
                            $state.go('wf-s.standard-envs-overview', {showContainers: true, showObjects: false}, {reload: true});
                        };
                    },
                    controllerAs: "containerActionsCtrl"
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
        })
        .state('wf-s.edit-handle', {
        url: "/edit-handle?handle",
        resolve: {
            handleValue: function ($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleValue + helperFunctions.formatStr("?handle={0}" , encodeURI($stateParams.handle)));
            }
        },
        views: {
            'wizard': {
                templateUrl: 'partials/wf-s/edit-handle.html',
                controller: ['$state', '$scope', '$stateParams', '$http', 'handleValue', 'localConfig', 'helperFunctions' , function($state, $scope, $stateParams, $http, handleValue, localConfig, helperFunctions) {
                    $("#newHandleValue").hide();
                    $("#editHandleValue").hide();
                    var vm = this;
                    vm.handleValue = handleValue.data.handleValue;
                    vm.handle = $stateParams.handle;

                    vm.deleteHandle = function () {
                        $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/deleteHandle?handle={0}", encodeURI($stateParams.handle)))
                        $state.go('wf-s.handles', {reload: true});
                    };

                    vm.showHandleValue = function () {
                        $("#newHandleValue").show();
                        $("#editHandleValue").show();
                        $("#showHandleValue").hide();
                    };

                    vm.editHandle = function () {
                        $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/modifyHandle", encodeURI($stateParams.handle)), {
                            handle: $stateParams.handle,
                            handleValue: document.getElementById("newHandleValue").value
                        });

                        vm.handleValue = $stateParams.handle;

                        $state.go('wf-s.edit-handle', $stateParams, {reload: true});
                    };
                }],
                controllerAs: "handleOverview"
            }

        }
    });

    growlProvider.globalTimeToLive(5000);
}]);
