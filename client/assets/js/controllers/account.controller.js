// Angular Module
angular.module('application').controller('AccountController', AccountController);

// Injections
AccountController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'companyService', 'userService', 'authService','FoundationApi'];

// Function
function AccountController($rootScope, $scope, $stateParams, $state, $controller, firebase, companyService, userService, authService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // User and Address models
    $scope.address = {};
    $scope.user = {};
    $scope.company = {};

    // Update Models
    $scope.update = {};
    $scope.update.company = {};
    $scope.update.user = {};
    $scope.update.address = {};

    /* Update Update Variables */
    UpdateUpdateVariables = function(){
        Object.assign($scope.update.company, $scope.company);
        Object.assign($scope.update.user, $scope.user);
        Object.assign($scope.update.address, $scope.address);
        $scope.$apply();
    }

    /* Get Address Information */
    $scope.GetAddressInformation = function(){
        var address_list = [];
        companyService.getCompanyAddress($rootScope.user.company, function(addresses){
            for(var key in addresses){
                address_list.push(addresses[key]);
            }

            // Adding the first index address (FIND A SOLUTION)
            $scope.address = address_list[0];
            UpdateUpdateVariables();
        }, function(error){

        });
    }

    /* Get Address Information */
    $scope.GetCompanyInformation = function(){
      companyService.getCompanyInformation($rootScope.user.company, function(company){
        $scope.company = company;
        UpdateUpdateVariables();
      },function(error){
        console.log(error);
      });
    }

    /* Get Users Information */
    $scope.GetUserInformation = function(){
        userService.getUserInformation($rootScope.currentUser, function(user){
            $scope.user = user;
            UpdateUpdateVariables();
        }, function(error){

        });
    }

    /* Update Information */
    $scope.UpdateInformation = function(){
        console.log('Updating Information')
        userService.updateUserInformation($rootScope.currentUser, $scope.user, $scope.update.user, function(){
            companyService.updateCompanyInformation($rootScope.user.company, $scope.update.company, function(){
                companyService.updateAddress($rootScope.user.company, $scope.update.address, function(){
                    $rootScope.genService.showDefaultSuccessMsg('Information Updated');
                    $scope.GetUserInformation();
                    $scope.GetAddressInformation();
                    $scope.GetCompanyInformation();
                    $scope.$apply();
                    document.getElementById('close_button').click();
                }, function(error){
                    $rootScope.genService.showDefaultErrorMsg(error.message);
                });
            }, function(error){
                $rootScope.genService.showDefaultErrorMsg(error.message);
            });
        }, function(){
            // Reauthenticate
            document.getElementById('account_reauth').click();
        }, function(error){
            // Error
            $rootScope.genService.showDefaultErrorMsg(error.message);
            UpdateUpdateVariables();
        });
    }

    /* Confirm Reauthentication */
    $scope.Reauthenticate = function(password){
        console.log('Reauthenticating');
        authService.login({email: $scope.user.email, password: password}, function(){
            $scope.UpdateInformation();
            var reauth = document.getElementById('close_reauth').click();
        }, function(error){
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Call when controller is loading */
    $scope.GetAddressInformation();
    $scope.GetUserInformation();
    $scope.GetCompanyInformation();

}
