// Angular Module
angular.module('application').controller('UpdateaddressController', UpdateaddressController);

// Injections
UpdateaddressController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService'];

// Function
function UpdateaddressController($rootScope, $scope, $stateParams, $state, $controller,companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* local variables */
    $scope.company_id = $stateParams.company_id;
    $scope.addresses =[];

    $scope.safeApply = function(fn) {
        if(!this.$root){
            return;
        }
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    function getCompanyAddress(){
        $rootScope.local_load = true;
        companyService.getCompanyAddress($scope.company_id,addresses=>{
            $rootScope.local_load = null;
            for(addressKey in addresses){
                if(addresses[addressKey].main === true){
                    $scope.main_address = addresses[addressKey];
                    $scope.main_address_key = addressKey;
                } else {
                    $scope.addresses.push(addresses[addressKey]);
                }
            }
            $scope.safeApply(fn => fn)
        },error=>{
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
        });
    }

    $scope.saveAddress = function(){
        $rootScope.local_load = true;
        companyService.updateAddress($scope.main_address_key,$scope.main_address,()=>{
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultSuccessMsg('Address updated!');
            $state.go("company",{company:$scope.company_id});
        });
    }


    function getCompanyDetails(){
        companyService.getCompanyInformation($scope.company_id,company=>{
            $rootScope.local_load = null;
            $scope.company = company;
            $scope.safeApply(fn => fn)
        },error=>{
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
        });
    }

    getCompanyAddress();
    getCompanyDetails();

}
