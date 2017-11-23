import ng from 'angular';

const emilUIHelpersModule = ng.module('emilUI.helpers', []);

emilUIHelpersModule.service('REST_URLS', function () {
    // EMIL core api
    this.changeMediaURL = "Emil/changeMedia?sessionId={0}&objectId={1}&driveId={2}&label={3}";

    // object data connector
    this.mediaCollectionURL = "EmilObjectData/mediaDescription?objectId={0}";
    this.loadEnvsUrl = "EmilObjectData/environments?objectId={0}";
    this.metadataUrl = "EmilObjectData/metadata?objectId={0}";
    this.getObjectListURL = "EmilObjectData/list";

    // environments data connector
    this.getAllEnvsUrl = "EmilEnvironmentData/getAllEnvironments";
    this.getEmilEnvironmentUrl = "EmilEnvironmentData/environment?envId={0}";
    this.getUserSessionUrl = "EmilUserSession/session?userId={0}&objectId={1}";
    this.deleteSessionUrl = "EmilUserSession/delete?sessionId={0}";
});

emilUIHelpersModule.service('helperFunctions', function () {
    this.formatStr = function(format) {
        const args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
});