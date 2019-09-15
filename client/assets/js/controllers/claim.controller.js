// Angular Module
angular.module('application').controller('ClaimController', ClaimController);

// Injections
ClaimController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'FileUploader', 'fileService', 'claimService', 'FoundationApi'];

// Function
function ClaimController($rootScope, $scope, $stateParams, $state, $controller, firebase, FileUploader, fileService, claimService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
  	$scope.new_claim = {};
    $scope.selected_claim = {};
    $scope.claims = {};

    /* Get My Claims */
    $scope.GetMyClaims = function(){
      console.log('Getting Claims..');
      var active  = [];
      var pending = [];
      claimService.getClaims(function(claimSet){
        for(var key in claimSet){
          var tmpClaim = claimSet[key];
          var status = tmpClaim.status.toLowerCase();
          if(status === 'active'){
            active.push(tmpClaim);
          } else if(status === 'pending'){
            pending.push(tmpClaim);
          } else {
            pending.push(tmpClaim);
          }
        }
        $scope.claims.active = active;
        $scope.claims.pending = pending;
        $scope.notempty = (pending.length+active.length > 0);
        $scope.selected_claim = {};
        $scope.$apply();
      },function(){

      });
    }

    /* Select Claim */
    $scope.SelectClaim = function(claim){
      $scope.selected_claim = claim;
    }

  	/**********************************/
  	/**  	    Claim  -  Modal        **/
  	/**********************************/


  	/* Perform upload */
  	$scope.MakeAClaim = function(form){
      console.log("Making Claim...");
      if(!form.$valid) { return }
  		claimService.makeNewClaim($scope.new_claim, function(){
        $scope.new_claim = {};
        FoundationApi.publish('main-notification', { 
          content: 'Claim Registered!',
          color:"success", 
          autoclose:3000
        });
      }, function(error){

      });
  	}

    /* Call Before Anything Else */
    $scope.GetMyClaims();  

} 
