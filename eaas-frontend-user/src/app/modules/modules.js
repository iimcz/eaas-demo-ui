import angular from 'angular';

const emilUIModule = angular.module('emilUI.modules', []);

// objects
emilUIModule.controller('ObjectsOverviewController', require('./objects/overview.ctrl.js'));

// base
emilUIModule.controller('BaseController', require('./base/base.ctrl.js'));

// emulator
emilUIModule.controller('ChooseEnvController', require('./emulator/choose-env.ctrl'));
emilUIModule.controller('ActionsController', require('./emulator/actions.ctrl.js'));
emilUIModule.controller('StartEmulatorController', require('./emulator/start.ctrl.js'));
emilUIModule.controller('MetadataController', require('./emulator/metadata.ctrl.js'));
emilUIModule.controller('ErrorController', require('./emulator/error.ctrl.js'));