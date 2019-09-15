// Angular Module
angular.module('application').controller('ExtractionsController', ExtractionsController);

// Injections
ExtractionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService', 'mandateService'];

// Function
function ExtractionsController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, mandateService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.policies = [];
    $scope.companies = {};

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

    /* Get All Extractions */
    $scope.GetAllPolicies = function(){
      $scope.policies = [];
      $scope.companies = {};
      $rootScope.local_load = true;
      mandateService.getAllMandates(function(mandates){
        companyService.getAllCompanies(function(all_companies){
          policyService.getPoliciesWithFilter('status', 'pending', function(policies){
            $scope.companies = all_companies;
            for(var key in policies){
              if(!all_companies[policies[key].company]){
                continue;
              }
              if(all_companies[policies[key].company].policies && all_companies[policies[key].company].policies[key] !== true){
                continue
              }
              $scope.policies.push({key : key, policy : policies[key], owner: policies[key].company, owner_name:all_companies[policies[key].company].name});
            }
            $rootScope.local_load = null;
            $scope.safeApply(fn => fn);
          }, function(error){
            $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
            console.log(error.message);
          });
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
          console.log(error.message);
        });
      },function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Get Single Policy Information */
    $scope.GetSinglePolicyInformation = function(){
      console.log('Getting information for policy:',$scope.selected_policy_key);
      policyService.getSinglePolicy($scope.selected_company, $scope.selected_policy_key, function(policy){
        $scope.selected_policy = policy;
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Single Company Information */
    $scope.GetSingleCompanyInformation = function(company){
      console.log("Company:",company);
      $scope.company = company;
    }

    /* Download Policy */
  	$scope.DownloadPolicy = function(policy){
  		console.info('Downloading Policy: ',policy);
  		fileService.downloadSinglePolicy(policy.file, function(url_for_download){
  			var a = document.createElement('a');
        		a.href = url_for_download;
        		a.download = 'document_name';
        		a.target = '_self';
        		a.click();
  		}).catch(function(error){
  			// Do Something with the error
  		});
  	}

    /* Init Extract */
    $scope.InitExtract = function(){
      $scope.extracting = true;
    }

    /* open the selected extraction */
    $scope.openExtraction = function(policyObj){
      /* if the policy version is 2 , then redirect to the extraction preview page */
      if(policyObj.policy.display_version && policyObj.policy.display_version == 2){
        $state.go("extractionpreview",{"policy": policyObj.key});
      }
      else{
        $state.go("extraction",{"policy":policyObj.key, "company":policyObj.owner});
      }
    }

    /* Go Back */
    $scope.GoBack = function(){
      $scope.selected_policy = null;
      $scope.selected_policy_key = null;
      $scope.selected_company = null;
      $scope.extracting = null;

    }

    /* Call On Controller Load */
    $scope.GetAllPolicies();
}
