(function() {

    'use strict';

    angular.module('application').
    service('companyService', companyService);

    companyService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'finfoService', 'requestService'];

    /* Endpoints */
    const company_prefix = 'companies';
    const address_prefix = 'addresses';

    function companyService($rootScope, firebase, $firebaseObject, finfoService, requestService) {

        /* Get Company Info */
        function getCompanyInformation(company_uid, callback, err_call){
          requestService.getDataOnce([company_prefix, company_uid], callback, err_call);
        }

        /* Get All Companies */
        function getAllCompanies(callback, err_call){
          requestService.getDataOnce([company_prefix], callback, err_call);
        }

        /* Get Company Address */
        function getCompanyAddress(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([address_prefix],'company', company_uid, callback, err_call);
        }

        /* Update Company Information */
        function updateCompanyInformation(company_uid, params, callback, err_call){
          params.uid = null;
          requestService.updateData([company_prefix, company_uid], params, callback, err_call);
        }

        /* Update Address */
        function updateAddress(address_uid, params, callback, err_call){
          requestService.updateData([address_prefix, address_uid], params, callback, err_call);
        }

        /* Mark Company Blocked */
        function blockCompany(company_uid, callback, err_call){
          var data = {
            disabled : true
          }
          requestService.updateData([company_prefix, company_uid], data, callback, err_call);
        }

        /* Mark Company Unblocked */
        function unblockCompany(company_uid, callback, err_call){
          var data = {
            disabled : false
          }
          requestService.updateData([company_prefix, company_uid], data, callback, err_call);
        }

        /* Return Stuff */
        return {
            getCompanyInformation: getCompanyInformation,
            getCompanyAddress : getCompanyAddress,
            updateCompanyInformation : updateCompanyInformation,
            updateAddress : updateAddress,
            getAllCompanies : getAllCompanies,
            blockCompany : blockCompany,
            unblockCompany  : unblockCompany
        }
    }
})();
