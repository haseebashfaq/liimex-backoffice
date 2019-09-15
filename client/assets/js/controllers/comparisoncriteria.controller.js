// Angular Module
angular.module('application').controller('ComparisonCriteriaController', ComparisonCriteriaController);

// Injections
ComparisonCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriaController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
    
    let comparisoncriteria_id = $stateParams.comparisoncriteria_id;
    $scope.criteria = {};
    $scope.showWarningMessage = false;
    
    /* Get All Policy Types */
    $scope.GetComparisonCriteria = function(){
        $rootScope.local_load = true;
        if(comparisoncriteria_id)
            metaService.getSinglecomparisonCriteria(comparisoncriteria_id,(comparisonCriteria)=>{
            $scope.criteria = comparisonCriteria;
            $rootScope.local_load = null;
            $scope.$apply();
        },function(error){
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }
    
    $scope.saveCriteria = function(){
        if(!$scope.criteria.explanation_text_de || !$scope.criteria.explanation_text_en || !$scope.criteria.name_de||!$scope.criteria.name_en){
            $scope.showWarningMessage = true;
            return;
        }
        $scope.showWarningMessage = false;
        if(comparisoncriteria_id){
            metaService.saveComparisonCriteria(comparisoncriteria_id,$scope.criteria,()=>{
                $rootScope.genService.showDefaultSuccessMsg('criteria details updated');
            },(error)=>{
                $rootScope.genService.showDefaultErrorMsg('error while criteria update');
                console.log("error while criteria update",error);
            });
        }
        else{
            metaService.addComparisonCriteria($scope.criteria,()=>{
                $rootScope.genService.showDefaultSuccessMsg('new criteria added');
            },(error)=>{
                $rootScope.genService.showDefaultErrorMsg('error while adding new criteria');
                console.log("error while adding new criteria",error);
            });
        }
    }
    
    $scope.back = function(){
        $state.go("comparisoncriterias",{},{reload:true});
    }
    
    /* On Controller Load */
    $scope.GetComparisonCriteria();
    
}
