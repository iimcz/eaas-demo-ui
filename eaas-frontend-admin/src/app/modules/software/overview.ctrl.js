module.exports = ["softwareList", function (softwareList) {
   var vm = this;

   if (softwareList.data.status !== "0") {
       $state.go('error', {errorMsg: {title: "Load Environments Error " + softwareList.data.status, message: softwareList.data.message}});
       return;
   }

   vm.softwareList = softwareList.data.descriptions;
}];