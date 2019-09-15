(function() {

    'use strict';

    angular.module('application').
    service('backofficeService', backofficeService);

    backofficeService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService' ];

    /* Endpoints */
    const logendpoint = '/api/log';
    const emailcheckendpoint = '/api/email/';

    const API_INIT_MANDATE = '/api/company/:company_uid/mandate/init';

    function backofficeService($rootScope, firebase, $firebaseObject, requestService) {

        /* Post Log */
        function logpost(logs_object, user, program, level, callback, err_call){
          var params = {logs_object:logs_object, user:user, program:program, level:level, source:'backoffice'};
          requestService.postLiimexResourceWithParams($rootScope.backoffice_url+logendpoint, params, callback, err_call);
        }

        /* Check Email */
        function emailcheckpost(email, callback, err_call){
          var params = {email:email};
          requestService.postLiimexResourceWithParams($rootScope.backoffice_url+emailcheckendpoint, params, callback, err_call);
        }

        function initMandate(company_uid, callback, err_call) {
            const request_url = $rootScope.backoffice_url + API_INIT_MANDATE.replace(':company_uid', company_uid);
            requestService.postLiimexResourceWithParams(request_url, {}, callback, err_call);
        }

        /* Return Stuff */
        return {
            logpost,
            emailcheckpost,
            initMandate
        }
    }
})();
