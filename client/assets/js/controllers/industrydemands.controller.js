// Angular Module
angular.module('application').controller('IndustryDemandsController', IndustryDemandsController);

// Injections
IndustryDemandsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function IndustryDemandsController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Get All Policy Types */
    $scope.GetAllInsuranceTypes = function(){
      $rootScope.local_load = true;
      console.log('Getting Insurance Type(s)..');
      $scope.insurance_types = [];
      metaService.getInsuranceTypes(function(insurance_types){
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

  	/* Call these functions on controller load */
    $scope.GetAllInsuranceTypes();
}
