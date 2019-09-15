// Angular Module
angular.module('application').controller('GetOffersController', GetOffersController);

// Injections
GetOffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','companyService','recommendationService','genService'];

// Function
function GetOffersController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService,companyService,recommendationService, genService ) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    var companyid = $stateParams.companyid;
    var weighted_recommendedInsurance = {};

    $scope.weighted_insurance_types = {};
    $scope.weighted_insurance_types.essential = [];
    $scope.weighted_insurance_types.additional = [];
    $scope.weighted_insurance_types.others = [];
    $scope.insurance_types = {};

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
    }

    /* Get Company Information */
    $scope.GetCompanyInformation = function() {
      companyService.getCompanyInformation($stateParams.companyid, function(company){
        $scope.company = company;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'getoffer','error',()=>{},()=>{})
      });
    }

    /* set weights for recommended insurances */
    function setWeightsForRecommendedInsurance(){
      weighted_recommendedInsurance.essential = [];
      weighted_recommendedInsurance.additional = [];
      let seventyfiveAboveScores =[] , fiftyScores = [], twentyFiveScores=[], fiftyScoreslength = 0, seventyfiveAboveScoresLength =0;
      for(var index in $scope.recommendation){
        let score = $scope.recommendation[index].score;
        switch (score) {
          case 100:
          case 75:
            seventyfiveAboveScores.push(index);
            break;
          case 50:
            fiftyScores.push(index);
            break;
          case 25:
            twentyFiveScores.push(index);
            break;
          default:
            break;
        }
      }
      weighted_recommendedInsurance.essential.push(...seventyfiveAboveScores);
      weighted_recommendedInsurance.additional.push(...twentyFiveScores);

      fiftyScoreslength = fiftyScores.length;
      seventyfiveAboveScoresLength = seventyfiveAboveScores.length;

      if(seventyfiveAboveScoresLength + fiftyScoreslength <= 3)
        weighted_recommendedInsurance.essential.push(...fiftyScores);
      else
        weighted_recommendedInsurance.additional.push(...fiftyScores);
    }

    function getAllInsuranceTypes(){
      $rootScope.local_load = true;
      metaService.getInsuranceTypes(types => {
        $scope.insurance_types = types;
        $scope.weighted_insurance_types.essential = [];
        $scope.weighted_insurance_types.additional = [];
        $scope.weighted_insurance_types.others = [];
        for(var key in types){
          if(!$scope.recommendation[key]){
            continue;
          }
          if(weighted_recommendedInsurance.essential.indexOf(key) !== -1)
            $scope.weighted_insurance_types.essential.push({key:key, type:types[key], score:$scope.recommendation[key].score});
          else if(weighted_recommendedInsurance.additional.indexOf(key) !== -1)
            $scope.weighted_insurance_types.additional.push({key:key, type:types[key], score:$scope.recommendation[key].score});
          else
            $scope.weighted_insurance_types.others.push({key:key, type:types[key], score:$scope.recommendation[key].score});
        }
        $rootScope.local_load = null;
        $scope.safeApply(f => f);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.code);
        $rootScope.local_load = null;
        backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
      });
    }

    /* Get Recommendations */
    function GetRecommendations(){
      $rootScope.local_load = true;
      const index_of_recommended = 0;
      recommendationService.getRecommendationsForCompId(companyid,recommendation => {
        $scope.recommendation = recommendation.recommended;
        setWeightsForRecommendedInsurance();
        getAllInsuranceTypes();
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
      })
    }

    $scope.gotoQuestionaire =  function(){
        let selectedinsurances = [];
        for(key in $scope.insurance_types){
          if($scope.insurance_types[key].selected){
            selectedinsurances.push(key);
          }
        }

        if(selectedinsurances.length > 0){
          $state.go('questions',{'selectedinsurances': selectedinsurances,'companyid':companyid });
        }
        else {
          genService.showDefaultErrorMsg("Please select one or more insurance types");
        }
    }

    /* On Controller Load */
    GetRecommendations();
    $scope.GetCompanyInformation();
}
