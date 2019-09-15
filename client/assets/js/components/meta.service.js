(function() {
  
  'use strict';
  
  angular.module('application').
  service('metaService', metaService);
  
  metaService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];
  
  // Routes
  const prefix = 'meta';
  const mandate_suffix = 'mandate';
  const policies_suffix = 'policy_criteria';
  const industry_suffix = 'industry_criteria';
  const custom_field_suffix = 'fields';
  const products_suffix = 'products';
  const carrier_suffix = 'carriers';
  const insurance_suffix = 'insurance_types';
  const codes_suffix = 'industry_codes';
  const activity_suffix = 'activities';
  const group_suffix = 'activity_groups';
  const activities_suffix = 'activities';
  const insurance_questions_suffix = 'insurance_questionnaire';
  const insurance_mapping_suffix = 'insurance_question_mapping';
  const mapped_questions_suffix = 'questions';
  const recommendation_mapping_suffix = 'recommendation_mapping';
  const activity_weights_suffix = 'activity_weights';
  const knockout_trigger_suffix = 'knockout_trigger';
  const product_question_children_suffix = 'children';
  const pretrigger_suffix = 'pre_triggers';
  const questions_suffix = 'questions';
  const comparison_criteria_suffix = 'comparison_criteria';
  const comparison_criteria_mapping_suffix = 'comparison_criteria_mapping';
  const trigger_suffix = 'trigger';
  const comparisons_suffix = 'comparisons';
  
  function metaService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {
    
    let model = {};
    
    /* Question Input Types */
    let product_input_type_enum = {};
    product_input_type_enum['bool'] = "Yes / No";
    product_input_type_enum['number'] = "Number";
    product_input_type_enum['date'] = "Date";
    product_input_type_enum['currency'] = "Currency/Money";
    product_input_type_enum['text'] = "Free Text";
    
    var allInsuranceQuestionsArray = [];
    
    /* Threshold triggers for products */
    let product_trigger_conditions = {}
    product_trigger_conditions['<'] = "<";
    product_trigger_conditions['>'] = ">";
    product_trigger_conditions['<='] = "<=";
    product_trigger_conditions['>='] = ">=";
    product_trigger_conditions['!='] = "!=";
    product_trigger_conditions['=='] = "=";
    product_trigger_conditions['<>'] = "<>";
    product_trigger_conditions['no_threshold'] = "No threshold";
    
    let product_boolean_answers = {};
    product_boolean_answers[false] = "No";
    product_boolean_answers[true] = "Yes";
    product_boolean_answers["no_threshold"] = "No threshold";
    
    /*********************************************/
    /**                 Mandate                 **/
    /*********************************************/
    
    /* Add Mandate */
    function addMandate(file_url, callback, err_call){
      var data = {
        file: file_url,
        status: 'inactive'
      }
      requestService.pushData([prefix, mandate_suffix], data, callback, err_call);
    }
    
    /* Get Mandates */
    function getMandates(callback, err_call){
      requestService.getDataOnce([prefix, mandate_suffix], callback, err_call);
    }
    
    /* Get Single Mandate */
    function getSingleMandate(mandate_uid, callback, err_call){
      requestService.getDataOnce([prefix, mandate_suffix, mandate_uid], callback, err_call);
    }
    
    /* Upload Mandate */
    function uploadMandate(fileItem, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, mandate_suffix], "", fileItem, callback, err_call);
    }
    
    /* Download Mandate */
    function downloadMandate(file_url, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, mandate_suffix], file_url, callback, err_call);
    }
    
    /* Mark Mandate Active */
    function activateMandate(mandate_uid, callback, err_call){
      var data = {
        status : 'active'
      }
      requestService.updateData([prefix, mandate_suffix, mandate_uid], data, callback, err_call)
    }
    
    /* Mark Mandate Inactive */
    function deactivateMandate(mandate_uid, callback, err_call){
      var data = {
        status : 'inactive'
      }
      requestService.updateData([prefix, mandate_suffix, mandate_uid], data, callback, err_call)
    }
    
    /*********************************************/
    /**             Policy Criteria             **/
    /*********************************************/
    
    /* Get All Criteria  */
    function getAllComparisonCriteria(callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_suffix], callback, err_call);
    }
    
    /* Get All Criteria Mapping  */
    function getComparisonCriteriaMapping(callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_mapping_suffix], callback, err_call);
    }
    
    /* Get All Criteria Mapping For Insurance Type */
    function getComparisonCriteriaMappingForInsuranceType(insurance_type, callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_mapping_suffix, insurance_suffix, insurance_type], callback, err_call);
    }
    
    /* Update Comparison Criteria Mapping */
    function updateComparisonCriteriaMapping(insurance_type, data, callback, err_call){
      requestService.updateData([prefix, comparison_criteria_mapping_suffix, insurance_suffix, insurance_type], data, callback, err_call);
    }
    
    /* Add Comparison Criteria to Criteria Mapping */
    function addComparisonCriteriaToMapping(insurance_type, criterias, callback, err_call){
      let data = { industry : {exclude_all : false} }
      let newUpdate = {}
      for(let key in criterias){
        newUpdate[prefix+'/'+comparison_criteria_mapping_suffix+'/'+insurance_suffix+'/'+insurance_type+'/'+comparison_criteria_suffix+'/'+key] = data
      }
      requestService.multiPathUpdate(newUpdate, callback, err_call);
    }
    
    /* OLD STUFF BELOW */
    
    /* Add Policy Criteria */
    function addPolicyCriteria(callback, err_call){
      requestService.pushData([prefix, policies_suffix], {}, callback, err_call);
    }
    
    /* Add Custom Field To Policy Criteria */
    function addCustomField(policy_uid, callback, err_call){
      requestService.pushData([prefix, policies_suffix, policy_uid, custom_field_suffix], {}, callback, err_call);
    }
    
    /* Save Policy Criteria */
    function savePolicyCriteria(policy_uid, data, callback, err_call){
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call)
    }
    
    /* Disable Custom Field */
    function disableCustomField(policy_uid, field_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, policies_suffix, policy_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Enable Custom Field */
    function enableCustomField(policy_uid, field_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, policies_suffix, policy_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Delete Policy Criteria */
    function deletePolicyCriteria(policy_uid, data, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call);
    }
    
    /* Enable Policy Criteria */
    function enablePolicyCriteria(policy_uid, data, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call);
    }
    
    /* Get Policy Criteriaa */
    function getPolicyCriteria(callback, err_call){
      requestService.getDataOnce([prefix, policies_suffix], callback, err_call);
    }
    
    /* Get Single Policy Criteria */
    function getSinglePolicyCriteria(policy_uid, callback, err_call){
      requestService.getDataOnce([prefix, policies_suffix, policy_uid], callback, err_call);
    }
    
    /* Get Policy Specific Criteria From Subject Trigger */
    function getPolicySpecificCriteriaFromSubjectTrigger(subject_trigger, callback, err_call){
      requestService.getDataOnceEqualTo([prefix, policies_suffix], 'trigger', subject_trigger, callback, err_call);
    }
    
    /* OLD STUFF ABOVE */
    
    
    /*********************************************/
    /**               Industry Criterias        **/
    /*********************************************/
    
    /* Add Industry Criteria */
    function addIndustryCriteria(callback, err_call){
      requestService.pushData([prefix, industry_suffix], {}, callback, err_call);
    }
    
    /* Get Industry Criteriaa */
    function getIndustryCriteria(callback, err_call){
      requestService.getDataOnce([prefix, industry_suffix], callback, err_call);
    }
    
    /* Get Single Industry Criteria */
    function getSingleIndustryCriteria(criteria_uid, callback, err_call){
      requestService.getDataOnce([prefix, industry_suffix, criteria_uid], callback, err_call);
    }
    
    /* Save Industry Criteria */
    function saveIndustryCriteria(criteria_uid, data, callback, err_call){
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call)
    }
    
    /* Add Custom Field To Industry Criteria */
    function addInudstryCustomField(criteria_uid, callback, err_call){
      requestService.pushData([prefix, industry_suffix, criteria_uid, custom_field_suffix], {}, callback, err_call);
    }
    
    /* Disable Custom Field */
    function disableIndustryCustomField(criteria_uid, field_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Enable Custom Field */
    function enableIndustryCustomField(criteria_uid, field_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Delete Industry Criteria */
    function disableIndustryCriteria(criteria_uid, data, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call);
    }
    
    /* Enable Industry Criteria */
    function enableIndustryCriteria(criteria_uid, data, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call);
    }
    
    /* Get Industry Specific Criteria From Subject Trigger */
    function getIndustrySpecificCriteriaFromPolicyTrigger(policy_trigger, callback, err_call){
      requestService.getDataOnceEqualTo([prefix, industry_suffix], 'policy_trigger', policy_trigger, callback, err_call);
    }
    
    
    /*********************************************/
    /**               Carriers                  **/
    /*********************************************/
    
    /* Add Carrier */
    function addCarrier(callback, err_call){
      var data = {
        disabled : true
      }
      requestService.pushData([prefix, carrier_suffix], data, callback, err_call);
    }
    
    /* Get Carriers */
    function getCarriers(callback, err_call){
      requestService.getDataOnce([prefix, carrier_suffix], callback, err_call);
    }
    
    /* Get Single Carrier */
    function getSingleCarrier(carrier_uid, callback, err_call){
      requestService.getDataOnce([prefix, carrier_suffix, carrier_uid], callback, err_call);
    }
    
    /* Save Carrier */
    function saveCarrier(carrier_uid, data, callback, err_call){
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call)
    }
    
    /* Upload Carrier Photo */
    function uploadCarrierPhoto(fileItem, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, carrier_suffix], "", fileItem, callback, err_call);
    }
    
    /* Add Photo to Carrier */
    function addPhotoToCarrier(file_url, carrier_uid, callback, err_call){
      var data = {
        file: file_url
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /* Download Carrier Photo */
    function downloadCarrier(file_url, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, carrier_suffix], file_url, callback, err_call);
    }
    
    /* Disable Carrier */
    function disableCarrier(carrier_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /* Enable Carrier */
    function enableCarrier(carrier_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /*********************************************/
    /**             Insurance Types             **/
    /*********************************************/
    
    /* Add Insurance Type */
    function addInsuranceType(callback, err_call){
      var data = {
        disabled : true,
        included_for_all : false,
      }
      requestService.pushData([prefix, insurance_suffix], data, callback, err_call);
    }
    
    /* Get Insurance Types */
    function getInsuranceTypes(callback, err_call){
      requestService.getDataOnce([prefix, insurance_suffix], callback, err_call);
    }
    
    /* Get Single Insurance Type */
    function getSingleInsuranceType(insurance_uid, callback, err_call){
      requestService.getDataOnce([prefix, insurance_suffix, insurance_uid], callback, err_call);
    }
    
    /* Disable Insurance Type */
    function disableInsuranceType(insurance_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call);
    }
    
    /* Enable Insurance Type */
    function enableInsuranceType(insurance_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call);
    }
    
    /* Save Insurance Type */
    function saveInsuranceType(insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call, true)
    }
    
    /*********************************************/
    /**             Industry Codes             **/
    /*********************************************/
    
    /* Add Industry Code */
    function addIndustryCode(callback, err_call){
      var data = {
        disabled : true
      }
      requestService.pushData([prefix, codes_suffix], data, callback, err_call);
    }
    
    /* Get Industry Codes */
    function getIndustryCodes(callback, err_call){
      if(model.industry_codes) {
        callback(model.industry_codes)
        return;
      }
      requestService.getDataOnValue([prefix, codes_suffix],
        result => {
          model.industry_codes = result;
          callback(model.industry_codes);
          return;
        }, err_call);
      }
      
      /* Get Single Insurance Type */
      function getSingleIndustryCode(code_uid, callback, err_call){
        requestService.getDataOnce([prefix, codes_suffix, code_uid], callback, err_call);
      }
      
      /* Disable Industry Code */
      function disableIndustryCode(code_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call);
      }
      
      /* Enable Industry Code */
      function enableIndustryCode(code_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call);
      }
      
      /* Save Industry Code */
      function saveIndustryCode(code_uid, data, callback, err_call){
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call)
      }
      
      /* Get Code uid From Code Code */
      function getCodeDataFromCode(code, callback, err_call){
        requestService.getDataOnceEqualTo([prefix, codes_suffix], 'code', code, callback, err_call);
      }
      
      
      /*********************************************/
      /**               Activities                **/
      /*********************************************/
      
      /* Get All Activities */
      function getAllActivities(callback, err_call){
        requestService.getDataOnce([prefix, activity_suffix], callback, err_call);
      }
      
      /* Get Single Activity */
      function getSingleActivity(uid, callback, err_call){
        requestService.getDataOnce([prefix, activity_suffix, uid], callback, err_call);
      }
      
      /* Add Activity */
      function addActivity(data, callback, err_call){
        data.disabled = false;
        requestService.pushData([prefix, activity_suffix], data, callback, err_call);
      }
      
      /* Save Activity */
      function saveActivity(uid, data, callback, err_call){
        requestService.updateData([prefix, activity_suffix, uid], data, callback, err_call);
      }
      
      /* Get Groups */
      function getGroups(callback, err_call){
        requestService.getDataOnce([prefix, group_suffix], callback, err_call);
      }
      
      /* Get Single Group */
      function getSingleGroup(uid, callback, err_call){
        requestService.getDataOnce([prefix, group_suffix, uid], callback, err_call);
      }
      
      /* Save Group */
      function saveGroup(data, uid, callback, err_call){
        requestService.updateData([prefix, group_suffix, uid], data, callback, err_call);
      }
      
      /* Add Group */
      function addGroup(data, callback, err_call){
        data.disabled = false;
        requestService.pushData([prefix, group_suffix], data, callback, err_call);
      }
      
      function disableActivity(activity_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, activity_suffix, activity_uid], data, callback, err_call);
      }
      
      function enableActivity(activity_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, activity_suffix, activity_uid], data, callback, err_call);
        
      }
      
      function disableActivityGroup(activity_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, group_suffix, activity_uid], data, callback, err_call);
      }
      
      function enableActivityGroup(activity_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, group_suffix, activity_uid], data, callback, err_call);
      }
      
      /* Activity Questions */
      function getActivityQuestions(callback, err_call){
        if(model.activities){
          callback(model.activities);
          return;
        }
        requestService.getDataOnce([prefix, activities_suffix], activities => {
          model.activities = activities;
          callback(activities);
        }, err_call);
      }
      
      /* Activity Groups */
      function getGroups(callback, err_call){
        if(model.groups){
          callback(model.groups)
        }
        requestService.getDataOnce([prefix, group_suffix], groups => {
          model.groups = groups;
          callback(model.groups);
        }, err_call);
      }
      
      /*********************************************/
      /**          Insurance Questions            **/
      /*********************************************/
      
      function getAllInsuranceQuestions(callback, err_call){
        requestService.getDataOnce([prefix, insurance_questions_suffix], callback, err_call);
      }
      
      function getSingleInsuranceQuestion(question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_questions_suffix, question_uid], callback, err_call)
      }
      
      function updateInsuranceQuestion(question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_questions_suffix, question_uid], data, callback, err_call);
      }
      
      function deleteInsuranceQuestion(question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_questions_suffix, question_uid], callback, err_call);
      }
      
      function deleteQuestionFromMapping(insurance_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      function addNewInsuranceQuestion(data, callback, err_call){
        requestService.pushData([prefix, insurance_questions_suffix], data, callback, err_call, false);
      }
      
      function editQuestionMapping(insurance_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, question_uid], data, callback, err_call, false);
      }
      
      function getQuestionMappingForInsuranceType(insurance_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix], callback, err_call);
      }
      
      function getAllQuestionMapping(callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, insurance_suffix], callback, err_call);
      }
      
      function swapOrderOnQuestionInMapping(insurance_uid, question_uid_1, question_uid_2, new_order_1, new_order_2, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+question_uid_1+'/order'] = new_order_1;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+question_uid_2+'/order'] = new_order_2;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteAndMakeSubquestionOf(insurance_uid, parent_question_uid, child_question_uid, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+child_question_uid] = null;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/trigger'] = false;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteSubquestion(insurance_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, parent_question_uid, 'children', child_question_uid], callback, err_call);
      }
      
      function editSubquestion(insurance_uid, parent_question_uid, child_question_uid, data, callback, err_call) {
        requestService.updateData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, parent_question_uid, 'children', child_question_uid], data, callback, err_call, false);
      }
      
      
      /*********************************************/
      /**       Recommendation Mapping            **/
      /*********************************************/
      
      function getAllRecommendationMapping(callback, err_call){
        requestService.getDataOnce([prefix, recommendation_mapping_suffix], callback, err_call);
      }
      
      function saveActivityRecommendationScore(insurance_type, activityquestion, data, callback, err_call){
        requestService.updateData([prefix, recommendation_mapping_suffix, insurance_suffix,insurance_type,activity_weights_suffix,activityquestion], data,callback,err_call);
      }
      
      function deleteActivityRecommendationScore(insurance_type, activityquestion, data, callback, err_call){
        requestService.deleteData([prefix, recommendation_mapping_suffix, insurance_suffix, insurance_type, activity_weights_suffix, activityquestion], callback, err_call);
      }
      
      function saveIndustryRecommendationScore(insurance_type, data, callback, err_call){
        requestService.updateData([prefix, recommendation_mapping_suffix, insurance_suffix,insurance_type], data,callback,err_call);
      }
      
      /*********************************************/
      /**                 Products                **/
      /*********************************************/
      
      function getTriggersForProductQuestion(product_uid, question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      function getTriggersForProductSubQuestion(product_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], callback, err_call);
      }
      
      function saveTriggersForProductQuestion(product_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid, knockout_trigger_suffix], data, callback, err_call);
      }
      
      function saveTriggersForProductSubQuestion(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid, knockout_trigger_suffix], data, callback, err_call);
      }
      
      function getAllProductMetaInformation(callback, err_call){
        callback({product_input_type_enum, product_trigger_conditions, product_boolean_answers});
      }
      
      function saveLinkedProductQuestion(product_uid, question_uid, question_order, callback, err_call){
        var data = {
          children : false,
          order : question_order,
          children : false,
          knockout_trigger : {
            condition : "no_threshold",
            on : "no_threshold"
          }
        }
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], data, callback, err_call);
      }
      
      function addPretriggerToQuestion(product_uid, question_uid, callback, err_call){
        var data = {
          trigger : {
            condition : "no_threshold",
            on : "no_threshold"
          }
        }
        requestService.updateData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid], data, callback, err_call);
      }
      
      function savePretriggerQuestion(product_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid, trigger_suffix], data, callback, err_call);
      }
      
      function getLinkedProductQuestion(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix], callback, err_call);
      }
      
      /* Add Insurance Product */
      function addInsuranceProduct(callback, err_call){
        var data = {
          disabled : true,
          display_version: 2
        }
        requestService.pushData([prefix, products_suffix], data, callback, err_call);
      }
      
      /* Get Insurance Products */
      function getInsuranceProducts(callback, err_call){
        requestService.getDataOnce([prefix, products_suffix], callback, err_call);
      }
      
      /* Get Single Product */
      function getSingleProduct(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, products_suffix, product_uid], callback, err_call);
      }
      
      /* Disable Product */
      function disableProduct(product_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /* Enable Product */
      function enableProduct(product_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /* Save Product */
      function saveProduct(product_uid, data, callback, err_call){
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call, true)
      }
      
      /* Get Question Mapping For Product */
      function getQuestionMappingForProduct(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid], callback, err_call);
      }
      
      /* Save Question Mapping For Product */
      function saveQuestionMappingForProduct(product_uid, question_uid, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      /* Delete Question Prom Prouct */
      function deleteFromProductQuestionMapping(product_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      /* Swap Order On Question Product Mapping */
      function swapOrderOnQuestionInProductMapping(product_uid, question_uid_1, question_uid_2, new_order_1, new_order_2, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+question_uid_1+'/order'] = new_order_1;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+question_uid_2+'/order'] = new_order_2;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      /* Delete And Make Subquestion Of Product */
      function deleteAndMakeSubquestionProduct(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+child_question_uid] = null;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/trigger'] = false;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/knockout_trigger/condition'] = data.condition;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/knockout_trigger/on'] = data.on;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteSubQuestionOfProduct(product_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], callback, err_call);
      }
      
      function setSubQuestionTriggerOfProduct(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], data, callback, err_call);
      }
      
      function deletePretriggerQuestion(product_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid], callback, err_call);
      }
      
      function getProductsWithInsuranceType(insurance_type, callback, err_call){
        requestService.getDataOnceEqualTo([prefix, products_suffix], 'insurance_type', insurance_type, callback, err_call);
      }
      
      /* Add Comparison */
      function addProductComparison(product_uid, comparison_data, callback, err_call){
        requestService.pushData([prefix, products_suffix, product_uid, comparisons_suffix], comparison_data, callback, err_call);
      }
      
      /* Delete Comparison criteria from Product*/
      function deleteComparisonFromProduct(product_uid, comparison_uid, callback, err_call){
        requestService.deleteData([prefix, products_suffix, product_uid, comparisons_suffix, comparison_uid], callback, err_call)
      }
      
      function changeProductDisplayVersion(product_uid, callback, err_call){
        var data = {
          display_version: 2
        };
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /*********************************************/
      /**       Comparison Criterias             **/
      /*********************************************/
      
      function getcomparisonCriterias(callback,err_call){
        requestService.getDataOnce([prefix, comparison_criteria_suffix], callback, err_call);
      }
      
      function addComparisonCriteria(data,callback,err_call){
        requestService.pushData([prefix,comparison_criteria_suffix],data,callback,err_call);
      }
      
      function saveComparisonCriteria(criteria_uid,data,callback,err_call){
        requestService.updateData([prefix,comparison_criteria_suffix,criteria_uid],data,callback,err_call,true);
      }
      
      function getSinglecomparisonCriteria(criteria_uid,callback,err_call){
        requestService.getDataOnce([prefix, comparison_criteria_suffix, criteria_uid], callback, err_call);
      }
      
      
      /* Return Stuff */
      return {
        enableActivityGroup,
        disableActivityGroup,
        getMandates,
        addMandate,
        uploadMandate,
        getSingleMandate,
        downloadMandate,
        activateMandate,
        deactivateMandate,
        addPolicyCriteria,
        savePolicyCriteria,
        getPolicyCriteria,
        getSinglePolicyCriteria,
        addCustomField,
        disableCustomField,
        deletePolicyCriteria,
        addInsuranceProduct,
        getInsuranceProducts,
        addCarrier,
        getCarriers,
        getSingleCarrier,
        saveCarrier,
        uploadCarrierPhoto,
        addPhotoToCarrier,
        downloadCarrier,
        disableCarrier,
        enableCarrier,
        addInsuranceType,
        getInsuranceTypes,
        getSingleInsuranceType,
        disableInsuranceType,
        enableInsuranceType,
        saveInsuranceType,
        getSingleProduct,
        disableProduct,
        enableProduct,
        saveProduct,
        addIndustryCode,
        getIndustryCodes,
        getSingleIndustryCode,
        disableIndustryCode,
        enableIndustryCode,
        saveIndustryCode,
        enablePolicyCriteria,
        getPolicySpecificCriteriaFromSubjectTrigger,
        getIndustrySpecificCriteriaFromPolicyTrigger,
        enableCustomField,
        addIndustryCriteria,
        getIndustryCriteria,
        getSingleIndustryCriteria,
        saveIndustryCriteria,
        addInudstryCustomField,
        disableIndustryCustomField,
        enableIndustryCustomField,
        disableIndustryCriteria,
        enableIndustryCriteria,
        getCodeDataFromCode,
        getAllActivities,
        getSingleActivity,
        addActivity,
        saveActivity,
        getSingleGroup,
        getGroups,
        saveGroup,
        addGroup,
        disableActivity,
        enableActivity,
        getAllInsuranceQuestions,
        getSingleInsuranceQuestion,
        updateInsuranceQuestion,
        deleteInsuranceQuestion,
        addNewInsuranceQuestion,
        editQuestionMapping,
        getQuestionMappingForInsuranceType,
        deleteQuestionFromMapping,
        swapOrderOnQuestionInMapping,
        deleteAndMakeSubquestionOf,
        deleteSubquestion,
        editSubquestion,
        getAllRecommendationMapping,
        saveActivityRecommendationScore,
        deleteActivityRecommendationScore,
        saveIndustryRecommendationScore,
        getActivityQuestions,
        getAllQuestionMapping,
        getQuestionMappingForProduct,
        deleteFromProductQuestionMapping,
        getLinkedProductQuestion,
        saveLinkedProductQuestion,
        getAllProductMetaInformation,
        saveTriggersForProductQuestion,
        saveTriggersForProductSubQuestion,
        getTriggersForProductQuestion,
        getTriggersForProductSubQuestion,
        swapOrderOnQuestionInProductMapping,
        saveQuestionMappingForProduct,
        deleteAndMakeSubquestionProduct,
        deleteSubQuestionOfProduct,
        setSubQuestionTriggerOfProduct,
        addPretriggerToQuestion,
        savePretriggerQuestion,
        deletePretriggerQuestion,
        getProductsWithInsuranceType,
        getAllComparisonCriteria,
        getComparisonCriteriaMapping,
        addComparisonCriteriaToMapping,
        getComparisonCriteriaMappingForInsuranceType,
        updateComparisonCriteriaMapping,
        getcomparisonCriterias,
        addComparisonCriteria,
        saveComparisonCriteria,
        getSinglecomparisonCriteria,
        addProductComparison,
        deleteComparisonFromProduct,
        changeProductDisplayVersion
      }
    }
  })();
  