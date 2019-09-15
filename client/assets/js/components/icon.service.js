(function() {

  'use strict';

  angular.module('application').
  service('iconService', iconService);

  iconService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'requestService', 'fileService'];

  const icon_prefix = 'icons';
  const insurance_suffix = 'insurance_types';
  const meta_prefix = 'meta';

  const icons_route = [icon_prefix];

  function iconService($rootScope, firebase, $firebaseObject, requestService, fileService) {

    function uploadFile(file, callback, err_call){
      fileService.uploadFileWithCustomEndpoint(icons_route, "", file,
        file_id => {
            fileService.downloadFileWithCustomEndpoint(icons_route, file_id, (download_url) => {
              const icon_record = {
                name: file.name,
                storage_id: file_id,
                download_url
              };
              requestService.pushData(icons_route, icon_record, callback, err_call);
            }, err_call);
        }
      , err_call);
    }

    function onIconsUpdate(callback, call_err) {
      requestService.getDataOnValue(icons_route, callback, call_err)
    }

    function updateInsuranceTypeIcon(insurance_uid, icon_url, callback, err_call) {
        requestService.updateData([meta_prefix, insurance_suffix, insurance_uid], {icon_url}, callback, err_call)
    }

    return {
      uploadFile,
      onIconsUpdate,
      updateInsuranceTypeIcon
    }
  }

})();
