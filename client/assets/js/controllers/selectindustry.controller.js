// Angular Module
angular.module('application').controller('SelectIndustryController', SelectIndustryController);

// Injections
SelectIndustryController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','companyService'];

// Function
function SelectIndustryController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* local variables */
    let company_id = $stateParams.company_id;
    let companyid = "";

    /* scope variables */
    $scope.picked_levels = {};
    $scope.picked_levels[1] = {};
    $scope.picked_levels[2] = {};
    $scope.picked_levels[3] = {};
    $scope.industry_set = new Set();
    $scope.cat_limit = 1;
    $scope.chosen = {};

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

    /* Get Industries */
    getIndustries = function(){
        $rootScope.local_load = true;
        metaService.getIndustryCodes(codes => {
            $scope.industries = [];
            $scope.top_levels = {};
            for(var key in codes){
                if(codes[key].level == 1){
                    $scope.top_levels[codes[key].code] = codes[key];
            }
            }
            for(var key in codes){
                $scope.industry_set.add(codes[key].code);
                var parentIndustryCode = String(codes[key].code).split('.')[0];;
                $scope.industries.push({key:key, code:codes[key], parent:$scope.top_levels[parentIndustryCode]});
            }
            getSelectedIndustries();
            $scope.safeApply(f=>f);
        }, error => {
            console.error(error);
            $rootScope.local_load = null;
        });
    }

    /* Refresh Model */
    $scope.RefreshModel = function(cat_num, models){
        for(var i in models){
            if($scope.picked_levels[cat_num][models[i]]){
                $scope.picked_levels[cat_num][models[i]] = null;
            }
        }
        $scope.unsaved = true;
        $scope.safeApply(fn => fn);
    }

    /* Submit Categories */
    $scope.submitIndustries = function(){
        $rootScope.local_load = true;
        if(!$scope.picked_levels[1][1]) return;
        cleanLevels();
        var industry_codes = [];
            outer_loop:
            for(var level in $scope.picked_levels){
                if(!$scope.picked_levels[level][1]){
                    continue outer_loop;
                }
                for(var cat = 4; cat>0; cat--){
                    if($scope.picked_levels[level][cat]){
                        industry_codes.push($scope.picked_levels[level][cat])
                        continue outer_loop;
                    }
                }
            }
        userrequestService.updateIndustryCodes(companyid, industry_codes, (data) => {
           console.log("Industry Codes Updated")
           $rootScope.genService.showDefaultSuccessMsg('Industry Codes Updated');
           $rootScope.local_load = null;
           $state.reload()
        }, error => {
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
            backofficeService.logpost(error,'','industry','error',()=>{},()=>{});
        });
    }

    /*Get industries if it's already previously selected*/
    function getSelectedIndustries(){
      $rootScope.local_load = true;
      companyService.getCompanyInformation($stateParams.company_id, company => {
        companyid = $stateParams.company_id;
        $scope.company = company;
        if(company.industry_codes){
          $scope.cat_limit = company.industry_codes.length;
          for(var i=1;i<=$scope.cat_limit;i++){
            var industry = getIndustryObjForIndustryCode(company.industry_codes[i-1]);
            if(!industry){
              $scope.outdated_indstries = true;
              $rootScope.local_load = null;
              $scope.safeApply(fn => fn)
              return;
            }
            $scope.chosen[i] = industry.code.code;
          }
          $scope.RebuildIndustries(company.industry_codes)
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      })
    }

    $scope.RebuildIndustries = function(industryCodesList){
        for(var i in industryCodesList){
            var code = industryCodesList[i];
            var split = code.split('.');
            var next = "";
            for(var number in split){
                next += next === "" ? split[number] : '.'+split[number]
                $scope.picked_levels[Number(i)+1][Number(number)+1] = next;
            }
        }
    }

    function getIndustryObjForIndustryCode(code){
        return $scope.industries.find(industry=> industry.code.code == code);
    }

    /* Remove Cat*/
    $scope.RemoveCat = function(){
        $scope.cat_limit = $scope.cat_limit-1;
        $scope.picked_levels[$scope.cat_limit+1] = null;
        $scope.unsaved = true;
    }

    function cleanLevels(){
        for(var level in $scope.picked_levels){
            if(level > $scope.cat_limit){
                $scope.picked_levels[level] = {};
            }
        }
    }

    $scope.pickActivity = function(){
        $state.go("pickactivity",{"company_id": $stateParams.company_id});
    }

    getIndustries();

}
