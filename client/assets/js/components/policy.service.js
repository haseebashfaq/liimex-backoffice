(function() {

  'use strict';

  angular.module('application').
  service('policyService', policyService);

  policyService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];

  /* Endpoints */
  const prefix = 'policies';
  const company_prefix = 'companies';
  const documents_suffix = 'documents';
  const insuranceTypes_suffix = 'insurance_types';
  const general_suffix = 'general';
  const specific_suffix = 'specific';

  function policyService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {

    /* Get Policies For a Company */
    function getPolicies(company_uid, callback, err_call){
      requestService.getDataOnceEqualTo([prefix], 'company', company_uid, callback, err_call);
    }

    /* Get Single Policy */
    function getSinglePolicy(policy_id, callback, err_call){
      requestService.getDataOnce([prefix, policy_id], function(policies){
        callback(policies)
      }, function(error){
        err_call(error);
      });
    }

    /* Register Existing Policy */
    function registerExistingPolicy(company_uid ,file_url, callback, err_call){
      requestService.getMultipleKeys([{
        name:'company', route:[company_prefix, company_uid, prefix]
      },{
        name:'policy', route:[prefix]
      }], keys => {
        var newUpdate = {}, now = requestService.getTimestamp();
        newUpdate[keys['company'].route+keys['policy'].key] = true;
        newUpdate[keys['policy'].route+keys['policy'].key] = {
          display_version:2, basic : {insurance_tax : 19}, file:file_url, company:company_uid, status:'pending', created_at:now, updated_at:now
        }
        requestService.multiPathUpdate(newUpdate, callback, err_call);
      });
    }

    /* Get All Policies */
    function getAllPolicies(callback, err_call){
      requestService.getDataOnce([prefix], callback, err_call);
    }

    /* Get Pending Policies */
    function getPoliciesWithFilter(sort_param, sort_value, callback, err_call){
      requestService.getDataOnceEqualTo([prefix], sort_param, sort_value, callback, err_call);
    }

    /* Overwrite File Value */
    function overwriteFileValue(policy_uid, newFile, callback, err_call){
      var data = {
        file : newFile
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Save Policy */
    function savePolicy(policy_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    function saveGeneralCriteria(policy_uid,insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid, general_suffix], data, callback, err_call)
    }

    function saveSpecificCriteria(policy_uid,insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid,specific_suffix], data, callback, err_call)
    }

    function deleteAdditionalModule(policy_uid,insurance_uid, callback, err_call){
      requestService.deleteData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid],callback,err_call);
    }

    /* Mark Policy Deleted */
    function deletePolicy(policy_uid, callback, err_call){
      var data = {
        status : 'deleted',
        notified : true
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Deleted */
    function makePending(policy_uid, callback, err_call){
      var data = {
        status : 'pending'
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Active */
    function activatePolicy(policy_uid, display_version = null, callback, err_call){
      var data = {
        status : 'active',
        display_version,
        extractor : null,
        notified : false
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Active */
    function activatePolicyNoEmail(policy_uid, display_version = null, callback, err_call){
     var data = {
        status : 'active',
        display_version,
        extractor : null,
        notified : true
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Lock To Extractor */
    function lockToExtractor(employee_email, policy_uid, callback, err_call){
      var data = {
        extractor : employee_email
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Remove Document */
    function removeDocument(policy_uid, document_uid, callback, err_call){
      requestService.deleteData([prefix, policy_uid, 'documents', document_uid], callback, err_call)
    }

    /* Unlock to Extractors */
    function unlockForExtractors(policy_uid, callback, err_call){
      var data = {
        extractor : null
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Add Document to Policy */
    function addDocumentToPolicy(updateWithDocument, document_object, policy_uid, callback, err_call) {
      updateWithDocument[prefix+'/'+policy_uid+'/'+documents_suffix+'/'+document_object.key] = document_object;
      requestService.multiPathUpdate(updateWithDocument, callback, err_call);
    }

    /* Upload Policy */
    function uploadPolicy(fileItem, company_uid, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, company_uid], "", fileItem, callback, err_call);
    }

    /* Download Policy */
    function downloadPolicy(file_url, company_uid, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, company_uid], file_url, callback, err_call);
    }

    /* Change Display Version */
    function changeDisplayVersion(policy, policy_uid, callback, err_call){
      policy.display_version = 2;
      policy.insurance_types = {};
      policy.basic = {
        premium : policy.premium || 0,
        carrier : policy.carrier || null,
        policy_number : policy.policy_number || null,
        start_date : policy.start_date || null,
        main_renewal_date: policy.end_date || null,
        insurance_tax : 19
      }
      policy.insurance_types[policy.subject] = {general:{maximisation:1}}
      requestService.updateData([prefix, policy_uid], policy, callback, err_call);
    }

    /* Return Stuff */
    return {
      registerExistingPolicy,
      getPolicies,
      getAllPolicies,
      getSinglePolicy,
      savePolicy,
      overwriteFileValue,
      deletePolicy,
      makePending,
      activatePolicy,
      uploadPolicy,
      downloadPolicy,
      lockToExtractor,
      unlockForExtractors,
      getPoliciesWithFilter,
      addDocumentToPolicy,
      removeDocument,
      activatePolicyNoEmail,
      saveGeneralCriteria,
      saveSpecificCriteria,
      deleteAdditionalModule,
      changeDisplayVersion
    }
  }
})();
