// Angular Module
angular.module('application').controller('RecommendationController', RecommendationController);

// Injections
RecommendationController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'FileUploader', 'fileService', 'recommendationService', 'FoundationApi'];

// Function
function RecommendationController($rootScope, $scope, $stateParams, $state, $controller, firebase, FileUploader, fileService, recommendationService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
  	$scope.recommendations = {}
  	$scope.notempty = false;
  	$scope.selected_recommendation;

  	/* Get My Policies */
  	$scope.GeyMyRecommendations = function(forms){
  		console.log('Getting Recommendations');

  		var active = [];
  		var pending = [];
  		
      policyService.getPolicies(function(policySet){
  			for(var key in policySet){
  				var tmpPolicy = policySet[key];
  				var status = tmpPolicy.status.toLowerCase();
  				if(status === 'active'){
  					active.push(tmpPolicy);
  				} else if(status === 'pending'){
  					pending.push(tmpPolicy);
  				} else {
  					pending.push(tmpPolicy);
  				}
  			}
  			$scope.policies.active = active;
  			$scope.policies.pending = pending;
  			$scope.notempty = (pending.length+active.length > 0);
  			$scope.$apply();
  		},function(){

  		});
  	}

  	/* Select Policy */
  	$scope.SelectRecommendation = function(recommendation){
  		console.info("Policy Selected: ",recommendation);
  		$scope.selected_recommendation = recommendation;
  	}


    /* Call these functions on controller load */

} 
