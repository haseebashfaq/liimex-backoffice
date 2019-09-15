// Angular Module
angular.module('application').controller('PolicyController', PolicyController);

// Injections
PolicyController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function PolicyController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    $scope.AddBlankCriteria = function(){
      $scope.criteria = [];
      metaService.addPolicyCriteria(function(){
        $rootScope.genService.showDefaultSuccessMsg('Policy Criteria - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Criteria */
    $scope.GetAllPoliciCriteria = function(){
      $rootScope.local_load = true;
      console.log('Getting Policy Criteria..');
      $scope.criterias = [];

      metaService.getPolicyCriteria(function(criterias){
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
    $scope.GetAllPoliciCriteria();
    $scope.GetInsuranceTypes();

}
