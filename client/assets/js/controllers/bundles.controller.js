// Angular Module
angular.module('application').controller('BundlesController', BundlesController);

// Injections
BundlesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function BundlesController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Add Blank Bundle */
    $scope.AddBlankBundle = function(){
      metaService.addInsuranceProduct(function(){
        $rootScope.genService.showDefaultSuccessMsg('Product Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Bundles */
    $scope.GetAllBundles = function(){
      $rootScope.local_load = true;
      $scope.products = [];
      metaService.getInsuranceProducts(function(products){
        for(var key in products){
          $scope.products.push({key:key, product:products[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllBundles();

}
