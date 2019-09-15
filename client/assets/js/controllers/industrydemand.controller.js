// Angular Module
angular.module('application').controller('IndustryDemandController', IndustryDemandController);

// Injections
IndustryDemandController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function IndustryDemandController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Get Insurance Type */
    $scope.GetInsuranceType = function(){
      $rootScope.local_load = true;
      metaService.getSingleInsuranceType($stateParams.insurance_type, function(insurance_type){
        $rootScope.local_load = null;
        $scope.insurance_type = insurance_type;
        if(insurance_type.except){
          $scope.except = insurance_type.except.join();
        }
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_demand','error',()=>{},()=>{})
      });
    }

    /* Save Insurance Type */
    $scope.SaveInsuranceType = function(){
      $rootScope.local_load = true;
      $scope.except ? (
        $scope.insurance_type.except = $scope.except.split(',')
      ) : (
        $scope.insurance_type.except = null
      )
      metaService.saveInsuranceType($stateParams.insurance_type, $scope.insurance_type, function(){
        backofficeService.logpost({msg:'insurance_type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'industrydemand','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_demand','error',()=>{},()=>{})
      });
    }

  	/* Call these functions on controller load */
    $scope.GetInsuranceType();
}
