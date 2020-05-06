module.exports = ['$state', function ( $state ) {
    var vm = this;

    vm.abort = function () {
        console.log("aborting container...");
        $state.go('admin.standard-envs-overview', {showContainers: true, showObjects: false}, {reload: true});
    };
}];