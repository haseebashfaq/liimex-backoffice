// Angular Module
angular.module('application').controller('ActivityQuestionController', ActivityQuestionController);

// Injections
ActivityQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function ActivityQuestionController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


  /* Scope Variables*/
  $scope.activity_score = 0;

  /* local Variables*/
  var recommendationMappings = [];
  var previousInsuraceType;
  var activityquestion = $stateParams.activityquestion;


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

  /* Get Activity */
  $scope.GetActivity = function(forms){
    $rootScope.local_load = true;
    metaService.getSingleActivity($stateParams.activityquestion, activity => {
      $scope.activity = activity;
      previousInsuraceType = activity.insurance_type;
      $scope.activity.exclude_codes = $scope.activity.exclude_codes || [];
      $scope.exclude_code_set = new Set(activity.exclude_codes)
      if(activity.exclude_codes){
        $scope.exclude_codes = activity.exclude_codes.join();
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})

    });
  }

  /* Get Insurance Types */
  $scope.GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Remove Exclude Code*/
  $scope.RemoveExcludeCode = function(key){
    $scope.unsaved_changes = true;
    $scope.exclude_code_set.delete($scope.activity.exclude_codes[key])
    $scope.activity.exclude_codes.splice(key, 1);
    $scope.safeApply(fn => fn);
  }

  /* Push Exclude Code */
  $scope.PushExcludeCode = function(code){
    if(!code || $scope.exclude_code_set.has(code)){ return }
    $scope.unsaved_changes = true;
    $scope.activity.exclude_codes.push(code);
    $scope.exclude_code_set.add(code)
    code_to_push = null;
    code = null;
    $scope.safeApply(fn => fn);
  }

  /* Get Groups */
  $scope.GetGroups = function(){
    $rootScope.local_load = true;
    $scope.groups = {};
    metaService.getGroups(function(groups){
      for(var key in groups){
        $scope.groups[groups[key].group] = groups[key];
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Save Activity */
  $scope.SaveActivity = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    metaService.saveActivity($stateParams.activityquestion, $scope.activity, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      backofficeService.logpost({msg:'activity saved',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /* Enable Activity */
  $scope.EnableActivity = function(){
    $rootScope.local_load = true;
    metaService.enableActivity($stateParams.activityquestion,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      backofficeService.logpost({msg:'activity enabled',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /*Disable Activity*/
  $scope.DisableActivity = function(){
    $rootScope.local_load = true;
    metaService.disableActivity($stateParams.activityquestion,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      backofficeService.logpost({msg:'activity disabled',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = {};
      for(var key in codes){
        $scope.codes_dict[codes[key].code] = codes[key];
        $scope.codes.push({key:key, code:codes[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* trigger when the insurance type changed */
  $scope.insuraceTypeChange = function(){
    console.log("insurance type changed",$scope.activity.insurance_type);
    /* delete the activity id from the other insurance id */
  }

  /* gets the insurance recommendation_mapping table*/
  function getRecommendationMapping(callback, err_call){
    $rootScope.local_load = true;
    metaService.getAllRecommendationMapping(_recommendationMapping =>{
      for(var index in _recommendationMapping.insurance_types){
        recommendationMappings.push({insurance_type: index,
          activity_weights : _recommendationMapping.insurance_types[index].activity_weights});
        }
        if(callback) callback();
      }, error => {
        console.error("error while fetching recommendation", error);
        if(err_call) err_call();
      });
    }
    /* Check if all recommendations objs are fetched and set the activity score on the ui once fetched */
    function getRecommendationMappingAndSetActvityScore(){
      if(!recommendationMappings || recommendationMappings.length == 0){
        getRecommendationMapping(()=>{
          setActivityScore();
        });
      }
      else{
        setActivityScore();
      }
    }

    /* Set activity score on the UI */
    function setActivityScore(){
      let currentInsuraceType = $scope.activity.insurance_type;
      let recommendationMapping = recommendationMappings.find(recommendationMapping=>recommendationMapping.insurance_type == currentInsuraceType);
      if(!recommendationMapping){
        return;
      }
      if(recommendationMapping.activity_weights && recommendationMapping.activity_weights[activityquestion])
        $scope.activity_score = parseInt(recommendationMapping.activity_weights[activityquestion].score,10);
      $scope.safeApply(fn => fn);
    }

    /* Save the activity score */
    function saveRecommendationScore(){
      let currentInsuraceType = $scope.activity.insurance_type;
      let data = {score: $scope.activity_score};
      /*delete the activity and it's score from the previous insurancetype before saving the activity
      to a new insurace type */
      if(previousInsuraceType &&
      currentInsuraceType &&
      previousInsuraceType != currentInsuraceType){
        metaService.deleteActivityRecommendationScore(previousInsuraceType, activityquestion, null, ()=>{
          console.log("successfully deleted the activity for previous insurance type")
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
        });
      }
      metaService.saveActivityRecommendationScore( currentInsuraceType,activityquestion, data, () =>{
        console.log("successfully saved activity weight")
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Recommendation Mapping For Insurance Type */
    const getRecommendationWeightForInsuraceType = insuraceType =>
    recommendationMappings.find(recommendationMapping =>
    recommendationMapping.insurance_type == insuraceType);


    /* Call these functions on controller load */
    $scope.GetActivity();
    $scope.GetInsuranceTypes();
    $scope.GetGroups();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetActvityScore();
  }
