// Angular Module
angular.module('application').controller('ProductController', ProductController);

// Injections
ProductController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'insuranceQuestionsService', 'FoundationApi'];

// Function
function ProductController($rootScope, $scope, $stateParams, $state, $controller, metaService, insuranceQuestionsService, FoundationApi) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables  */
  $scope.product_uid = $stateParams.product_uid;
  $scope.unsaved_changes = false;
  $scope.industry_weights = {}
  $scope.questions = {}
  $scope.subquestion_trigger = {}
  
  
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
  $scope.GetProduct = function(){
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid, function(product){
      $rootScope.local_load = null;
      product.pre_triggers = product.pre_triggers || {}
      product.pre_triggers.industry = product.pre_triggers.industry || {}
      product.pre_triggers.industry.industry_codes = product.pre_triggers.industry.industry_codes || {}
      product.pre_triggers.questions = product.pre_triggers.questions || {}
      $scope.product = product;
      if($scope.product.pre_triggers.industry.exclude_all !== null && $scope.product.pre_triggers.industry.exclude_all !== undefined){
        $scope.product.pre_triggers.industry.exclude_all = $scope.product.pre_triggers.industry.exclude_all.toString();
      }
      $scope.pretrigger_question_length = Object.keys($scope.product.pre_triggers.questions).length
      for(var key in $scope.product.pre_triggers.questions){
        GetSingleQuestion(key);
      }
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Make Exclude Bool */
  MakeExcludeBool = function(){
    if($scope.product.pre_triggers.industry.exclude_all === 'false'){
      $scope.product.pre_triggers.industry.exclude_all = false;
    }
    if($scope.product.pre_triggers.industry.exclude_all === 'true'){
      $scope.product.pre_triggers.industry.exclude_all = true;
    }
  }
  
  /* Save Product */
  $scope.SaveProduct = function(){
    $scope.product.name = $scope.product.name || ""
    MakeExcludeBool();
    $rootScope.local_load = true;
    metaService.saveProduct($stateParams.product_uid, $scope.product, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Disable */
  $scope.DisableProduct = function(){
    $rootScope.local_load = true;
    metaService.disableProduct($stateParams.product_uid, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
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
  
  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.product.pre_triggers.industry.industry_codes[key];
    $scope.safeApply(fn => fn);
  }
  
  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(key){
    if(!key) {
      return;
    }
    $scope.UnsavedChanges();
    $scope.product.pre_triggers.industry.industry_codes[key] = true
    $scope.safeApply(fn => fn);
  }
  
  /* Enable */
  $scope.EnableProduct = function(){
    $rootScope.local_load = true;
    metaService.enableProduct($stateParams.product_uid, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Get Carriers */
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      console.error(error);
    });
  }
  
  GetProductMetaInformation = function(){
    metaService.getAllProductMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.product_input_type_enum = meta.product_input_type_enum;
      $scope.meta.product_trigger_conditions = meta.product_trigger_conditions;
      $scope.meta.product_boolean_answers = meta.product_boolean_answers;
    }, error => {
      console.error(error);
    });
  }
  
  /* Get Extraction Help */
  $scope.GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    metaService.getInsuranceTypes(function(insurance_types){
      $scope.insurance_types = insurance_types;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      console.error(error);
    });
  }
  
  /* Get Single Question */
  GetSingleQuestion = function(question_uid){
    metaService.getSingleInsuranceQuestion(question_uid, question => {
      $scope.questions[question_uid] = question;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'product editor','error',()=>{},()=>{})
    });
  }
  
  /* Question Mapping */
  $scope.GetProductQuestionMapping = function(){
    $scope.knockout_question_list = []
    metaService.getQuestionMappingForProduct($stateParams.product_uid, question_mapping => {
      if(!question_mapping) {
        return;
      }
      question_mapping = question_mapping.questions
      $scope.raw_mapping = question_mapping;
      console.log('Mapping',question_mapping);
      for(var key in question_mapping){
        $scope.knockout_question_list.push({key:key, question:question_mapping[key]});
        GetSingleQuestion(key);
        for(var child_key in question_mapping[key].children){
          GetSingleQuestion(child_key);
        }
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }
  
  /* Decrement all question Above */
  DecrementAboveQuestions = function(deleted_question_uid)  {
    let ordered_map = {};
    let highest_order = 0;
    for(var key in $scope.raw_mapping){
      if(key === deleted_question_uid) { continue }
      ordered_map[$scope.raw_mapping[key].order] = {question:$scope.raw_mapping[key], key:key}
      highest_order = highest_order < $scope.raw_mapping[key].order ? $scope.raw_mapping[key].order : highest_order;
    }
    let goal = 1;
    for(var i=1; i<=highest_order;i++){
      let question = ordered_map[i];
      if(question && goal === question.question.order){
        goal++;
        continue;
      } else if(question) {
        question.question.order = goal;
        goal++;
        metaService.saveQuestionMappingForProduct($stateParams.product_uid, question.key, question.question, result => {
          
        }, error => {
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
          console.error(error.message);
        });
      }
    }
  }
  
  /* Delete Pretrigger Question */
  $scope.DeletePretriggerQuestion = function(question_uid){
    metaService.deletePretriggerQuestion($stateParams.product_uid, question_uid, () => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      $state.reload();
    }, error => {
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
      console.error(error.message);
    });
  }
  
  /* Move Up */
  $scope.MoveUp = function(key) {
    let question_up = $scope.raw_mapping[key]
    let question_down_index = null;
    if(question_up.order <= 1) { return }
    for(var index in $scope.raw_mapping){
      if($scope.raw_mapping[index].order === question_up.order-1){
        question_down_index = index
        break;
      }
    }
    if(!question_down_index){ return }
    metaService.swapOrderOnQuestionInProductMapping($stateParams.product_uid, key, question_down_index, question_up.order-1, question_up.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }
  
  /* Move Down */
  $scope.MoveDown = function(key) {
    let question_down = $scope.raw_mapping[key];
    let question_up_index = null;
    if(question_down.order >= $scope.knockout_question_list.length) { return }
    for(var index in $scope.raw_mapping){
      if($scope.raw_mapping[index].order == question_down.order+1){
        question_up_index = index
        break;
      }
    }
    if(!question_up_index){ return }
    metaService.swapOrderOnQuestionInProductMapping($stateParams.product_uid, key, question_up_index, question_down.order+1, question_down.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }
  
  /* Delete Question From Mapping */
  $scope.DeleteQuestionFromMapping = function(question_uid) {
    let deleted_question = $scope.questions[question_uid]
    metaService.deleteFromProductQuestionMapping($stateParams.product_uid, question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      DecrementAboveQuestions(question_uid)
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Redirect to Question Picker */
  $scope.addQuestionToInsurence =function(pre_trigger){
    $state.go('productquestionpicker', {product_uid:$stateParams.product_uid ,order:$scope.knockout_question_list.length+1, pre_trigger:pre_trigger});
  }
  
  /* Get Meta Information */
  GetMetaInformation = function(){
    insuranceQuestionsService.getAllMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.input_types = meta.input_type_enum;
      $scope.meta.question_types = meta.question_type_enum;
      $scope.meta.account_page_status = meta.account_page_status;
      $scope.meta.trigger_conditions = meta.trigger_conditions;
      $scope.meta.boolean_answers = meta.boolean_answers;
    }, error => {
      console.error(error);
    });
  }
  
  /* Make Subquestion of Above */
  $scope.MakeSubQuestionOfAbove = function(key, order) {
    
    $scope.subquestion_trigger.on = $scope.raw_mapping[key].knockout_trigger.on;
    $scope.subquestion_trigger.condition = $scope.raw_mapping[key].knockout_trigger.condition;
    
    let question_above_index = null;
    let question_to_subquestion = $scope.questions[key];
    if(question_to_subquestion.order <= 1) {
      return;
    }
    
    if($scope.raw_mapping[key].order===order) {
      var child_question_id = $scope.raw_mapping[key].order;
      var parent_question_id = $scope.raw_mapping[key].order-1;
      for(var index in $scope.raw_mapping) {
        if($scope.raw_mapping[index].order==parent_question_id) {
          question_above_index = index;
        }
      }
    }
    
    if(!question_above_index) {
      return;
    }
    
    if($scope.raw_mapping[key].children){
      return;
    }
    
    if($scope.questions[question_above_index].input_type === 'date') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Date');
      })
      return;
    }
    
    if($scope.questions[question_above_index].input_type === 'text') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Free Text');
      })
      return;
    }
    
    metaService.deleteAndMakeSubquestionProduct($scope.product_uid, question_above_index, key, $scope.subquestion_trigger, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      DecrementAboveQuestions(key);
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    })
  }
  
  /* Delete Sub Question From Mapping */
  $scope.DeleteSubQuestionFromProductMapping = function(parent_question_uid, child_question_uid) {
    metaService.deleteSubQuestionOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Sub Question Removed');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  // Set trigger for sub questions of bool type products
  $scope.SetSubquestionTriggerBool = function(parent_question_uid, child_question_uid, subquestion, new_bool){
    subquestion.trigger = {};
    subquestion.trigger.condition = "==";
    subquestion.trigger.on = new_bool;
    metaService.setSubQuestionTriggerOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, subquestion, () => {
      $rootScope.genService.showDefaultSuccessMsg('Trigger set for sub question');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  // Set trigger for sub questions of non-bool type products
  $scope.SetSubquestionTriggerNotBool = function(parent_question_uid, child_question_uid, subquestion){
    metaService.setSubQuestionTriggerOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, subquestion, () => {
      $rootScope.genService.showDefaultSuccessMsg('Trigger set for sub question');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  $scope.back = function(){
    $state.go('products');
  }
  
  /* *********comparison criteria*********** */
  
  const criteria_dummy = {
    sum_insured: 0,
    deductible_absolute_max: 0,
    deductible_absolute_min: 0,
    deductible_is_percent: false,
    deductible_percent_max: 0,
    included: false,
    maximisation: 1
  };
  
  $scope.generic_keys = {
    'general': 'General',
    'specific': 'Specific',
    'additional': 'Additional',
    'body': 'Bodily Injury',
    'financial': 'Financial Loss',
    'property': 'Property Damage'
  };
  
  $scope.max_comparison_count = 3;
  
  /**
  * Retrieve Comparison Criteria for the current product
  */
  function loadProductComparisonCriteria() {
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid,(product)=>{
      $scope.product = product;
      if(product.comparisons){
        $scope.comparison_keys = Object.keys($scope.product.comparisons);
        $scope.comparison_count = $scope.comparison_keys.length;
        
        $scope.compare_insurance_types = [];
        
        $scope.tree = {
          general: {[product.insurance_type]: {}},
          specific: {},
          additional: {}
        };
        
        $scope.obsolete_criteria = {};
        
        //iterate offer comparisons
        $scope.comparison_keys.forEach(comparison_key => {
          const comparison = product.comparisons[comparison_key];
          
          //iterate comparison insurance types
          for (let insurance_type_key in comparison.insurance_types) {
            if (comparison.insurance_types.hasOwnProperty(insurance_type_key)) {
              const insurance_type = comparison.insurance_types[insurance_type_key];
              
              if (typeof insurance_type === 'object') { //Dev.purposes mostly: we don't expect this to be false in real life
              
              /**
              * General
              */
              
              if (insurance_type_key === product.insurance_type) { //Check if this is a general insurance type
                for (let key in insurance_type.general) { //Go through general insurance types (body, financial, property)
                  if (insurance_type.general.hasOwnProperty(key)) {
                    if (!$scope.tree.general[insurance_type_key][key]) 
                      $scope.tree.general[insurance_type_key][key] = {};
                    $scope.tree.general[insurance_type_key][key][comparison_key] = insurance_type.general[key];
                  }
                }
              }
            } //if (typeof insurance_type === 'object')
          } //if (comparison.insurance_types.hasOwnProperty(insurance_type_key))
        }
      });
      isComparisionCriteriaValid();
    }
  });
}

/* Make Preferred */
$scope.MakePreferred = function(comparison_key){
  $scope.product.preferred = comparison_key;
  $scope.SaveProduct();
}

/**
*
* @param {String} key
* @return {*}
*/
$scope.getSectionName = function (key) {
  if (!key) return '';
  if ($scope.comparisons[key]) return $scope.comparisons[key].name_de;
  return $scope.generic_keys[key] || key;
};

/**
* Create a new blank comparison in the current product
*/
$scope.createNewComparison = function () {
  if (!$scope.comparison_count || $scope.comparison_count < $scope.max_comparison_count) {
    $scope.adding_comparison = true;
    
    const comparison = {
      insurance_types: {
        [$scope.product.insurance_type]: {
          general: {
            body: Object.assign({}, criteria_dummy),
            financial: Object.assign({}, criteria_dummy),
            property: Object.assign({}, criteria_dummy)
          },
          specific: {}
        }
      }
    };
    
    metaService.addProductComparison($scope.product_uid, comparison, () => {
      $state.reload();
    }, (err) => {
      console.log(err);
    });
    
  }
};

metaService.getAllComparisonCriteria(function (comparisons) {
  $scope.comparisons = comparisons
});

//Request the Deletion (Modal) of Comparison criteria in product
$scope.requestDeleteComparison = function(comparison_key) {
  $rootScope.local_load = true;
  $scope.delete_comparison = {
    key: comparison_key,
    comparison: $scope.product.comparisons[comparison_key]
  };
  FoundationApi.publish('comparison-deletion-modal', 'show');
};

/**
* Remove comparison from the current product
* @param comparison_uid
*/
$scope.deleteComparison = function (comparison_uid) {
  $rootScope.local_load = true;
  metaService.deleteComparisonFromProduct($stateParams.product_uid, comparison_uid, () => {
    $state.reload();
    FoundationApi.publish('comparison-deletion-modal', 'hide');
    $rootScope.genService.showDefaultSuccessMsg('Comparison deleted');
  }, (err) => {
    console.log(err);
  })
};

/* Change Display Version */
$scope.ChangeDisplayVersion = function(version){
  metaService.changeProductDisplayVersion($scope.product_uid, () => {
    $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
    $state.reload();
  }, error => {
    console.error(error);
    $rootScope.local_load = null;
    $rootScope.genService.showDefaultErrorMsg(error.code);
  });
}

function isComparisionCriteriaValid(){
  $scope.isComparisionCriteriaValid = true;
  if($scope.product.display_version == 2){
    if(!$scope.product.comparisons || !$scope.product.insurance_type){
      $scope.isComparisionCriteriaValid = false;
      return;
    }
    for(let comparisionId in $scope.product.comparisons){
      let comparisonObj = $scope.product.comparisons[comparisionId];
      if(!comparisonObj.insurance_types || !comparisonObj.basic ){
        $scope.isComparisionCriteriaValid = false;
        break;
      }
      let generalCriteria = comparisonObj.insurance_types[$scope.product.insurance_type];
      if(!generalCriteria || !generalCriteria.general){
        $scope.isComparisionCriteriaValid = false;
        break;
      }
      /* check if the general is valid, if all 3  criteri's included flags are not set then it's invalid */
      $scope.isComparisionCriteriaValid = false;
      for(let generalCriteriaId in generalCriteria.general){
        let generalCriteriaItem = generalCriteria.general[generalCriteriaId];
        if(generalCriteriaItem.included){
          $scope.isComparisionCriteriaValid = true;
          break;
        }
      }
      if(!$scope.isComparisionCriteriaValid){
        break;
      }
      /* check for specif criteria comparision here, do only if general criterias are valid */
      if($scope.isComparisionCriteriaValid){

      }
    }
  }
}

/**
 * Apply class for the comparison criteria
 * @param {Object | false} comparison
 * @return {string}
 */
$scope.checkCoverage = function (comparison) {
  if (typeof comparison === 'undefined') return "not-used";
  if (typeof comparison.included !== 'boolean') return "not-applicable";
  if (!comparison.included) return "not-included";
  return '';
};

/* Check Basic */
$scope.checkBasic = function(basic_criteria){
  if (typeof basic_criteria === 'undefined') return "not-applicable";
  return '';
}

/* On Controller Load */
GetMetaInformation();
$scope.GetProduct();
$scope.GetCarriers();
$scope.GetInsuranceTypes();
$scope.GetAllCodes();
$scope.GetProductQuestionMapping();
loadProductComparisonCriteria()
}
