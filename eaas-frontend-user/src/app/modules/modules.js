import angular from 'angular';

const emilUIModule = angular.module('emilUI.modules', []);

emilUIModule.controller('ClientErrorController', require('./client/clienterror/client-error.ctrl.js'));
emilUIModule.controller('ObjectOverviewController', require('./client/objectoverview/object-overview.ctrl.js'));

emilUIModule.controller('BaseController', require('./client/wfb/base/base.ctrl'));
emilUIModule.controller('ChooseEnvController', require('./client/wfb/chooseenv/choose-env.ctrl'));
emilUIModule.controller('ClientEmulatorController', require('./client/wfb/clientemulator/client-emulator.ctrl.js'));
emilUIModule.controller('ClientActionsController', require('./client/wfb/clientactions/client-actions.ctrl.js'));
emilUIModule.controller('ClientMetadataController', require('./client/wfb/clientmetadata/client-metadata.ctrl.js'));