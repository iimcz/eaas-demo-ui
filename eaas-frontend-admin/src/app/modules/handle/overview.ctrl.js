module.exports = ["$state", "$stateParams", "$http", "handles", "localConfig", "helperFunctions","growl",
    function ($state, $stateParams, $http, handles, localConfig, helperFunctions, growl) {

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

            let checkValue= function(regEx, value, message){
                if (!regEx.test(value)) {
                    console.log("!!!!!!!!!! " + message);
                    growl.error(message + " : " + value, {title: 'Error '});
                    return false;
                } else return true;
            };

            const regexURL = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
            const regexName = /^[0-9A-Za-z\s\-]+$/;
            if (!checkValue(regexName, document.getElementById("addHandle").value,  "Not valid Handle Name"))
                return;
            if (!checkValue(regexURL, document.getElementById("addHandleValue").value, "Not a valid URL"))
                return;


            jQuery.when(
                $http.post(localConfig.data.eaasBackendURL + helperFunctions.formatStr("components/createHandle", encodeURI($stateParams.handle)), {
                    handle: "11270/" + document.getElementById("addHandle").value,
                    handleValue: document.getElementById("addHandleValue").value
                })
            ).then(function (response) {
                console.log("response  ", response);
                console.log("response.status   ", response.status);
                if (response.status === 200) {
                    $state.reload();
                } else {
                    growl.error('Handle is not defined!!');
                }

            });

        };

    }];