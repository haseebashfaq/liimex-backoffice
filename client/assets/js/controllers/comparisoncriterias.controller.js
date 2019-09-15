// Angular Module
angular.module('application').controller('ComparisonCriteriasController', ComparisonCriteriasController);

// Injections
ComparisonCriteriasController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriasController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.comparisonCriterias = [];

    $scope.addcomparisoncriteria = function(){
      $state.go('comparisoncriteria');
    }

    /* Get All Policy Types */
    $scope.GetAllComparisonCriterias = function(){
      $rootScope.local_load = true;
      console.log('Getting comparison criteria(s)..');
      $scope.comparisonCriterias = [];

      metaService.getcomparisonCriterias(function(comparisonCriterias){
        for(var key in comparisonCriterias){
          $scope.comparisonCriterias.push({key:key, criteria:comparisonCriterias[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }


    /* On Controller Load */
    $scope.GetAllComparisonCriterias();

}
