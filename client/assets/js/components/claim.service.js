(function() {

    'use strict';

    angular.module('application').
    service('claimService', claimService);

    claimService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoint(company_uid){
        return firebase.database().ref().child('claims/'+company_uid);
    }

    function claimService($rootScope, firebase, $firebaseObject, activityService) {


        /* Get Claims */
        function getClaims(company_uid, callback, err){
            var claimsRef = getSpecificEndpoint(company_uid);
            claimsRef.once('value').then(function(snapshot) {
                var claims = snapshot.val()
                callback(claims);
            }, function(error){
              err(error);
            });
        }

        /* Make New Claim */
        function makeNewClaim(claim, success, err){
            var claimsRef = getSpecificEndpoint($rootScope.user.company);
            claim.timestamp = $rootScope.genService.getTimestamp();
            claim.status = 'pending';
            const claimRef = claimsRef.push(claim).then(function(){
                success();
                activityService.logActivity({
                    activity: 'You made a claim',
                    next: 'Waiting for review',
                    timestamp: $rootScope.genService.getTimestamp()
                });
            }, function(error){
                err()
            });
        }

        /* Return Stuff */
        return {
            makeNewClaim: makeNewClaim,
            getClaims: getClaims
        }
    }
})();
