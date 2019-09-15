(function() {

    'use strict';

    angular.module('application').
    service('documentService', documentService);

    documentService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'requestService', 'fileService'];

    /* Endpoints */
    const document_prefix = 'documents';
    const mandate_suffix = 'mandates';
    const policy_suffix = 'policies';
    const generic_suffix = 'generics'

    /* Model */
    let model = {}

    /* Service Function */
    function documentService($rootScope, firebase, $firebaseObject, requestService, fileService) {

      /* Upload Files */
      function uploadPolicies(file, company_uid, callback, err_call){
        fileService.uploadFileWithCustomEndpoint([document_prefix, company_uid], "", file, callback, err_call);
      }

      /* Upload File */
      function uploadFile(file, company_uid, callback, err_call){
        fileService.uploadFileWithCustomEndpoint([document_prefix, company_uid], "", file, callback, err_call);
      }


      /* Download Document */
      function downloadDocument(file_url, company_uid, callback, err_call){
        fileService.downloadFileWithCustomEndpoint([document_prefix, company_uid], file_url, callback, err_call);
      }

      /* Create Document */
      function createDocuments(file_url, company_uid, callback, err_call){
        let document_keys = []
        document_keys.push({ name:'document', route:[document_prefix, policy_suffix]})
        requestService.getMultipleKeys(document_keys, keys => {
          var newUpdate = {}, now = requestService.getTimestamp();
          for(var elem in keys){
            newUpdate[keys[elem].route+keys[elem].key] = {
              file:file_url, created_at:now, updated_at:now, company:company_uid
            };
          }
          callback(newUpdate, keys);
        });
      }

      /* Create Generic Document */
      function createGenericDocument(file_url, company_uid, callback, err_call){
        let document_keys = []
        document_keys.push({ name:'document', route:[document_prefix, generic_suffix]})
        requestService.getMultipleKeys(document_keys, keys => {
          var newUpdate = {}, now = requestService.getTimestamp();
          for(var elem in keys){
            newUpdate[keys[elem].route+keys[elem].key] = {
              file:file_url, created_at:now, updated_at:now, company:company_uid
            };
          }
          callback(newUpdate, keys);
        });
      }

      /* Get Document */
      function getDocument(route, key, callback, err_call){
        requestService.getDataOnce((route+key).split('/'), callback, err_call);
      }

      /* Save Document */
      function saveDocument(route, key, newData, callback, err_call){
        requestService.updateData((route+key).split('/'), newData, callback, err_call);
      }

      /* Get and Store Mandate */
      function getAndStoreMandate(key, callback, err_call){
        if(model[key]){
          console.log('Returning mandate');
          callback(model[key]);
          return;
        }
        requestService.on_child_value([document_prefix, mandate_suffix, key], document => {
          console.log('Updating mandate');
          model[key] = document;
          callback(model[key]);
        }, error => {
          err_call(error);
        });
      }

      /* Return Stuff */
      return {
        getAndStoreMandate : getAndStoreMandate,
        uploadPolicies : uploadPolicies,
        createDocuments : createDocuments,
        getDocument : getDocument,
        downloadDocument : downloadDocument,
        saveDocument : saveDocument,
        uploadFile : uploadFile,
        createGenericDocument : createGenericDocument
      }
    }
})();
