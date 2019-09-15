(function() {

    'use strict';

    angular.module('application').
    service('recommendationService', recommendationService);

    recommendationService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','companyService','requestService'];


    /* Endpoints */
    const prefix = 'recommendations';


    /* Main Service */
    function recommendationService($rootScope, firebase, $firebaseObject, activityService, companyService,requestService) {

        /* get recommendation for the given company id */
        function getRecommendationsForCompId(companyid,callback,err_call){
            companyService.getCompanyInformation(companyid,company=>{
                if(company.recommendations){
                    let recommendationid = Object.keys(company.recommendations)[0];
                    if(recommendationid) {
                      getRecommendations(recommendationid, callback, err_call);
                    }
                }
            }, err_call);
        }

        /*  get recommendations for the given recommendation id */
        function getRecommendations(recommendation_uid, callback, err_call){
            requestService.getDataOnce([prefix,recommendation_uid],callback,err_call);
        }

        /* Return Stuff */
        return {
            getRecommendationsForCompId: getRecommendationsForCompId,
            getRecommendations: getRecommendations
        }
    }
})();
