module.exports = ['$state', '$stateParams', 'objectList', function($state, $stateParams, objectList) {
     var vm = this;
     vm.objectList = objectList.data.objects;
 }];