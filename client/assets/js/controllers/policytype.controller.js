// Angular Module
angular.module('application').controller('PolicyTypeController', PolicyTypeController);

// Injections
PolicyTypeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function PolicyTypeController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.criteria = null;

    /* Get Single Policy Criteria */
    $scope.GetSinglePolicyCriteria = function(){
      $rootScope.local_load = true;
      metaService.getSinglePolicyCriteria($stateParams.criteria, function(criteria){
        $scope.criteria = criteria;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Save Criteria */
    $scope.SaveCriteria = function(){
      $rootScope.local_load = true;
      // for(var key in $scope.policytype.fields){
      //   var field = $scope.policytype.fields[key];
      //   console.log(field);
      //   field.variable_name = $rootScope.genService.generateVariableName(field.title);
      // }

      metaService.savePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        backofficeService.logpost({msg:'criteria saved',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Add Custom Field */
    $scope.AddCustomField = function(){
      console.log('Adding custom field..');
      $rootScope.local_load = true;
      metaService.addCustomField($stateParams.criteria, function(){
        backofficeService.logpost({msg:'custom field added',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Disable Custom Field */
    $scope.DisableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.disableCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field disabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Enable Custom Field */
    $scope.EnableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.enableCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field enabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Disable Criteria */
    $scope.DisableCriteria = function(){
      metaService.deletePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        backofficeService.logpost({msg:'criteria disabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Enable Criteria */
    $scope.EnableCriteria = function(){
      metaService.enablePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        backofficeService.logpost({msg:'criteria enabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
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
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetSinglePolicyCriteria();
    $scope.GetInsuranceTypes();
}
