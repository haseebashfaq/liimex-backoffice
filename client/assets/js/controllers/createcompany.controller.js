// Angular Module
angular.module('application').controller('CreateCompanyController', CreateCompanyController);

// Injections
CreateCompanyController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','requestService', 'companyService'];

// Function
function CreateCompanyController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,requestService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    let userid = $stateParams.userid;
    let userrequestid = $stateParams.userrequestid;

    let compId;
    let addressId;
    let userRequestObj = {};
    let existingUser = false;
    let userObj = {};
    $scope.company = {}
    $scope.address = {}
    $scope.new_user = {};

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

    $scope.saveCompany = function(user_form, company_form){
      if($rootScope.local_load || $scope.preexisting) {return}
      console.log('Saving Company..');
      $rootScope.local_load = true;
        if(!user_form.$valid || !company_form.$valid || $scope.preexisting) {return}
        userrequestService.updateUserAndCompany(userrequestid, userid, $scope.new_user, $scope.company, $scope.address, (data, company_uid, address_uid) =>{
          $rootScope.genService.showDefaultSuccessMsg('User and Company Added');
          $scope.company_uid = company_uid;
          $scope.address_uid = address_uid;
          $scope.selectIndustry(true);
          $rootScope.local_load = null;
        }, error => {
          console.error(error);
          $rootScope.local_load = null;
        }, compId, addressId);
    }

    $scope.selectIndustry = function(overwrite){
        if(!$scope.preexisting && !overwrite) {return}
        compId = compId || $scope.company_uid;
        if(!compId){
          $rootScope.genService.showDefaultErrorMsg('Could not find company id');
          return;
        }
        console.log('Going to Industry Selector..');
        $state.go("selectindustry",{"company_id" : compId});
    }

    function getUserObj(){
      $rootScope.local_load = true;
      userrequestService.getUserObj(userid,data=>{
          /* user already exists get also the company information */
          $rootScope.local_load = null;
          if(data){
              getCompanyObj(data);
              $scope.new_user = data;
          }
          else{
              userrequestService.getUserRequest(userrequestid,data =>{
                  $scope.user_request = data;
                  $scope.new_user.email = data.email;
                  $scope.safeApply(fn => fn);
              }, err=>err);
          }
      },error=>{
          Console.log("error",error);
          $rootScope.local_load = null;
      });
    }

    function getCompanyObj(){
        let company ={};
        $rootScope.local_load = true;
        userrequestService.getCompanyFromUserid(userid, (companyData, companyKey, addressData, addressKey ) => {
            $scope.company = companyData;
            $scope.address = addressData;
            compId = companyKey;
            addressId = addressKey;
            $rootScope.local_load = null;
            if(companyData && companyData.liimex_id){
              $scope.preexisting = true;
            }
            $scope.safeApply(fn => fn);
        }, error => {
          console.error(error)
          $rootScope.genService.showDefaultErrorMsg('Something went wrong');
          $rootScope.local_load = null;
          $scope.safeApply(fn => fn);
        });
    }

    getUserObj();
}
