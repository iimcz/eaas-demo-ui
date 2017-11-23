import ng from 'angular';

const emilAdminUIHelpersModule = ng.module('emilAdminUI.helpers', []);

emilAdminUIHelpersModule.service('REST_URLS', function () {
// object data api
    this.objectEnvironmentsUrl = "EmilObjectData/environments?objectId={0}&updateClassification={1}&updateProposal={2}";
    this.getObjectListURL = "EmilObjectData/list";
    this.getSoftwareListURL = "EmilObjectData/list?archiveId={0}";
    this.syncObjectsUrl = "EmilObjectData/sync";
    this.mediaCollectionURL = "EmilObjectData/mediaDescription?objectId={0}";
    this.metadataUrl = "EmilObjectData/metadata?objectId={0}";

// environment data api
    this.getAllEnvsUrl = "EmilEnvironmentData/list?type={0}";
    this.updateDescriptionUrl = "EmilEnvironmentData/updateDescription";
    this.deleteEnvironmentUrl = "EmilEnvironmentData/delete";
    this.initEmilEnvironmentsURL = "EmilEnvironmentData/init";
    this.getEnvironmentTemplates = "EmilEnvironmentData/getEnvironmentTemplates";
    this.createImageUrl = "EmilEnvironmentData/createImage?size={0}";
    this.prepareEnvironmentUrl = "EmilEnvironmentData/prepareEnvironment";
    this.importImageUrl = "EmilEnvironmentData/importImage";
    this.createEnvironmentUrl = "EmilEnvironmentData/createEnvironment";
    this.commitUrl = "EmilEnvironmentData/commit";
    this.forkRevisionUrl = "EmilEnvironmentData/forkRevision";
    this.revertRevisionUrl = "EmilEnvironmentData/revertRevision";
    this.syncImagesUrl = "EmilEnvironmentData/sync";
    this.exportEnvironmentUrl = "EmilEnvironmentData/export?envId={0}";
    this.setDefaultEnvironmentUrl = "EmilEnvironmentData/setDefaultEnvironment?osId={0}&envId={1}";

    this.userSessionListUrl = "EmilUserSession/list";
    this.deleteSessionUrl = "EmilUserSession/delete?sessionId={0}";

    this.overrideObjectCharacterizationUrl = "Emil/overrideObjectCharacterization";
    this.buildVersionUrl = "Emil/buildInfo";

// Software archive api
    this.getSoftwarePackageDescriptions = "EmilSoftwareData/getSoftwarePackageDescriptions";
    this.saveSoftwareUrl = "EmilSoftwareData/saveSoftwareObject";
    this.getSoftwareObjectURL = "EmilSoftwareData/getSoftwareObject?softwareId={0}";
});

emilAdminUIHelpersModule.service('helperFunctions', function () {
    this.formatStr = function(format) {
        const args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
});