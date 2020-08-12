module.exports = ['$state', '$rootScope', '$http', '$scope', '$translate', 'growl', 'environments', 'sessionId', 'localConfig', 'REST_URLS', 'helperFunctions',
    function ($state, $rootScope, $http, $scope, $translate, growl, environments, sessionId, localConfig, REST_URLS, helperFunctions) {
        this.environments = environments.filter( (env) => env.archive === 'public');

        this.connectEnvironmentToNetwork = (env) => {
            window.open(localConfig.data.landingPage + "?sessionId=" + sessionId + "&connectEnvId=" + env.envId + "#!/attach-landing-page")
        }
    }];
