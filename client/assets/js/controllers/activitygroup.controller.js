// Angular Module
angular.module('application').controller('ActivityGroupController', ActivityGroupController);

// Injections
ActivityGroupController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function ActivityGroupController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  	/* Get Group */
  	$scope.GetGroup = function(){
      $rootScope.local_load = true;
  		metaService.getSingleGroup($stateParams.group, group => {
        $scope.group = group;
        $rootScope.local_load = null;
        $scope.$apply();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})

      });
  	}

    /* Save Group */
    $scope.SaveGroup = function(){
      $rootScope.local_load = true;
      metaService.saveGroup($scope.group, $stateParams.group,  () => {
        backofficeService.logpost({msg:'group saved',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
    }

    /* Enable ActivityGroup */
    $scope.EnableGroup = function(){
      $rootScope.local_load = true;
      metaService.enableActivityGroup($stateParams.group,()=>{
        backofficeService.logpost({msg:'group enabled',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
      }

    /*Disable ActivityGroup*/
    $scope.DisableGroup = function(){
      $rootScope.local_load = true;
      metaService.disableActivityGroup($stateParams.group,()=>{
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'group disabled',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
      }


  	/* Call these functions on controller load */
    $scope.GetGroup();
}
