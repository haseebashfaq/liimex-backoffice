// Angular Module
angular.module('application').controller('CodeController', CodeController);

// Injections
CodeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function CodeController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Safe Apply */
    $scope.safeApply = function(fn) {
      if(!this.$root){
        return;
      }
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    /* Get Code */
    $scope.GetCode = function(){
      $rootScope.local_load = true;
      metaService.getSingleIndustryCode($stateParams.code, function(code){
        $rootScope.local_load = null;
        $scope.code = code;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Save Code */
    $scope.SaveCode = function(){
      $rootScope.local_load = true;
      metaService.saveIndustryCode($stateParams.code, $scope.code, function(){
        backofficeService.logpost({msg:'code saved',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Disable */
    $scope.DisableCode = function(){
      $rootScope.local_load = true;
      metaService.disableIndustryCode($stateParams.code, function(){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'code disabled',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Enable */
    $scope.EnableCode = function(){
      $rootScope.local_load = true;
      metaService.enableIndustryCode($stateParams.code, function(){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'code enabled',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }


    /* On Controller Load */
    $scope.GetCode();

}
