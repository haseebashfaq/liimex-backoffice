// Angular Module
angular.module('application').controller('InsurancetypeController', InsurancetypeController);

// Injections
InsurancetypeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'iconService', 'FileUploader', 'backofficeService'];

// Function
function InsurancetypeController($rootScope, $scope, $stateParams, $state, $controller, metaService, iconService, FileUploader, backofficeService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


  $scope.requirement_weights = [
    {weight: '100', label: 'Required by law'},
    {weight: '75', label: 'Essential'},
    {weight: '50', label: 'Important'},
    {weight: '25', label: 'Nice-to-have'},
    {weight: '0', label: 'Not Important'}
  ];

  $scope.current_industry_pick = {};

  /* scope variables */
  $scope.industry_weights = {};
  $scope.industry_to_add = {};
  $scope.insurance_uid = $stateParams.insurancetype;
  $scope.num_criteria = 0;

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
      $scope.safeApply(fn => fn);
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Save Insurance Type */
  $scope.SaveInsuranceType = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    saveCriteriaMapping();
    metaService.saveInsuranceType($stateParams.insurancetype, $scope.insurance_type, function(){
      backofficeService.logpost({msg:'insurance type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Mark Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
    $scope.safeApply(fn => fn);
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
  };

  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.industry_weights[key];
    $scope.safeApply(fn => fn);
  };

  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(score, key){
    if(score === null || !key) {
      return;
    }
    $scope.industry_weights[key] = {score:score};
    $scope.safeApply(fn => fn);
  };

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
  };

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = codes;
      for(var key in codes){
        $scope.codes.push({key:key, code:codes[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

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

    $scope.isIconSelected = function(icon) {
      const type_icon_url = $scope.insurance_type ? $scope.insurance_type.icon_url : false;
      const new_icon_url = icon ? icon.download_url : false;
      return ((!new_icon_url && !type_icon_url) || (new_icon_url === type_icon_url)) ? 'active-icon' : '';
    };

    $scope.selectIcon = function(icon) {
      if (icon && icon.download_url) {
        $scope.insurance_type.icon_url = icon.download_url;
      } else {
        $scope.insurance_type.icon_url = false;
      }
    };

    $scope.UpdateIcon = function() {
      $scope.updating_icon = true;
      iconService.updateInsuranceTypeIcon($stateParams.insurancetype, $scope.insurance_type.icon_url, () => {
        $scope.updating_icon = false;
        $state.reload();
      }, error => {
        $scope.updating_icon = false;
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{});
      });
    };

  $scope.FileChanged = function(file){
    if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
      return;
    }
    $scope.files_to_upload[file.name] = file;
    $scope.uploading_icon = true;
    iconService.uploadFile(file, ()=>{},
    error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{});
    });
  };

  $scope.iconsListChanged = function(icons) {
    $scope.icons = icons;
    $scope.uploading_icon = false;
    $scope.safeApply(fn => fn);
  };

  /* Save Criteria Mapping */
    function saveCriteriaMapping(){
      if(!$scope.comparison_criteria_mapping){
        return;
      }

      for(let key in $scope.comparison_criteria_mapping.comparison_criteria){
        if($scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all === 'true'){
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = true;
        } else {
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = false;
        }
      }
      metaService.updateComparisonCriteriaMapping($stateParams.insurancetype, $scope.comparison_criteria_mapping, () => {
        console.log('Criteria Saved');
      }, error => {

      });
    }

    /* Get Comparison Criteria */
    $scope.GetAllComparisonCriteria = function(){
      $rootScope.local_load = true;
      metaService.getAllComparisonCriteria(comparison_criteria => {
        $scope.comparison_criteria = comparison_criteria;
        $scope.comparison_criteria_list = [];
        for(let key in comparison_criteria){
          $scope.comparison_criteria_list.push({key:key, criteria:comparison_criteria[key]})
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      })
    }

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMappingForInsuranceType($stateParams.insurancetype, comparison_criteria_mapping => {
        if(!comparison_criteria_mapping){
          return;
        }
        $scope.comparison_criteria_mapping = comparison_criteria_mapping;
        for(let key in $scope.comparison_criteria_mapping.comparison_criteria){
          if(!$scope.comparison_criteria_mapping.comparison_criteria[key].industry) {
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry = {}
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = false;
          }
          if(!$scope.comparison_criteria_mapping.comparison_criteria[key].industry.industry_codes){
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry.industry_codes = {}
          }
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all.toString();
        }

        if($scope.comparison_criteria_mapping){
          $scope.num_criteria = Object.keys($scope.comparison_criteria_mapping.comparison_criteria).length
        }
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Add Industry Code to Criteria Mapping */
    $scope.AddIndustryCodeToCriteriaMapping = function(criteria_key){
      $scope.comparison_criteria_mapping.comparison_criteria[criteria_key].industry.industry_codes[$scope.industry_to_add[criteria_key]] = true
      delete $scope.industry_to_add[criteria_key];
      $scope.safeApply(fn => fn);
    }

    /* Remove Industry From Criteria Mapping */
    $scope.RemoveIndustryFromCriteriaMapping = function(criteria_key, code_key){
      delete $scope.comparison_criteria_mapping.comparison_criteria[criteria_key].industry.industry_codes[code_key];
    }

    /* Remove Criteria From Critaria Mapping */
    $scope.RemoveCriteriaFromMapping = function(criteria_key){
      delete $scope.comparison_criteria_mapping.comparison_criteria[criteria_key];
      $scope.num_criteria = Object.keys($scope.comparison_criteria_mapping.comparison_criteria).length
      $scope.safeApply(fn => fn);
    }

    /* On Controller Load */
    $scope.GetInsuranceType();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetIndustryScores();
    iconService.onIconsUpdate($scope.iconsListChanged, error => {
      console.log(error);
    });

    $scope.files_to_upload = {};
    $scope.GetAllComparisonCriteria();
    $scope.GetComparisonCriteriaMapping();
  }
