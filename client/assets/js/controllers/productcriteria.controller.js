// Angular Module
angular.module('application').controller('ProductCriteriaController', ProductCriteriaController);

// Injections
ProductCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService', 'extractionService'];

// Function
function ProductCriteriaController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService, extractionService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables */
  $scope.product_uid = $stateParams.product_uid;
  $scope.comparison_uid = $stateParams.comparison_uid;
  $scope.insurance_uid = $stateParams.insurance_uid;
  
  /* Constants */
  const included_options = {
    [true]: 'Included',
    [false]: 'Not Included'
  };
  
  const general_keys = {
    body: 'Bodily Injury',
    property: 'Property Damage',
    financial: 'Financial Loss'
  };
  
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
  
  /* Get Product */
  $scope.GetSingleProduct = function(){
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid, function(product){
      $scope.product = product;
      if(!$scope.product.comparisons[$stateParams.comparison_uid]){
        $rootScope.genService.showDefaultErrorMsg('Could not load');
        $rootScope.local_load = null;
        return
      }
      $scope.comparison = $scope.product.comparisons[$stateParams.comparison_uid];
      $scope.UpdateAnnualPremium();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Update Annual Premium */
  $scope.UpdateAnnualPremium = function(){
    if(!$scope.comparison.basic){
      $scope.annual_gross_premium = 0;
      $scope.safeApply(fn => fn);
      return;
    }
    $scope.annual_gross_premium = $scope.comparison.basic.premium*(($scope.comparison.basic.insurance_tax*0.01)+1) || 0;
    $scope.safeApply(fn => fn);
  }
  
  /* Mark Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
    $scope.safeApply(fn => fn);
  }
  
  /*  */
  $scope.SaveComparison = function(){
    $rootScope.local_load = true;
    offerService.saveComparison($stateParams.offer_uid, $stateParams.comparison_uid, $scope.comparison, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved')
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Save Product */
  $scope.SaveProduct = function(){
    $rootScope.local_load = true;
    metaService.saveProduct($stateParams.product_uid, $scope.product, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
      $rootScope.local_load = null;
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Get Carriers */
  $scope.GetCarriers = function(){
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer criteria','error',()=>{},()=>{})
      console.error(error);
    });
  }
  
  /* Get Product Options */
  $scope.GetProductOptions = function(){
    $scope.options = { included_options, general_keys };
  }
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(specific_or_general, comparison_criteria){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.product.insurance_type
    
    // Null Checking
    $scope.comparison.insurance_types[insurance_uid] = $scope.comparison.insurance_types[insurance_uid] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general] = $scope.comparison.insurance_types[insurance_uid][specific_or_general] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] = $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] || {}
    
    if(!$scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent){
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = true
    } else {
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }
  
  /* On Controller Load */
  $scope.GetSingleProduct();
  $scope.GetCarriers();
  $scope.GetProductOptions();
  
}
