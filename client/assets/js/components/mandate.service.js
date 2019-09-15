(function() {

    'use strict';

    angular.module('application').
    service('mandateService', mandateService);

    mandateService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'backofficeService', 'fileService'];

    /* Prefix */
    const mandate_prefix = 'mandates';
    const document_prefix = 'documents';

    /* Service Function */
    function mandateService($rootScope, firebase, $firebaseObject, activityService, requestService, backofficeService, fileService) {

        /* Get Single Mandate */
        function getSingleMandate(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([document_prefix, mandate_prefix], 'company', company_uid, callback, err_call);
        }

        /* Get All Mandates */
        function getAllMandates(callback, err_call){
          requestService.getDataOnce([mandate_prefix], function(mandates){
              callback(mandates)
          }, function(error){
              err_call(error);
          });
        }

        /*Get mandate by id */
        function getMandateById(mandateId,callback,err_call){
          console.log('checking '+document_prefix+'/'+mandate_prefix+'/'+mandateId);
          requestService.getDataOnce([document_prefix,mandate_prefix,mandateId],callback,err_call)
        }

        /* Download mandate*/
        function getLinkToDownloadMandate(file_url, company_uid, callback, err_call){
          fileService.downloadFileWithCustomEndpoint([mandate_prefix, company_uid], file_url, callback, err_call);
        }

        function checkMandate(mandate_uid, company_uid, callback, err_call) {
            if (mandate_uid) {
                return callback(mandate_uid);
            }
            backofficeService.initMandate(company_uid, res => callback(res.mandate_uid), err_call);
        }

        function uploadMandate(file, company_uid, mandate_uid, callback, err_call) {
            checkMandate(mandate_uid, company_uid, (correct_mandate_uid) => {
                fileService.uploadFileWithCustomEndpoint([mandate_prefix, company_uid], "", file, signed_document_url => {
                    const mandate_data = {
                        signed_document_url,
                        notified: true,
                        status: 'signed',
                        timestamp: requestService.getTimestamp()
                    };
                    requestService.updateData([document_prefix, mandate_prefix, correct_mandate_uid], mandate_data, callback, err_call);
                }, err_call)
            }, err_call);

        }

        /* Return Stuff */
        return {
          getSingleMandate,
          getAllMandates,
          getLinkToDownloadMandate,
          getMandateById,
          uploadMandate
        }
    }
})();
