(function() {

    'use strict';

    angular.module('application').
    service('accessService', accessService);

    accessService.$inject = ['$rootScope'];

    /* Access Map */
    const access_map = {};
    access_map[0] = [];
    access_map[1] = [
      'search',
      'advisory',
      'addusers',
      'openlocks'
    ];
    access_map[2] = [
      'search',
      'advisory',
      'addusers',
      'openlocks'
    ];
    access_map[3] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'openlocks'
    ];
    access_map[4] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'demand',
      'questions',
      'openlocks'
    ];
    access_map[5] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'demand',
      'questions',
      'admin',
      'openlocks'
    ];

    /* Main Function */
    function accessService($rootScope) {

      // Set Access rights
      function setAccessRights(level){
        if (level && access_map[level]) {
          $rootScope.access = new Set(access_map[level]);
        }
      }

      /* Return Stuff */
      return {
        setAccessRights : setAccessRights
      }

    }
})();
