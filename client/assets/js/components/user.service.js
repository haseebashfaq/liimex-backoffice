(function() {

    'use strict';

    angular.module('application').
    service('userService', userService);

    userService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'authService', 'modelsService', 'requestService'];

    /* Endpoints */
    const prefix = 'admins';
    const prefix_non_admin = 'users';
    const prefix_companies = 'companies';


    function userService($rootScope, firebase, $firebaseObject, authService, modelsService, requestService) {

        /* Create User */
        function createUser(params, firebase_user, callback, err_call){

            var new_admin_model = {
              first_name : "N/A",
              last_name : "N/A",
              email : "N/A",
              rights : 0
            }

            // Do not ship password
            if(params.password)
                params.password = null;

            Object.assign(new_admin_model, params);

            requestService.setData([prefix, firebase_user.uid], new_admin_model, callback, err_call);
        }

        /* Get User Information */ //admin hardcoded in prefix
        function getUserInformation(user_id, success, err_call){
            requestService.getDataOnce([prefix, user_id], function(user){
              if(user === null){
                err_call({message: "account locked"});
                $rootScope.genService.showDefaultErrorMsg('Account locked. Please contact admin');
              } else if (user.rights === 0) {
                err_call({message: "account locked"});
                $rootScope.genService.showDefaultErrorMsg('Account locked. Please contact admin');
              } else {
                success(user);
              }
            }, err_call);
        }

        /* Get All Users */
        function getAllUsers(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        // Update User Information
        function updateUserInformation(user_id, prev_parmas, params, callback, reauth, err_call){
            if(prev_parmas.email !== params.email){
                console.log('Detected: New Email');
                authService.getCurrentUser(function(userObj){
                  authService.changeEmail(userObj, params.email, function(){
                      requestService.setData([prefix, user_id], params, callback, err_call);
                  }, function(error){
                      if(error.code === 'auth/requires-recent-login'){ // REPLACE WITH: Reauth Code
                          reauth();
                      }
                      else{
                          err_call(error)
                      }
                  });
                });
            }else{
                requestService.setData([prefix, user_id], params, callback, err_call);
            }
        }

        /* Update Admin Rights*/
        function updateAdminRights(user_id, level, callback, err_call){
            requestService.updateData([prefix, user_id], {rights : level}, callback, err_call)
        }

        /* Delete User */
        function deleteUser(user_id, callback, err_call){
          requestService.deleteData([prefix,user_id], callback, err_call);
        }

        /* Get Users Of Company */
        function getUsersOfCompany(company_uid, callback, err_call){
          requestService.getDataOnce([prefix_companies,company_uid,prefix_non_admin], callback, err_call);
        }

        /*Return user info*/
        function returnUserInfo(userid, callback, err_call){
          console.log('requesting ',userid,prefix_non_admin)
          requestService.getDataOnce([prefix_non_admin, userid], callback, err_call);
        }


        /* Return Stuff */
        return {
            createUser : createUser,
            getUserInformation: getUserInformation,
            updateUserInformation : updateUserInformation,
            getAllUsers : getAllUsers,
            updateAdminRights : updateAdminRights,
            deleteUser : deleteUser,
            getUsersOfCompany : getUsersOfCompany,
            returnUserInfo : returnUserInfo

        }
    }
})();
