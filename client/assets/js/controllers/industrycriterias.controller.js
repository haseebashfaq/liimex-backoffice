// Angular Module
angular.module('application').controller('IndustryCriteriasController', IndustryCriteriasController);

// Injections
IndustryCriteriasController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function IndustryCriteriasController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Quit if child state
    if($state.current.name !== 'industrycriterias')
      return;

    $scope.AddBlankCriteria = function(){
      $scope.criteria = [];
      metaService.addIndustryCriteria(function(){
        $rootScope.genService.showDefaultSuccessMsg('Industry Criteria - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Industry Criteria */
    $scope.GetAllIndustryCriteria = function(){
      $rootScope.local_load = true;
      console.log('Getting Industry Criteria..');
      $scope.criterias = [];
      metaService.getIndustryCriteria(function(criterias){
        for(var key in criterias){
          $scope.criterias.push({key:key, criteria:criterias[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllIndustryCriteria();
    $scope.GetInsuranceTypes();

}
