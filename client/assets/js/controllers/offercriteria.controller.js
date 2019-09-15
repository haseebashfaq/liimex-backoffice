// Angular Module
angular.module('application').controller('OfferCriteriaController', OfferCriteriaController);

// Injections
OfferCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService', 'extractionService'];

// Function
function OfferCriteriaController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService, extractionService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables */
  $scope.offer_uid = $stateParams.offer_uid;
  $scope.comparison_uid = $stateParams.comparison_uid;
  $scope.insurance_uid = $stateParams.insurance_uid;
  
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
  
  /* Get Single Offer */
  $scope.GetSingleOffer = function(callback){
    $rootScope.local_load = true;
    offerService.getSingleOffer($stateParams.offer_uid, function(offer){
      $scope.offer = offer;
      if(!$scope.offer.comparisons[$stateParams.comparison_uid]){
        $rootScope.genService.showDefaultErrorMsg('Could not load');
        $rootScope.local_load = null;
        return
      }
      $scope.comparison = $scope.offer.comparisons[$stateParams.comparison_uid];
      $scope.UpdateAnnualPremium();
      $scope.GetCompany();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
    });
  };
  
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
  
  // Get Company Information
  $scope.GetCompany = function(){
    companyService.getCompanyInformation($scope.offer.company, function(company){
      $scope.company = company;
      $rootScope.local_load = null;
      $scope.GetComparisonCriteriaMapping();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Get Offer Options */
  $scope.GetOfferOptions = function(){
    $scope.options = offerService.getOfferOptions();
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
      $state.go('comparisonpreview',{offer:$stateParams.offer_uid})
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(specific_or_general, comparison_criteria){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.offer.subject
    
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
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercentGeneralCriteria = function(specific_or_general){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.offer.subject
    
    // Null Checking
    $scope.comparison.insurance_types[insurance_uid] = $scope.comparison.insurance_types[insurance_uid] || {}
    $scope.comparison.insurance_types[insurance_uid].general = $scope.comparison.insurance_types[insurance_uid].general || {}
    $scope.comparison.insurance_types[insurance_uid].general = $scope.comparison.insurance_types[insurance_uid].general || {}
    
    if(!$scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent){
      $scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent = true
    } else {
      $scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
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
  
  /* Get Comparison Criteria */
  $scope.GetComparisonCriteria = function(){
    metaService.getAllComparisonCriteria(comparison_criteria => {
      $scope.comparison_criteria = comparison_criteria;
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      $rootScope.local_load = null;
      console.error(error);
    })
  }
  
  /* Get Comparison Criteria Mapping */
  $scope.GetComparisonCriteriaMapping = function(){
    extractionService.getSpecificCriteriaForIndustryCodes($stateParams.insurance_uid, $scope.company.industry_codes, criteria => {
      if(!criteria || $state.current.name !== 'specificoffercriteria') { return }
      let comparison_criteria = {};
      criteria.specificCriterias.forEach(key => {comparison_criteria[key] = {included:true}})
      criteria.specificCriteriasWithIndustryCodes.forEach(key => {comparison_criteria[key] = {included:true}})
      $scope.comparison_criteria_mapping = { comparison_criteria : comparison_criteria }
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      $rootScope.local_load = null;
      console.error(error);
    })
  }
  
  /* On Controller Load */
  $scope.GetSingleOffer();
  $scope.GetOfferOptions();
  $scope.GetCarriers();
  
  if($state.current.name === 'specificoffercriteria'){
    //$scope.GetComparisonCriteriaMapping();
    $scope.GetComparisonCriteria();
  }
}
