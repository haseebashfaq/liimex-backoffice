// Angular Module
angular.module('application').controller('MandateController', MandateController);

// Injections
MandateController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','metaService', 'FileUploader', 'fileService', 'backofficeService'];

// Function
function MandateController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, fileService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.mandate = [];

    /* Get Single Mandate */
    $scope.GetSingleMandate = function(){
      console.log('Getting Single Mandate..');
      metaService.getSingleMandate($stateParams.mandate, function(mandate){
        $scope.mandate = mandate;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadMandate($scope.current_file, function(file_url){
        metaService.addMandate(file_url, function(mandate){
          $rootScope.local_load = null;
          document.getElementById('close_upload_file').click();
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          backofficeService.logpost({msg:'mandate uploaded',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
          $state.reload();
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Error adding mandate data');
          backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
          console.error(error);
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Error uploading file');
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
        console.error(error);
      });
    }


    /* Download Mandate */
  	$scope.DownloadMandate = function(mandate){
  		console.info('Downloading Policy: ',mandate);
  		metaService.downloadMandate(mandate.file, function(url_for_download){
  			var a = document.createElement('a');
        		a.href = url_for_download;
        		a.download = 'document_name';
        		a.target = '_self';
        		a.click();
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
  		});
  	}

    /* Make Active */
    $scope.MakeActive = function(){
      console.log('Activating mandate:',$stateParams.mandate);
      $scope.ConfirmAction = null;
      metaService.activateMandate($stateParams.mandate, function(){
        $rootScope.genService.showDefaultSuccessMsg('Activated');
        backofficeService.logpost({msg:'mandate activated',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Make Inactive */
    $scope.MakeInactive = function(){
      console.log('Activating mandate:',$stateParams.mandate);
      $scope.ConfirmAction = null;
      metaService.deactivateMandate($stateParams.mandate, function(){
        $rootScope.genService.showDefaultSuccessMsg('Deactivated');
        backofficeService.logpost({msg:'mandate deactivated',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Call On Controller Load */
    $scope.GetSingleMandate();

    /***********************************/
    /**  	    Uploader Listeners      **/
    /***********************************/

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
