// Angular Module
angular.module('application').controller('CreateUserController', CreateUserController);

// Injections
CreateUserController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService'];

// Function
function CreateUserController($rootScope, $scope, $stateParams, $state, $controller, userrequestService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.user = {};
		let userrequestid = "";
		let userid = "";

	  /* save User in Auth */
	  $scope.saveUser = function(){
  		$rootScope.local_load = true;
      // if($scope.user.email.includes('liimex')){
      //   $rootScope.genService.showDefaultErrorMsg("Please don't create @liimex emails this way!");
      //   return;
      // }

  		userrequestService.saveUserRequest({
        email : $scope.user.email
      }, (uid, requestid) => {
  			userid = uid;
  			userrequestid = requestid;
        $scope.openCompany();
  			$rootScope.local_load = null;
  			$rootScope.genService.showDefaultSuccessMsg("User successfully fetched / created");
  		},(user_request)=>{
  			$rootScope.local_load = null;
        if(user_request){
          $rootScope.genService.showDefaultErrorMsg(user_request.error_message);
        }
  		});
		}

	  /* Goto Company Page*/
	  $scope.openCompany = function(){
			$state.go('createcompany',{"userid":userid,"userrequestid": userrequestid});
	  }
}
