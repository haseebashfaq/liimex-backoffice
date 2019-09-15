// Angular Module
angular.module('application').controller('ProductsController', ProductsController);

// Injections
ProductsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ProductsController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Safe Apply */
    $scope.safeApply = function(fn) {
      if(!this.$root){
        return;
      }
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    /* Add Blank Product */
    $scope.AddBlankProduct = function(){
      metaService.addInsuranceProduct(function(){
        $rootScope.genService.showDefaultSuccessMsg('Product Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Carriers */
    $scope.GetAllCarriers = function(){
      metaService.getCarriers(function(carriers){
        $scope.carriers = carriers;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        console.error(error);
      });
    }

    /* Get All Products */
    $scope.GetAllProduts = function(){
      $rootScope.local_load = true;
      metaService.getInsuranceProducts(function(products){
        $scope.products = [];
        for(var key in products){
          $scope.products.push({key:key, product:products[key]});;
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Types */
    $scope.GetAllInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Product */
    $scope.AddNewProduct = function(){
      metaService.addInsuranceProduct(result => {
        $state.go('product', {product_uid:result.key});
        $rootScope.genService.showDefaultSuccessMsg('Product Added');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllProduts();
    $scope.GetAllCarriers();
    $scope.GetAllInsuranceTypes();

}
