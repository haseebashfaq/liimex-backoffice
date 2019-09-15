// Angular Module
angular.module('application').controller('MandatesController', MandatesController);

// Injections
MandatesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','metaService', 'FileUploader', 'fileService'];

// Function
function MandatesController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, fileService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.mandates = [];

    /* Get All Mandates */
    $scope.GetAllMandates = function(){
      $rootScope.local_load = true;
      console.log('Getting mandate(s)..');
      $scope.mandates = [];

      metaService.getMandates(function(mandates){
        console.log('Mandates:', mandates);
        for(var key in mandates){
          $scope.mandates.push({key:key, mandate:mandates[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Mandate */
    $scope.AddMandate = function(){
      console.log('Adding Mandate');

    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadMandate($scope.current_file, function(file_url){
        metaService.addMandate(file_url, function(mandate){
          $rootScope.local_load = null;
          document.getElementById('close_upload_file').click();
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          $state.reload();
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Error adding mandate data');
          console.error(error);
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Error uploading file');
        console.error(error);
      });
    }

    /* Call On Controller Load */
    $scope.GetAllMandates();

    /**********************************/
    /**  	  Uploader Listeners     **/
    /**********************************/

    /* Uploader Instance */
    // Uploader
    var uploader = $scope.uploader = new FileUploader({});
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            return this.queue.length < 10;
        }
    });

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };

    // File Added
    uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
        console.info('Added file with name', fileItem.file.name);
        $scope.can_upload = true;
        $scope.current_file = fileItem;
    };

    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
    };
}
