// Angular Module
angular.module('application').controller('UsertempController', UsertempController);

// Injections
UsertempController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'FileUploader', 'backofficeService'];

// Function
function UsertempController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* scope variables */
  $scope.industry_weights = {};
  /* local variables */
  let recommendationMapping;

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


  /* Get Insurance Type */
  $scope.GetInsuranceType = function(){
    $rootScope.local_load = true;
    console.log('Getting Insurance Type..');
    metaService.getSingleInsuranceType($stateParams.insurancetype, function(insurance_type){
      $rootScope.local_load = null;
      $scope.insurance_type = insurance_type;
      $scope.$apply();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Save Insurance Type */
  $scope.SaveInsuranceType = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    metaService.saveInsuranceType($stateParams.insurancetype, $scope.insurance_type, function(){
      backofficeService.logpost({msg:'insurance type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  // Disable
  $scope.DisableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.disableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      backofficeService.logpost({msg:'insurance type disabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.industry_weights[key];
    $scope.safeApply(fn => fn);
  }

  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(score, key){
    if(score === null || !key) {
      return;
    }
    $scope.industry_weights[key] = {score:score}
    $scope.safeApply(fn => fn);
  }

  // Enable
  $scope.EnableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.enableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      backofficeService.logpost({msg:'insurance type enabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = codes;
      for(var key in codes){
        $scope.codes.push({key:key, code:codes[key]});;
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* check if all recommendations objs are fetched and set the activity score on the ui once fetched*/
  function getRecommendationMappingAndSetIndustryScores(){
    if(!recommendationMapping){
      getRecommendationMapping(()=>{
        setIndustryScore();
      });
    }
    else{
      setIndustryScore();
    }
  }

  /* gets the insurance recommendation_mapping table*/
  function getRecommendationMapping(callback, err_call){
    $rootScope.local_load = true;
    let currentInsuraceType = $stateParams.insurancetype;
    metaService.getAllRecommendationMapping(_recommendationMapping =>{
      if(_recommendationMapping.insurance_types
      && _recommendationMapping.insurance_types[currentInsuraceType]
      && _recommendationMapping.insurance_types[currentInsuraceType].industry_weights){
        recommendationMapping = _recommendationMapping.insurance_types[currentInsuraceType];
      }
      if(callback) {
        callback();
      }
    }, error => {
        console.log("error while fetching recommendation", error);
        if(err_call) err_call();
      });
    }

    /* Set activity score on the ui */
    function setIndustryScore(){
      if(!recommendationMapping){
        return
      }
      for(var index in recommendationMapping.industry_weights){
        $scope.industry_weights[index] = {score:recommendationMapping.industry_weights[index].score};
      }
      $scope.safeApply(fn => fn);
    }

    /* Save the activity score */
    function saveRecommendationScore(){
      let currentInsuraceType = $stateParams.insurancetype;
      let data = {industry_weights: $scope.industry_weights};
      metaService.saveIndustryRecommendationScore(currentInsuraceType,data,()=>{
        console.log("successfully saved Industry weight")
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetInsuranceType();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetIndustryScores();
  }
