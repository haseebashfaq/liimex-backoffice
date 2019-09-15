// Angular Module
angular.module('application').controller('CodesController', CodesController);

// Injections
CodesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function CodesController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

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

    /* Add Blank Code */
    $scope.AddBlankCode = function(){
      metaService.addIndustryCode(function(){
        $rootScope.genService.showDefaultSuccessMsg('Code Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Codes */
    $scope.GetAllCodes = function(){
      $rootScope.local_load = true;
      metaService.getIndustryCodes(function(codes){
        const codesArr = [];
        for(let key in codes) {
          if (codes.hasOwnProperty(key)) {
            codesArr.push({key: key, code: codes[key]});
          }
        }

        $scope.codes = codesArr.sort((code1, code2) => {
          const val1 = (code1.code.code || '0') + ''; //We sometimes get "undefined" here, so default to zero
          const val2 = (code2.code.code || '0') + '';
          const split1 = val1.split('.');
          const split2 = val2.split('.');

          let res = 0, pos = -1;
          while(res === 0) {
            pos++;
            if (pos > split1.length - 1 && pos > split2.length - 1) break; //For some reason, the codes are equal
            const num1 = Number(split1[pos]) || 0; //Force typecast and default with zero, if this level is missing
            const num2 = Number(split2[pos]) || 0;
            if (num1 === num2) continue; //On this level the codes are equal, we need to go deeper
            res = (num1 < num2) ? -1 : 1; //Found the difference.
          }
          return res;
        });
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    };

    /* On Controller Load */
    $scope.GetAllCodes();

}
