// Angular Module
angular.module('application').controller('ComparisonCriteriaPicker', ComparisonCriteriaPicker);

// Injections
ComparisonCriteriaPicker.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriaPicker($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.selected_criteria = {};
    $scope.num_selected = 0;
    $scope.insurance_type = $stateParams.insurance_type;

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

    /* Get Comparison Criteria */
    $scope.GetAllComparisonCriteria = function(){
      $rootScope.local_load = true;
      metaService.getAllComparisonCriteria(comparison_criteria => {
        $scope.comparison_criteria = comparison_criteria;
        $scope.comparison_criteria_list = [];
        for(let key in comparison_criteria){
          $scope.comparison_criteria_list.push({key:key, criteria:comparison_criteria[key]})
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      })
    }

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMapping(comparison_criteria_mapping => {
        $scope.comparison_criteria_mapping = comparison_criteria_mapping;
        $scope.no_mapping = !$scope.comparison_criteria_mapping;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Add or Remove Criteria */
    $scope.AddOrRemoveSelectedCriteria = function(criteria_key){
      if($scope.selected_criteria[criteria_key]) {
        delete $scope.selected_criteria[criteria_key];
      } else {
        $scope.selected_criteria[criteria_key] = true;
      }
      $scope.num_selected = Object.keys($scope.selected_criteria).length
      $scope.safeApply(fn => fn);
    }

    /* Add Comparison Criteria */
    $scope.AddComparisonCriteria = function(){
      metaService.addComparisonCriteriaToMapping($stateParams.insurance_type, $scope.selected_criteria, () => {
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.go('insurancetype', {insurancetype:$stateParams.insurance_type})
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* On Controller Load */
    $scope.GetAllComparisonCriteria();
    $scope.GetComparisonCriteriaMapping();

}
