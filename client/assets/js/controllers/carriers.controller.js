// Angular Module
angular.module('application').controller('CarriersController', CarriersController);

// Injections
CarriersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function CarriersController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.carriers = [];

    $scope.AddBlankCarrier = function(){
      metaService.addCarrier(function(){
        $rootScope.genService.showDefaultSuccessMsg('Carrier Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Types */
    $scope.GetAllCarriers = function(){
      $rootScope.local_load = true;
      console.log('Getting Carrier(s)..');
      $scope.carriers = [];

      metaService.getCarriers(function(carriers){
        for(var key in carriers){
          $scope.carriers.push({key:key, carrier:carriers[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }


    /* On Controller Load */
    $scope.GetAllCarriers();

}
