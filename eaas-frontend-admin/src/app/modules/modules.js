import angular from 'angular';

const emilUIModule = angular.module('emilAdminUI.modules', []);

emilUIModule.controller('SettingsDialogController', require('./admin/settingsdialog/settings-dialog.ctrl'));