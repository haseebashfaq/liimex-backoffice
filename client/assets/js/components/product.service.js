(function() {

    'use strict';

    angular.module('application').
    service('productService', productService);

    productService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService', ];

    
    function productService($rootScope, firebase, $firebaseObject, requestService) {


        /* Return Stuff */
        return {
          
        }
    }
})();