/*
 * Import third party libraries
 */

import angular from 'angular';
import 'angular-loading-bar';
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

/*
 * Import legacy emulator libraries
 */

const $ = require('jquery');
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
import '../../../common/eaas-client/guacamole/guacamole.css';
import '../../../common/eaas-client/eaas-client.css';
import './app.css';

export default angular.module('emilUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap', 'ui.select', 'angular-growl',
               'dibari.angular-ellipsis', 'ui.bootstrap.contextMenu', 'pascalprecht.translate', 'smart-table', 'emilUI.modules', 'emilUI.helpers'])


    .run(function($rootScope) {
        $rootScope.emulator = {state : ''};

        $rootScope.idleTimer = {};
        $rootScope.idleTimer.idleTime = 0;

        $rootScope.initIdleTimer = function(idleTimeout)
        {
            if(idleTimeout <= 0)
                return;

            $rootScope.idleTimer.idleTime = 0;
            $rootScope.idleTimer.idleTimeout = idleTimeout;
            clearInterval($rootScope.idleTimer.idleInterval);
            $rootScope.idleTimer.idleInterval = setInterval($rootScope.idleTimer.timerIncrement, 60000); // 1 minute
            console.log("TIMER started");
        }

        $rootScope.disableIdleTimer = function()
        {
            clearInterval($rootScope.idleTimer.idleInterval);
            console.log("TIMER stopped");
        }

        $(document).ready(function () {
            //Zero the idle timer on mouse movement.
            $(this).mousemove(function (e) {
                $rootScope.idleTimer.idleTime = 0;
            });

            $(this).keypress(function (e) {
                $rootScope.idleTimer.idleTime = 0;
            });
        });

        $rootScope.idleTimer.timerIncrement = function() {
            $rootScope.idleTimer.idleTime = $rootScope.idleTimer.idleTime + 1;

            if ($rootScope.idleTimer.idleTime > $rootScope.idleTimer.idleTimeout - 1) {
                if($rootScope.idleTimeoutWarnFn)
                    $rootScope.idleTimeoutWarnFn();
            }

            if ($rootScope.idleTimer.idleTime > $rootScope.idleTimer.idleTimeout) {
                if($rootScope.idleTimeoutFn)
                    $rootScope.idleTimeoutFn();
                $rootScope.disableIdleTimer();
            }
        };
    })


    .filter('trustAsHtml', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
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
                  if(rejection.status === 500 || rejection.status === -1) {
                    var $state = $injector.get('$state'); // manually inject $state service using $injector
                    var defer = $q.defer();
                    if(rejection.status == 500 || rejection.status === -1){
                        $state.go('error', {}, {reload: true, inherit: false});
                    }
                    defer.reject(rejection);
                    return defer.promise;
                  }
                  return $q.reject(rejection);


//                if (httpResponseErrorModal === null) {
//                    httpResponseErrorModal = $injector.get('$uibModal').open({
//                        animation: true,
//                        backdrop: 'static',
//                        templateUrl: 'partials/server-error-dialog.html'
//                    });
//                }

//                return $timeout(function() {
//                    var $http = $injector.get('$http');
//
//                    var req = $http(rejection.config);
//                    req.then(function() {
//                        if (httpResponseErrorModal !== null) {
//                            httpResponseErrorModal.close();
//                            httpResponseErrorModal = null;
//                        }
//                    });
//                    return req;
//                }, 5000);
            }
        };
    });

    // For any unmatched url
    $urlRouterProvider.otherwise("/object-overview");

    // Now set up the states
    $stateProvider
        .state('emulation-redirect', {
            url: "/emulationSession?objectId&environmentId&userId",
            controller : function($state, $stateParams)
            {
                $state.go('access.emulator', {envId: $stateParams.environmentId, objectId: $stateParams.objectId, userId: $stateParams.userId});
            },
            controllerAs: ""
        })
        .state('error', {
            url: "/error",
            template: require('./modules/emulator/error.html'),
            params: {
                errorMsg: {title: "", message: ""}
            },
            controller: 'ErrorController as errorCtrl'
        })
        .state('object-overview', {
            url: "/object-overview",
            template: require('./modules/objects/overview.html'),
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                objectList: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getObjectListURL)
            },
            controller: "ObjectsOverviewController as objectOverviewCtrl"
        })
        .state('access', {
            abstract: true,
            url: "/access?objectId",
            template: require('./modules/base/base.html'),
            params: {
                userId: null
            },
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                objEnvironments: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.loadEnvsUrl, $stateParams.objectId)),
                objMetadata: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.metadataUrl, $stateParams.objectId)),
                allEnvironments: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getAllEnvsUrl),
                userSession: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getUserSessionUrl, $stateParams.userId, $stateParams.objectId)),
                kbLayouts: ($http) => $http.get("kbLayouts.json"),
            },
            controller: "BaseController as baseCtrl"
        })
        .state('access.choose-env', {
            url: "/choose-environment",
            views: {
                'wizard': {
                    template: require('./modules/emulator/choose-env.html'),
                    controller: "ChooseEnvController as chooseEnvCtrl"
                },
                'metadata': {
                    template: require('./modules/emulator/metadata.html'),
                    controller: 'MetadataController as metadataCtrl'
                }
            }
        })
        .state('access.emulator', {
            url: "/emulator",
            resolve: {
                chosenEnv: ($http, $stateParams, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getEmilEnvironmentUrl, $stateParams.envId)),
                mediaCollection: ($http, $stateParams, localConfig, helperFunctions, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.mediaCollectionURL, $stateParams.objectId)),
                environmentMetaData: function($http, $stateParams, localConfig, helperFunctions, REST_URLS) {
                    if($stateParams.envId == null)
                        return { data : { status : "1"}};

                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.environmentMetaDataUrl, $stateParams.envId));
                }
            },
            params: {
                envId: null,
                isUserSession: false
            },
            views: {
                'wizard': {
                    template: require('./modules/emulator/emulator.html'),
                    controller: 'StartEmulatorController as startEmuCtrl'
                },
                'actions': {
                    template: require('./modules/emulator/actions.html'),
                    controller: 'ActionsController as actionsCtrl'
                },
                'metadata': {
                    template: require('./modules/emulator/metadata.html'),
                    controller: 'MetadataController as metadataCtrl'
                }
            }
        });

    growlProvider.globalTimeToLive(5000);
});
