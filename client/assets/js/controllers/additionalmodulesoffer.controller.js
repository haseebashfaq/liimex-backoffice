// Angular Module
angular.module('application').controller('AdditionalModulesOfferController', AdditionalModulesOfferController);

// Injections
AdditionalModulesOfferController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService'];

// Function
function AdditionalModulesOfferController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.offer_uid = $stateParams.offer_uid;
    $scope.comparison_uid = $stateParams.comparison_uid;
    $scope.selected_insurance_types = {};
    $scope.num_selected = 0;

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

    /* Get Single Offer */
    $scope.GetSingleOffer = function(){
      $rootScope.local_load = true;
      offerService.getSingleOffer($stateParams.offer_uid, function(offer){
        $scope.offer = offer;
        if(!$scope.offer.comparisons[$stateParams.comparison_uid]){
          $rootScope.genService.showDefaultErrorMsg('Could not load');
          $rootScope.local_load = null;
          return
        }
        $scope.comparison = $scope.offer.comparisons[$stateParams.comparison_uid];
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMapping(comparison_criteria_mapping => {
        $scope.comparison_criteria_mapping = comparison_criteria_mapping.insurance_types;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Get All Insurance Types */
    $scope.GetAllInsuranceTypes = function(){
      $rootScope.local_load = true;
      $scope.insurance_types = [];
      metaService.getInsuranceTypes(function(insurance_types){
        for(var key in insurance_types){
          if(insurance_types[key].disabled){
            continue;
          }
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add or Remove Selected Insurance Type */
    $scope.AddOrRemoveInsuranceType = function(key){
      if($scope.selected_insurance_types[key]){
        delete $scope.selected_insurance_types[key]
      } else {
        $scope.selected_insurance_types[key] = {specific : false};
      }
      $scope.num_selected = Object.keys($scope.selected_insurance_types).length
      $scope.safeApply(fn => fn);
    }

    /* Save Modules */
    $scope.SaveModules = function() {
      Object.assign($scope.comparison.insurance_types, $scope.selected_insurance_types);
      offerService.saveComparison($stateParams.offer_uid, $stateParams.comparison_uid, $scope.comparison, () => {
        $rootScope.genService.showDefaultSuccessMsg($scope.num_selected + ' Modules Added');
        $state.go('comparisonpreview',{offer:$stateParams.offer_uid})
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetSingleOffer();
    $scope.GetAllInsuranceTypes();
    $scope.GetComparisonCriteriaMapping();

}
