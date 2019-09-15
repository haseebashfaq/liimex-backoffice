(function() {

    'use strict';

    angular.module('application').
    service('APIService', APIService);

    APIService.$inject = ['$rootScope', '$resource'];

    /* Endpoints */
    var EP = {};
    EP.mailroom = '/api/mailroom';

    /* Main Service Function */
    function APIService($rootScope, $resource) {

        /*************************************/
        /*      Get Resource With Params     */
        /*************************************/
        function getResourceWithParams(endpoint, params, callback, err_call){
            var new_resource = $resource(endpoint);
            var resource_call = new_resource.get(params, function(response) {
                var data = response.data;
                callback(data);
            },
            function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /*************************************/
        /*      Get Resource Without Params   */
        /*************************************/
        function getResourceWithoutParams(endpoint, callback, err_call){
            var new_resource = $resource(endpoint);
            var resource_call = new_resource.get(function(response) {
                var data = response.data;
                callback(data);
            },
            function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Return Stuff */
        return {
            EP: EP,
            getResourceWithParams : getResourceWithParams,
            getResourceWithoutParams : getResourceWithoutParams
        }
    }
})();
