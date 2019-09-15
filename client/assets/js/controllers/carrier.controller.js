// Angular Module
angular.module('application').controller('CarrierController', CarrierController);

// Injections
CarrierController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'FileUploader', 'backofficeService'];

// Function
function CarrierController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /* Get Carrier */
    $scope.GetCarrier = function(){
      $rootScope.local_load = true;
      console.log('Getting Carrier..');
      metaService.getSingleCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $scope.carrier = carrier;
        $scope.GetDownloadURL();
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})

      });
    }

    /* Save Carrier */
    $scope.SaveCarrier = function(){
      console.log('Saving Carrier..');
      $rootScope.local_load = true;
      metaService.saveCarrier($stateParams.carrier, $scope.carrier, function(){
        backofficeService.logpost({msg:'carrier saved',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadCarrierPhoto($scope.current_file, function(file_url){
        metaService.addPhotoToCarrier(file_url, $stateParams.carrier, function(carrier){
          $rootScope.local_load = null;
          backofficeService.logpost({msg:'file uploaded',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          $state.reload();
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
        });
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    /* Download Carrier Photo */
  	$scope.DownloadPhoto = function(){
  		metaService.downloadCarrier($scope.carrier.file, function(url_for_download){
  			$rootScope.genService.downloadWithLink(url_for_download);
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
  		});
  	}

    /* Get Download Url */
  	$scope.GetDownloadURL = function(){
      if(!$scope.carrier.file) return;
  		metaService.downloadCarrier($scope.carrier.file, function(url_for_download){
  			$scope.carrier_photo = url_for_download;
        console.log('Photo:',url_for_download);
        $scope.$apply();
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
  		});
  	}

    // Disable
    $scope.DisableCarrier = function(){
      $rootScope.local_load = true;
      metaService.disableCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'carrier disabled',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    // Enable
    $scope.EnableCarrier = function(){
      $rootScope.local_load = true;
      metaService.enableCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'carrier enabled',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }


    /* On Controller Load */
    $scope.GetCarrier();

    /**********************************/
    /**  	  Uploader Listeners       **/
    /**********************************/

    /* Uploader Instance */
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
