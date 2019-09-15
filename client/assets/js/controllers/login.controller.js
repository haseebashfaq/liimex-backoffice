// Angular Module
angular.module('application').controller('LoginController', LoginController);

// Injections
LoginController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','$resource', 'authService', 'APIService','FoundationApi', 'companyService', 'userService'];

// Controller
function LoginController($rootScope, $scope, $stateParams, $state, $controller, $resource, authService, APIService, FoundationApi, companyService, userService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  	$scope.login = {};

  	/** Login Function **/
  	$scope.Login = function(form){
        var params = $scope.login;
        if(!form.$valid){ return; }
        authService.login(params, function(user){
            $state.go('search');
            $scope.login.password = null;
        }, function(error){
            $scope.login.password = null;
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
  	}

    /* Reset Password */
    $scope.ResetPassword = function(form){
        var params = $scope.login;
        if(!form.$valid){ return; }
        authService.resetPassword(params, function(){
            $rootScope.genService.showDefaultSuccessMsg('Use the email we\'ve sent you to reset your password');
        },  function(){
            $scope.login = {};
            $rootScope.genService.showDefaultErrorMsg('We didn\'t recognize that email. Contact us if you\'re sure it was correctly typed');
        });
    }

    /****************************/
    /*          Signup          */
    /****************************/

    // Signup Model
    $scope.signup = {}
    $scope.signup.user = {}

    // Login Function
    $scope.Signup = function(){

        // Set Params
        var params = $scope.signup;

        // Call Authentication Object First
        authService.createUser(params.user, function(firebase_user){
              userService.createUser(params.user, firebase_user, function(){
                  $rootScope.genService.showDefaultSuccessMsg('Registered! Pleace wait for an admin to verify you');
                  document.getElementById('signup_close').click();
              }, function(error){
                  console.error(error);
                  $rootScope.genService.showDefaultErrorMsg(error.message);
                  authService.logout(function(){},function(){});
              });
        }, function(error){
            console.error(error);
            $scope.signup.user.email = null;
            $scope.signup.user.password = null;
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    // /* Get Industry Sections */
    // $scope.GetIndustrySections = function(){
    //     APIService.getResourceWithParams(APIService.SEP.CATEGORIES,{'level':'sections'}, function(data){
    //         $scope.industry.sections = data;
    //     });
    // }

    // /* Get Industry Divisions */
    // $scope.GetIndustryDivisions = function(){
    //     var section;
    //     for(var key in $scope.industry.sections){
    //         var tmpSection = $scope.industry.sections[key];
    //         var name = tmpSection.name;
    //         if(name === $scope.signup.company.section){
    //             section = tmpSection;
    //             break;
    //         }
    //     }

    //     APIService.getResourceWithParams(APIService.SEP.CATEGORIES,{'level': 'divisions', 'keys' : section.divisions}, function(data){
    //         $scope.industry.divisions = data;
    //     });
    // }


}
