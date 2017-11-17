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

var $ = require('jquery');
window.$ = window.jQuery = $; // publish jQuery into window scope for emulator libs

const appendScript = function(scriptText) {
    let script   = document.createElement("script");
    script.type  = "text/javascript";
    script.text  = scriptText;
    document.body.appendChild(script);
};

import guacamolejs from 'raw-loader!../../vendor/eaas-client/guacamole/guacamole.js';
appendScript(guacamolejs);

import eaasclientjs from 'raw-loader!../../vendor/eaas-client/eaas-client.js';
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
import '../../vendor/eaas-client/guacamole/guacamole.css';
import '../../vendor/eaas-client/eaas-client.css';
import './app.css';

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

export default angular.module('emilUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap', 'ui.select', 'angular-growl', 
               'dibari.angular-ellipsis', 'ui.bootstrap.contextMenu', 'pascalprecht.translate', 'smart-table', 'emilUI.modules', 'emilUI.helpers'])

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
            template: require('./modules/client/clienterror/client-error.html'),
            params: {
                errorMsg: {title: "", message: ""}
            },
            controller: 'ClientErrorController as errorCtrl'
        })
        .state('object-overview', {
            url: "/object-overview",
            template: require('./modules/client/objectoverview/object-overview.html'),
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                objectList: ($http, localConfig) => $http.get(localConfig.data.eaasBackendURL + getObjectListURL)
            },
            controller: "ObjectOverviewController as objectOverviewCtrl"
        })
        .state('wf-b', {
            abstract: true,
            url: "/wf-b?objectId",
            template: require('./modules/client/wfb/base/base.html'),
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                objEnvironments: ($stateParams, $http, localConfig) => $http.get(localConfig.data.eaasBackendURL + formatStr(loadEnvsUrl, $stateParams.objectId)),
                objMetadata: ($stateParams, $http, localConfig) => $http.get(localConfig.data.eaasBackendURL + formatStr(metadataUrl, $stateParams.objectId)),
                allEnvironments: ($stateParams, $http, localConfig) => $http.get(localConfig.data.eaasBackendURL + getAllEnvsUrl),
                userSession: ($stateParams, $http, localConfig) => $http.get(localConfig.data.eaasBackendURL + formatStr(getUserSessionUrl, "testuser01", $stateParams.objectId))
            },
            controller: "BaseController as baseCtrl"
        })
        .state('wf-b.choose-env', {
            url: "/choose-environment",
            views: {
                'wizard': {
                    template: require('./modules/client/wfb/chooseenv/choose-env.html'),
                    controller: "ChooseEnvController as chooseEnvCtrl"
                },
                'metadata': {
                    template: require('./modules/client/wfb/clientmetadata/client-metadata.html'),
                    controller: 'ClientMetadataController as metadataCtrl'
                }
            }
        })
        .state('wf-b.emulator', {
            url: "/emulator?envId",
            resolve: {
                chosenEnv: ($http, $stateParams, localConfig) => $http.get(localConfig.data.eaasBackendURL + formatStr(getEmilEnvironmentUrl, $stateParams.envId)),
                mediaCollection: ($http, $stateParams, localConfig) => $http.get(localConfig.data.eaasBackendURL + formatStr(mediaCollectionURL, $stateParams.objectId))
            },
            views: {
                'wizard': {
                    template: require('./modules/client/wfb/clientemulator/client-emulator.html'),
                    controller: 'ClientEmulatorController as startEmuCtrl'
                },
                'actions': {
                    template: require('./modules/client/wfb/clientactions/client-actions.html'),
                    controller: 'ClientActionsController as actionsCtrl'
                },
                'metadata': {
                    template: require('./modules/client/wfb/clientmetadata/client-metadata.html'),
                    controller: 'ClientMetadataController as metadataCtrl'
                }
            }
        });

    growlProvider.globalTimeToLive(5000);
});
