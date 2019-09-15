(function() {

    'use strict';

    angular.module('application').
    service('activityService', activityService);

    activityService.$inject = ['$rootScope', 'firebase', '$firebaseObject'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoing(company_uid){
        return firebase.database().ref().child('activities/'+company_uid);
    }

    function activityService($rootScope, firebase, $firebaseObject) {

        /* Get Activities */
        function getActivities(callback, err){
            var activitiesRef = getSpecificEndpoing($rootScope.user.company);
            activitiesRef.once('value').then(function(snapshot) {
                var policies = snapshot.val()
                callback(policies);
            });
        }

        /* Log Activity */
        function logActivity(activity){
            var activitiesRef = getSpecificEndpoing($rootScope.user.company);
            const activityRef = activitiesRef.push( activity ).then(function(){

            });
        }

        /* Return Stuff */
        return {
            logActivity : logActivity,
            getActivities : getActivities
        }

    }
})();
