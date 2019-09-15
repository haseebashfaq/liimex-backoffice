(function() {

    'use strict';

    angular.module('application').
    service('authService', authService);

    authService.$inject = ['$rootScope','$firebaseAuth','$state'];

    function authService($rootScope, $firebaseAuth, $state) {

        /* On Auth State Changed */
        $firebaseAuth().$onAuthStateChanged(function(firebaseUser) {
            if(firebaseUser){
                console.log("Authentication Approved");
            } else{
                console.log("Authentication Denied");
                $state.reload();
            }
           //$state.reload();
        });

        /* Update Local Storage */
        // function updateLocalStorage(){
        //     uid = localStorage.getItem('uid') || undefined;
        // }

        /* Login */
        function login(credentials, success, err_call) {
            $firebaseAuth().$signInWithEmailAndPassword(credentials.email, credentials.password).then(function(firebaseUser) {
                console.log("Signed in as:", firebaseUser.uid);
                success(firebaseUser);
            }).catch(function(error) {
                err_call(error);
                console.error("Authentication failed:", error);
            });
        }

        /* Change Email */
        function changeEmail(user_obj, new_email, callback, err_call){
            user_obj.updateEmail(new_email).then(function(){
                callback();
            }, function(error){
                console.error('Email Change Failed',error);
                err_call(error);
            });
        }

        /* Logout */
        function logout(success, err_call) {
            $firebaseAuth().$signOut().then(function() {
                $rootScope = null;
                $state.reload();
                success();
            }, function(error) {
                err_call(error);
                console.log("Error: ", error);
            });
        }

        /* Create User */
        function createUser(params, success, err_call){
            $firebaseAuth().$createUserWithEmailAndPassword(params.email, params.password).then(function(firebaseUser) {
                console.log("AuthUser: " + firebaseUser.uid + " created successfully!");
                success(firebaseUser);
            }).catch(function(error) {
                err_call(error);
                console.error("Error: ", error);
            });
        }

        /* Reset Password */
        function resetPassword(user_data, success, err_call){
            $firebaseAuth().$sendPasswordResetEmail(user_data.email).then(function() {
              console.log('password reset requested');
              success();
            }, function(error) {
              console.log('cant reset password', error);
              err_call();
            });
            $state.reload();
        }

        /* Get User */
        function getCurrentUser(callback){
            var firebaseUser = $firebaseAuth().$getAuth();
            if (firebaseUser) {
                callback(firebaseUser);
            } else {
              callback(null);
            }
        }

        /* Delte User */
        function deleteUser(success, err_call){
          getCurrentUser(function(authObj){
            authObj.delete().then(function() {
              success();
            }, function(error) {
              err_call(error);
            });
          });
        }

        /* Return Stuff */
        return {
            getCurrentUser : getCurrentUser,
            createUser: createUser,
            resetPassword: resetPassword,
            login: login,
            logout: logout,
            changeEmail: changeEmail,
            deleteUser : deleteUser
        }
    }
})();
