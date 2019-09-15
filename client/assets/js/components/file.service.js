(function() {

    'use strict';

    angular.module('application').
    service('fileService', fileService);

    fileService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'uuid2'];

    // Parse File Name
    function parseFileName(userId, blob, uuid2){
      console.log('BLOB',blob);
        var extension = blob.type.split('/')[1];
        return uuid2.newuuid()+'.'+extension;
    }

    /* Get Dynamic Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getEndpoint(routeList){
        var route = routeList.join('/');
        console.log('Requested Storage Route:',route);
        return firebase.storage().ref().child(route);
    }

    function fileService($rootScope, firebase, $firebaseObject, uuid2) {

        // Policies Reference
        const policiesRef = firebase.storage().ref().child('policies/');

        /* Download A Policy */
        function downloadSinglePolicy(file_url, callback){
          var policyRef = policiesRef.child(file_url);
          policyRef.getDownloadURL().then(function(url) {
              callback(url);
          }, function(error) {

          });
        }

        /* Upload file */
        function uploadFile(company_uid ,fileItem, callback, err){
            var file_url = parseFileName(company_uid, fileItem, uuid2);
            var newPolicyRef = policiesRef.child(file_url);
            newPolicyRef.put(fileItem).then(function(snapshot) {
                callback(file_url)
            }, function(error){
                err(error);
            });
        }

        /* Upload File With Custom Endpoint */
        function uploadFileWithCustomEndpoint(route, file_id, fileItem, callback, err_call){
          var file_url = parseFileName(file_id, fileItem, uuid2);
          var storageRef = getEndpoint(route).child(file_url);
          storageRef.put(fileItem).then(function(snapshot) {
              callback(file_url)
          }, function(error){
              err_call(error);
          });
        }

        /* Download File With Custom Endpoint */
        function downloadFileWithCustomEndpoint(route, file_url, callback, err_call){
          var storageRef = getEndpoint(route).child(file_url);
          storageRef.getDownloadURL().then(function(url) {
              callback(url);
          }, function(error) {
              err_call(error)
          });
        }

        function downloadWithName(from, rename_to) {
            rename_to = encodeURIComponent(rename_to);
            return firebase.storage().ref().child(from).getDownloadURL()
                .then(() => { //We don't need a downloadURL, since we use it only to make sure the resource exists
                    window.location.assign("/api/download?from=" + from + "&as=" + rename_to);
                });
        }

        /* Return Stuff */
        return {
            uploadFile: uploadFile,
            downloadSinglePolicy: downloadSinglePolicy,
            uploadFileWithCustomEndpoint : uploadFileWithCustomEndpoint,
            downloadFileWithCustomEndpoint : downloadFileWithCustomEndpoint,
            downloadWithName: downloadWithName
        }
    }
})();
