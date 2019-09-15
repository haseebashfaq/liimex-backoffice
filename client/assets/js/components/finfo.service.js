(function() {

    'use strict';

    angular.module('application').
    service('finfoService', finfoService);

    finfoService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService', 'modelsService'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoint(address){
        return firebase.database().ref().child(address);
    }

    /* Service Function */
    function finfoService($rootScope, firebase, $firebaseObject, activityService, modelsService) {

        /* Get Company Information Blocks */
        function getCompanyInfoBlocks(callback){
            var model = modelsService.getModel('statistics');
            var blocksRef = getSpecificEndpoint(model.root);
            blocksRef.once('value').then(function(snapshot) {
                var blocks = snapshot.val()
                if(blocks) {
                  console.log('Previous data', blocks);
                  console.log('New data', model.model);
                  modelsService.syncTwoModels(blocks, model.model);
                  callback(blocks);
                }
                else {
                  console.log('All new data',model.model);
                  callback(model.model);
                }
            }, function(){

            });
        }

        /* Update Information For Company */
        function updateInformationForCompany(block_name,params, callback){
            var model = modelsService.getModel('statistics');
            var company_blocks = getSpecificEndpoint(model.root);
            var company_block = company_blocks.child(block_name);
            var block_obj = $firebaseObject(company_block);
            Object.assign(block_obj, params);
            block_obj.$save().then(function(ref) {
                console.info('Information Updated');
                activityService.logActivity({
                    activity: params.title+ ' updated',
                    next: 'Everything up to date',
                    timestamp: $rootScope.genService.getTimestamp()
                });
                callback();
            }, function(error) {
                console.log("Error:", error);
            });
        }

        /* Return Stuff */
        return {
            getCompanyInfoBlocks: getCompanyInfoBlocks,
            updateInformationForCompany: updateInformationForCompany
        }
    }
})();
