// Angular Module
angular.module('application').controller('MetaController', MetaController);

// Injections
MetaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller'];

// Function
function MetaController($rootScope, $scope, $stateParams, $state, $controller) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


}
