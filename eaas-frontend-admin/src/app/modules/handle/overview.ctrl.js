module.exports = ["$state", "$stateParams", "$http",  "handles", "localConfig", "helperFunctions",
            function($state, $stateParams, $http,  handles, localConfig, helperFunctions) {
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
        jQuery.when(
        $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/createHandle", encodeURI($stateParams.handle)), {
            handle: document.getElementById("addHandle").value,
            handleValue: document.getElementById("addHandleValue").value
        })
    ).done(function () {
            $state.reload()
        });
    };

}];