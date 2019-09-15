// Angular Module
angular.module('application').controller('ActivityController', ActivityController);

// Injections
ActivityController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ActivityController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
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

  	/* Get My Activities */
  	$scope.GetActivities = function(forms){
      $rootScope.local_load = true;
  		metaService.getAllActivities(activities => {
        $scope.activities = [];
        for(var key in activities){
          $scope.activities.push({key:key, activity:activities[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
  	}

    /* Get Groups */
    $scope.GetGroups = function(){
      $rootScope.local_load = true;
      metaService.getGroups(groups => {
        $scope.groups = [];
        for(var key in groups){
          $scope.groups.push({key:key, group:groups[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Activity */
    $scope.AddActivity = function(){
      metaService.addActivity({}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Activity added');
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Group */
    $scope.AddGroup = function(){
      metaService.addGroup({}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Group added');
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

  	/* Call these functions on controller load */
    $scope.GetActivities();
    $scope.GetGroups();
}
