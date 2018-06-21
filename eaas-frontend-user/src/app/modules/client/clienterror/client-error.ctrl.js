module.exports = function($state, $stateParams) {
    if ($stateParams.errorMsg.title === "" && $stateParams.errorMsg.title === "") {
        $state.go('object-overview');
        return;
    }

    this.errorMsg = $stateParams.errorMsg;
};