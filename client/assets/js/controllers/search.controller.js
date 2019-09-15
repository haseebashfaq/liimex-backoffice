// Angular Module
angular.module('application').controller('SearchController', SearchController);

// Injections
SearchController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService'];

// Function
function SearchController($rootScope, $scope, $stateParams, $state, $controller, companyService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.companies = []
    $scope.company_keys = {};

    /* Get All Users */
    $scope.GetAllCompanies = function(){
      $scope.companies = [];
      $scope.company_keys = {};
      $rootScope.local_load = true;

      console.log('Getting Companies..');
      companyService.getAllCompanies(function(companies){
        for(var key in companies){
          $scope.companies.push(companies[key]);
          $scope.company_keys[companies[key].liimex_id] = key;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Select User */
    $scope.SelectCompany = function(key, company){
      console.log('Selecting Company:',key, company);
    }

    /* Call On Controller Load */
    $scope.GetAllCompanies();
}
