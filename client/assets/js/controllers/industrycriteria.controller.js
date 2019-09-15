// Angular Module
angular.module('application').controller('IndustryCriteriaController', IndustryCriteriaController);

// Injections
IndustryCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function IndustryCriteriaController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.criteria = null;

    /* Get Single Policy Criteria */
    $scope.GetSingleIndustryCriteria = function(){
      $rootScope.local_load = true;
      metaService.getSingleIndustryCriteria($stateParams.criteria, function(criteria){
        $scope.criteria = criteria;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = [];
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Save Criteria */
    $scope.SaveCriteria = function(){
      $rootScope.local_load = true;
      metaService.saveIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        backofficeService.logpost({msg:'criteria saved',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $scope.codes = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Add Custom Field */
    $scope.AddCustomField = function(){
      console.log('Adding custom field..');
      $rootScope.local_load = true;
      metaService.addInudstryCustomField($stateParams.criteria, function(){
        backofficeService.logpost({msg:'custom field added',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Disable Custom Field */
    $scope.DisableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.disableIndustryCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'Custom field disabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Enable Custom Field */
    $scope.EnableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.enableIndustryCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field enabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Disable Criteria */
    $scope.DisableCriteria = function(){
      metaService.disableIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'criteria disabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Enable Criteria */
    $scope.EnableCriteria = function(){
      metaService.enableIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'criteria enabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Get All Codes */
    $scope.GetAllCodes = function(){
      $rootScope.local_load = true;
      $scope.codes = [];
      metaService.getIndustryCodes(function(codes){
        for(var key in codes){
          console.log('Push');
          $scope.codes.push({key:key, code:codes[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetSingleIndustryCriteria();
    $scope.GetInsuranceTypes();

}
