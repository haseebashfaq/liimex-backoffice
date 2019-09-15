// Angular Module
angular.module('application').controller('AccessController', AccessController);

// Injections
AccessController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'userService'];

// Function
function AccessController($rootScope, $scope, $stateParams, $state, $controller, userService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    // Scope Models
    $scope.users = [];
    $scope.new = {};
    $scope.delete_email =null;

    /* Get All Users */
    $scope.GetAllUsers = function(){

      $scope.new = {};
      $scope.users = [];

      userService.getAllUsers(function(result){
        for(var key in result){
          $scope.users.push({user:result[key], key:key});
        }
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Select User */
    $scope.SelectUser = function(key, user){
      $scope.selected_key = key;
      $scope.selected_user = user;
      $scope.new.rights = user.rights;
      $scope.delete_email = null;
    }

    /* Update User */
    $scope.UpdateUser = function(key){
        console.log('Updating user to:', $scope.new);

        if (key===$rootScope.currentUser) {
          $rootScope.genService.showDefaultErrorMsg('You cannot edit your own access level');
          return;
        }

        userService.updateAdminRights(key, $scope.new.rights, function(response){
          $rootScope.genService.showDefaultSuccessMsg('Employee account updated!');
          document.getElementById('close_admin').click();
          $scope.selected_key = null;
          $scope.selected_user = null;
          $state.reload();
        }, function(){
          $rootScope.genService.showDefaultErrorMsg('Someting went wrong, please try again later');
        });
    }

    /* Delete User */
    $scope.DeleteUser = function(key){
      if (key===$rootScope.currentUser) {
        $rootScope.genService.showDefaultErrorMsg('You cannot delete yourself');
        return;
      }

      userService.deleteUser(key, function(){
        $rootScope.genService.showDefaultSuccessMsg('User deleted');
        document.getElementById('close_admin').click();
        $scope.GetAllUsers();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Call On Controller Load */
    $scope.GetAllUsers();
}
