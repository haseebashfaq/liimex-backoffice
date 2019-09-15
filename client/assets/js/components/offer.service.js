(function() {

    'use strict';

    angular.module('application').
    service('offerService', offerService);

    offerService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];

    /* Endpoints */
    const prefix = 'offers';
    const comparisons_suffix = 'comparisons';
    const documents_suffix = 'documents';
    const policy_prefix = 'policies';
    const company_prefix = 'companies';
    const insurance_types_suffix = 'insurance_types';
    const specific_suffix = 'specific';
    const basic_suffix = 'basic';
    const general_suffix = 'general';
    const version_suffix = 'display_version';

    /* Constants */
    const included_options = {
      [true]: 'Included',
      [false]: 'Not Included'
    };

    const type_basic = basic_suffix;
    const type_general = general_suffix;
    const type_specific = specific_suffix;

    const general_keys = {
      body: 'Bodily Injury',
      property: 'Property Damage',
      financial: 'Financial Loss'
    };

    function offerService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {

        /* Get Offer Requests */
        function getOfferRequests(callback, err_call){
          requestService.getDataOnceEqualTo([prefix], 'status', 'requested', callback, err_call);
        }

        /* Get Offers for Company */
        function getOffersForCompany(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([prefix], 'company', company_uid, callback, err_call);
        }

        /* Generate Report */
        function generateReport(offer_uid, callback, err_call){
          requestService.updateData([prefix, offer_uid], {insurance_report_generated:false}, callback, err_call)
        }

        /* Get All Offers */
        function getAllOffers(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        /* Get Single Offer */
        function getSingleOffer(offer_uid, callback, err_call){
          requestService.getDataOnce([prefix, offer_uid], callback, err_call);
        }

        /* Save Offer */
        function saveOffer(offer_uid, data, callback, err_call){
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Save Comparison */
        function saveComparison(offer_uid, comparison_uid, data, callback, err_call){
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], data, callback, err_call, false)
        }

        /* Lock To Advisor */
        function lockToAdvisor(employee_email, offer_uid, callback, err_call){
          var data = {
            advisor : employee_email
          };
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Mark Offer as Offered */
        function markOfferAsOffered(display_version, offer_uid, callback, err_call){
          if(display_version && display_version===2){
            var data = {
              status : 'pushed',
              advisor : null,
              notified : false,
              display_version: 2
              // not_requested : true for unrequested email
            };  
          } else {
            var data = {
              status : 'pushed',
              advisor : null,
              notified : false
              // not_requested : true for unrequested email
            };
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Mark Offer as Offered No Notification */
        function markOfferAsOfferedDontNotify(display_version, offer_uid, callback, err_call){
          if(display_version && display_version===2){
            var data = {
              status : 'pushed',
              advisor : null,
              notified : true,
              display_version: 2
              // not_requested : true for unrequested email
            };
          } else {
            var data = {
              status : 'pushed',
              advisor : null,
              notified : true
              // not_requested : true for unrequested email
            };
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Finalize Offer*/
        function finalizeOffer(company_uid, policy_template, offer_uid, subject, callback, err_call){
          // Policy Template is the offer comparison that is chosen
          requestService.getMultipleKeys([{
            name:'policy', route:[policy_prefix]
          },{
            name:'offer', route:[prefix, offer_uid]
          },{
            name:'company', route:[company_prefix, company_uid, policy_prefix]
          }], keys => {
            var newUpdate = {}, now = requestService.getTimestamp();
            let policy = policy_template;
            policy.from_offer = offer_uid;
            policy.status = 'pending';
            policy.subject = subject;
            policy.documents = null;
            policy.created_at = now;
            policy.updated_at = now;
            policy.company = company_uid;
            newUpdate[keys['policy'].route+keys['policy'].key] = policy;
            newUpdate[keys['company'].route+keys['policy'].key] = true;
            newUpdate[company_prefix+'/'+company_uid+'/'+prefix+'/'+offer_uid] = null;
            newUpdate[keys['offer'].route+'status'] = 'finalized';
            newUpdate[keys['offer'].route+'updated_at'] = now;
            newUpdate[keys['offer'].route+'advisor'] = null;
            requestService.multiPathUpdate(newUpdate, () => {
              callback({policy_uid:keys['policy'].key});
            }, err_call);
          });
        }

        /* Revoke Offer */
        function revokeOffer(offer_uid, callback, err_call){
          var data = {
            status : 'requested'
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Unlock to Advisor */
        function unlockForAdvisor(offer_uid, callback, err_call){
          const data = {
            advisor : null
          };
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Add Comparison */
        function addComparison(offer_uid, comparison_data = {}, callback, err_call){
          requestService.pushData([prefix, offer_uid, comparisons_suffix], comparison_data, callback, err_call);
        }

        function updateComparison(offer_uid, comparison_uid, comparison_data, callback, err_call) {
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], comparison_data, callback, err_call)
        }

        /* Delete Comparison */
        function deleteComparison(offer_uid, comparison_uid, callback, err_call){
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid], callback, err_call)
        }

        function deleteOfferInsuranceType(offer_uid, comparison_uid, insurance_type_uid, callback, err_call) {
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid], callback, err_call);
        }

      function deleteOfferCriteria(offer_uid, comparison_uid, insurance_type_uid, criterion_uid, callback, err_call) {
        requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, specific_suffix, criterion_uid], callback, err_call);
      }

        /* Remove Document */
        function removeDocument(offer_uid, comparison_uid, document_uid, callback, err_call){
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, 'documents', document_uid], callback, err_call)
        }

        /* Write File Value */
        function writeFileValue(offer_uid, comparison_uid, newFile, callback, err_call){
          const data = {
            file : newFile
          };
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], data, callback, err_call)
        }

        /* Upload File */
        function uploadFile(fileItem, company_uid, callback, err_call){
          fileService.uploadFileWithCustomEndpoint([prefix, company_uid], "", fileItem, callback, err_call);
        }

        /* Download File */
        function downloadFile(file_url, company_uid, callback, err_call){
          fileService.downloadFileWithCustomEndpoint([prefix, company_uid], file_url, callback, err_call);
        }

        /* Download Report */
        function downloadReport(file_name, company_uid, callback, err_call){
          console.log('downloadReport', file_name, company_uid);
          // fileService.downloadFileWithCustomEndpoint([documents_suffix, company_uid], file_name, callback, err_call);
          // requestService.postLiimexResourceWithParams($rootScope.backoffice_url + '/api/download/office', {}, callback, err_call);
        }

        /* Add Document to Offer */
        function addDocumentToOffer(updateWithDocument, document_object, offer_uid, comparison_uid, callback, err_call) {
          updateWithDocument[prefix+'/'+offer_uid+'/'+comparisons_suffix+'/'+comparison_uid+'/'+documents_suffix+'/'+document_object.key] = document_object;
          requestService.multiPathUpdate(updateWithDocument, callback, err_call);
        }

        /**
         * Update single value in the offer comparisons
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} err_call
         * @return {undefined}
         */
        function updateSingleValue(params, callback, err_call) {
            const {offer_uid, comparison_uid, insurance_type_uid, criteria_uid, value_type, key, value} = params;
            let path = '';
            switch (value_type) {
                case type_basic:    path = [prefix, offer_uid, comparisons_suffix, comparison_uid, basic_suffix];
                                    break;

                case type_general:  path = [prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, general_suffix];
                                    break;

                case type_specific: path = [prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, specific_suffix, criteria_uid];
                                    break;
                default: return err_call({
                    error: 'Unknown value type. Expected: "basic", "general" or "specific"',
                    received: value_type});
            }
            console.log('attempting on');
            console.log(path);
            console.log({[key]: value});
            return requestService.updateData(path, {[key]: value}, callback, err_call)
        }

        /* Request Multiple Offers At Once */
        function requestMultipleOffers(keyList, company_uid, callback, err_call) {
          const keyArray = [];
          keyList.forEach(insuranceTypeKey => {
            keyArray.push({
              name:insuranceTypeKey+'offer',
              route:[prefix]
            });
          });

          requestService.getMultipleKeys(keyArray, keys => {
            var newUpdate = {}, now = requestService.getTimestamp();
            keyList.forEach(insuranceTypeKey => {
              newUpdate[company_prefix+'/'+company_uid+'/'+prefix+'/'+keys[insuranceTypeKey+'offer'].key] = true;
              newUpdate[keys[insuranceTypeKey+'offer'].route+keys[insuranceTypeKey+'offer'].key] = {
                company: company_uid,
                status: 'requested',
                notified: 'true',
                display_version: 2,
                insurance_report_generated: false,
                subject: insuranceTypeKey,
                created_at: now,
                updated_at: now,
                notified: false
              };
            });
            requestService.multiPathUpdate(newUpdate, callback, err_call);
          });
        }

        /* Get Offer Options */
        function getOfferOptions(){
          return { included_options, general_keys }
        }

        /* Change Display Version */
        function changeDisplayVersion(offer, offer_uid, callback, err_call){
          // offer.display_version = 2;
          for(var key in offer.comparisons){
            offer.comparisons[key].basic = {
              carrier : offer.comparisons[key].carrier || null,
              main_renewal_date : offer.comparisons[key].end_date || null,
              premium : offer.comparisons[key].premium || null,
              start_date : offer.comparisons[key].start_date || null,
              insurance_tax : 19
            }
            delete offer.comparisons[key].carrier;
            delete offer.comparisons[key].end_date;
            delete offer.comparisons[key].start_date;
            delete offer.comparisons[key].premium;
          }
          requestService.updateData([prefix, offer_uid], offer, callback, err_call);
        }


        /* Return Stuff */
        return {
          getOfferRequests,
          saveOffer,
          lockToAdvisor,
          unlockForAdvisor,
          writeFileValue,
          uploadFile,
          downloadFile,
          getSingleOffer,
          addComparison,
          updateComparison,
          deleteComparison,
          deleteOfferInsuranceType,
          deleteOfferCriteria,
          markOfferAsOffered,
          revokeOffer,
          getAllOffers,
          downloadReport,
          getOffersForCompany,
          addDocumentToOffer,
          removeDocument,
          finalizeOffer,
          generateReport,
          requestMultipleOffers,
          getOfferOptions,
          saveComparison,
          changeDisplayVersion,
          markOfferAsOfferedDontNotify,
          updateSingleValue
        }
    }
})();
