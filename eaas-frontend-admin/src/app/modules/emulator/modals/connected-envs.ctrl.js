module.exports = ["$scope", "$uibModalInstance", "$uibModalStack", "sessionIds",
     function ($scope, $uibModalInstance, $uibModalStack, sessionIds) {
         $scope.availableGroupIds = sessionIds.data;
         $scope.selected = {};

         if(!$scope.availableGroupIds || !$scope.availableGroupIds.length)
         {
            $uibModalInstance.close({});
            $uibModalStack.dismissAll();
         }

         $scope.connect = function () {
             $scope.isModuleVisible = false;
              var data = {
                  session: $scope.selected.session
               }
               console.log(data);
            
               $uibModalInstance.close(data);
               $uibModalStack.dismissAll();
         };

         $scope.run = function () {
            $uibModalInstance.close({});
            $uibModalStack.dismissAll();
         };
 }];