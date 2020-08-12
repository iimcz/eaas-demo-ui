export function showErrorIfNull(variable, $state) {
    if (variable == null) {
        $state.go('error', {
            errorMsg: {
                title: "Error ",
                message: "ID is not found. Please follow the pattern: {SERVER_URL}?id={containerId}"
            }
        });
    }
};
