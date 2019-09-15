// Angular Module
angular.module('application').controller('FinfoController', FinfoController);

// Injections
FinfoController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'finfoService', 'FoundationApi'];

// Function
function FinfoController($rootScope, $scope, $stateParams, $state, $controller, firebase, finfoService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
    $scope.info_blocks = {}
    $scope.just_updated = false;
    $scope.selected_info_block;

    /* Get My Required Information */
    $scope.GetMyRequiredInformation = function(forms){
        console.info('Getting Company Info');
        var filled = [];
        var not_filled = [];
        finfoService.getCompanyInfoBlocks(function(blocks){
            block_loop: // Loop is ID'd for contunie purposes
            for(var block_key in blocks){
                var tmp_block = blocks[block_key];
                var data_points = tmp_block.data;
                tmp_parent = {block:tmp_block, name: block_key};
                for(var key in data_points){
                    if(!data_points[key].value){
                        tmp_parent.status = 'not_filled';
                        not_filled.push(tmp_parent);
                        continue block_loop;
                        break;
                    }
                }
                tmp_parent.status = 'filled';
                filled.push(tmp_parent);
            }
            $scope.info_blocks.filled = filled;
            $scope.info_blocks.not_filled = not_filled;
            try{
              $scope.$apply();
            } catch(e){

            }
        },function(){

        });
    }

    /* Select Info Block */
    $scope.SelectInfoBlock = function(parent){
        $scope.selected_info_block = parent;
        $scope.just_updated = false;
    }

    /* Call these functions on controller load */
    $scope.GetMyRequiredInformation();

    /******************************/
    /**     Modal Functions      **/
    /******************************/

    /* Save information */
    $scope.SaveInformation = function(parent, form){
        if(!form.$valid){ return; }
        finfoService.updateInformationForCompany(parent.name, parent.block, function(){
            $scope.GetMyRequiredInformation();
            $scope.just_updated = true;
            document.getElementById('close_info').click();
            $rootScope.genService.showDefaultSuccessMsg('Information Updated');
        });
    }

}
