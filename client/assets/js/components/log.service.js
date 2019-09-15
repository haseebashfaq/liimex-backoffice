(function() {

    'use strict';

    angular.module('application').
    service('logService', logService);

    logService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService', ];

    /* Endpoints */
    const prefix = 'log';
    const client_suffix = 'client';
    const office_suffix = 'office';

    function logService($rootScope, firebase, $firebaseObject, requestService) {

        /* Get Office Logs */
        function getOfficeLogs(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        /* Push Office Log */
        function pushOfficeLog(action, callback, err_call){
          var data = {
            actor : $rootScope.user.email,
            action : action
          }
          requestService.pushData([prefix], data, callback, err_call);
        }

        /* Return Stuff */
        return {
          getOfficeLogs : getOfficeLogs,
          pushOfficeLog : pushOfficeLog
        }
    }
})();
