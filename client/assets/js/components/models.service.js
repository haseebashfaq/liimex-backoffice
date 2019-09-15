(function() {

    'use strict';

    angular.module('application').
    service('modelsService', modelsService);

    modelsService.$inject = ['$http','$rootScope', 'APIService', '$resource'];


    function modelsService($http, $rootScope, APIService, $resource) {

        // Models
        var models;

        /* Get Modelxxs */
        function getModel(key){
            if(models){
                return models[key];
            } else {
                console.log('Models not defined');
            }
        }

        /* Sync Two Models */
        function syncTwoModels(old_model, new_model){
            console.log('Syncing models..', old_model, new_model);
            for(let key in new_model){
              if(typeof new_model === 'object'){
                var key_new = !(key in old_model);
                console.log('key:', key, 'is new:', key_new);
                if(key_new === true){
                  old_model[key] = new_model[key];
                }
                else if(old_model[key] && new_model[key]){
                  syncTwoModels(old_model[key], new_model[key]);
                }
              }
            }
            console.log('OLD', old_model);
        }

        /* Merge Models */
        function mergeModels(last_sync, old_model, new_model){
          if(!last_sync) {
            old_model['last_sync'] = $rootScope.genService.getTimestamp();
          } else {
            console.log('Last Sync', old_model['last_sync']);
          }
        }

        /* Sync Models With API */
        function syncModels(company_uid, success, err_call){
            console.log('Syncing Models');
            APIService.getResourceWithParams(APIService.SEP.MODEL_SYNC, {company_uid: company_uid}, function(data){
                models = data;
                console.log('Models:',models);
                success();
            }, function(error){
                console.log(error);
                err_call();
            });
        }


        /* Return Stuff */
        return {
            syncModels : syncModels,
            getModel : getModel,
            syncTwoModels : syncTwoModels,
            mergeModels : mergeModels
        }
    }
})();
