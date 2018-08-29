module.exports = ["$http", "$scope", "$state", "$stateParams", "environmentList", "objectEnvironmentList", "localConfig", "growl", "$translate", "objectDependencies", "helperFunctions", "REST_URLS",
            function ($http, $scope, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, objectDependencies, helperFunctions, REST_URLS) {
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

           if(!this.env)
           {
               growl.error("Environment not found");
               $state.go('admin.standard-envs-overview', {}, {reload: true});
           }

           this.envTitle = this.env.title;
           this.author = this.env.author;
           this.envDescription = this.env.description;
           this.envHelpText = this.env.helpText;
           this.enableRelativeMouse = this.env.enableRelativeMouse;
           this.enablePrinting = this.env.enablePrinting;
           this.nativeConfig = this.env.nativeConfig;
           this.enableInternet = this.env.enableInternet;
           this.serverMode = this.env.serverMode;
           this.enableSocks = this.env.enableSocks;
           this.serverIp = this.env.serverIp;
           this.serverPort = this.env.serverPort;
           this.gwPrivateIp = this.env.gwPrivateIp;
           this.gwPrivateMask = this.env.gwPrivateMask;
           this.useXpra = this.env.useXpra;
           this.connectEnvs = this.env.connectEnvs;

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
                   author: this.author,
                   description: this.envDescription,
                   helpText: this.envHelpText,
                   time: timecontext,
                   enablePrinting: vm.enablePrinting,
                   enableRelativeMouse: this.enableRelativeMouse,
                   shutdownByOs: this.shutdownByOs,
                   os: this.os,
                   userTag: this.userTag,
                   useXpra : this.useXpra,
                   enableInternet: this.enableInternet,
                   serverMode: this.serverMode,
                   enableSocks: this.enableSocks,
                   serverIp : this.serverIp,
                   serverPort : this.serverPort,
                   gwPrivateIp: this.gwPrivateIp,
                   gwPrivateMask: this.gwPrivateMask,
                   nativeConfig: this.nativeConfig,
                   connectEnvs : this.connectEnvs
           }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }

                   if (vm.isObjectEnv)
                       $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                   else
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
               });
           };

           this.fork = function(revId) {
               $http.post(localConfig.data.eaasBackendURL + REST_URLS.forkRevisionUrl, {
                   id: revId
               }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }
                   $state.go('admin.standard-envs-overview', {}, {reload: true});
               });
           };

           this.revert = function(currentId, revId) {
               $http.post(localConfig.data.eaasBackendURL + REST_URLS.revertRevisionUrl, {
                   currentId: currentId,
                   revId: revId
               }).then(function(response) {
                   if (response.data.status === "0") {
                       growl.success($translate.instant('JS_ENV_UPDATE'));
                       $state.go('admin.standard-envs-overview', {}, {reload: true});
                   } else {
                       growl.error(response.data.message, {title: 'Error ' + response.data.status});
                   }
                   $state.go('admin.standard-envs-overview', {}, {reload: true});
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
       }];