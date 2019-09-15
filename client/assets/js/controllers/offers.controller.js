// Angular Module
angular.module('application').controller('OffersController', OffersController);

// Injections
OffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService'];

// Function
function OffersController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /* Get All Requested Offers */
    $scope.GetAllRequestedOffers = function(){
      $scope.offers = [];
      $rootScope.local_load = true;
      companyService.getAllCompanies(function(companies){
        offerService.getOfferRequests(function(offers){
          for(let key in offers){
            if(companies[offers[key].company]) {
              $scope.offers.push({key:key, offer:offers[key], company:companies[offers[key].company].name});
            }
          }
          $rootScope.local_load = null;
          $scope.$apply();
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
        })
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    };

    /* On Controller Load */
    $scope.GetAllRequestedOffers();

  $scope.openOffer = function(offerObj) {
    console.log('offerObj.offer.display_version', offerObj.offer.display_version, offerObj.offer.display_version == 2);
    if (offerObj.offer.display_version == 2) {
      $state.go("comparisonpreview", {"offer":offerObj.key});
    }
    else{
      $state.go("offer",{"offer":offerObj.key});
    }
  };

    metaService.getInsuranceTypes(function (insurance_types) {
      $scope.insurance_types = insurance_types;
    });

}
