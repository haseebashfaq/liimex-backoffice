// Angular Module
angular.module('application').controller('AllOffersController', AllOffersController);

// Injections
AllOffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService'];

// Function
function AllOffersController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Setting Offer Status */
    $scope.offer_status = $stateParams.status;
    $rootScope.offer_status = $scope.offer_status;

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

    /* Get All Requested Offers */
    $scope.GetAllOffers = function(){
      $scope.offers = [];
      $rootScope.local_load = true;
      offerService.getAllOffers(function(offers){
        for(var key in offers){
          if(offers[key].status !== $scope.offer_status){
            continue;
          }
          $scope.offers.push({key:key, offer:offers[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    }

    /* Get All Companies */
    $scope.GetAllCompanies = function(){
      companyService.getAllCompanies(function(companies){
        $scope.companies = companies;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    }

  $scope.openOffer = function(offerObj) {
    if (offerObj.offer.display_version == 2) {
      $state.go("comparisonpreview", {"offer":offerObj.key});
    }
    else{
      $state.go("offer",{"offer":offerObj.key});
    }
  };

    /* On Controller Load */
    $scope.GetAllOffers();
    $scope.GetAllCompanies();

}
