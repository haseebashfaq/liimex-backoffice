// Angular Module
angular.module('application').controller('ProductQuestionController', ProductQuestionController);

// Injections
ProductQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function ProductQuestionController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.question_uid = $stateParams.question_uid;
    $scope.product_uid = $stateParams.product_uid;
    $scope.child_question_uid = $stateParams.child_question_uid;
    $scope.trigger = {};

    /////////////////////////////
    /*        Functions        */
    /////////////////////////////



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

    /* Easy Apply */
    //   $scope.easyApply = function(){
    //   $scope.safeApply(fn => fn);
    // };

    /* Download Question */
    DownloadQuestion = function(){
        insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.question_uid, question => {
            if(question.input_type !== 'bool'){
                if($scope.trigger.on === 'no_threshold' || $scope.trigger.on === 'false'){
                    $scope.trigger.on  = question.input_type === 'currency' && 0;
                    $scope.trigger.on  = question.input_type === 'number' && 0;
                }
            }
            question.account_page_status = question.account_page_status || 'hide';
            $scope.question = question;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
        });
    }

    /* Download Sub Question */
    DownloadSubQuestion = function(){
        insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.child_question_uid, subquestion => {
            // if(question.input_type !== 'bool'){
            //     if($scope.trigger.on === 'no_threshold' || $scope.trigger.on === 'false'){
            //         $scope.trigger.on  = question.input_type === 'currency' && 0;
            //         $scope.trigger.on  = question.input_type === 'number' && 0;
            //     }
            // }
            subquestion.account_page_status = subquestion.account_page_status || 'hide';
            $scope.subquestion = subquestion;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
        });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
        metaService.getAllProductMetaInformation(meta => {
            $scope.meta = {};
            $scope.meta.product_input_type_enum = meta.product_input_type_enum;
            $scope.meta.product_trigger_conditions = meta.product_trigger_conditions;
            $scope.meta.product_boolean_answers = meta.product_boolean_answers;
        }, error => {
            console.error(error);
        });
    }

    /* Remap Insurance Mapping */
    RemapInsuranceMapping = function(mapping, callback){
        $scope.question_mapping = {};
        for(var key in mapping){
            let questions = mapping[key].questions;
            $scope.question_mapping[key] = new Set();
            for(var q_uid in questions){
                $scope.question_mapping[key].add(q_uid)
                for(var c_uid in questions[q_uid].children){
                    $scope.question_mapping[key].add(c_uid)
                }
            }
        }
        if(callback){
            console.log('Mapping Updated');
            callback();
        }
    }

    /* Get the information about product from firebase */
    GetProductInfo = function(){
        metaService.getSingleProduct($scope.product_uid, productInfo => {
            $scope.nameOfProduct = productInfo.name;
            $scope.isProduct = $scope.product_uid;
               // $scope.safeApply(fn => fn)
           }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get the trigger for product questions */
    GetTriggerForProductQuestion = function(){
        metaService.getTriggersForProductQuestion($scope.product_uid, $scope.question_uid, trigger => {
            for(var product_trigger_condition in trigger) {
                $scope.trigger = trigger.knockout_trigger;
                if($scope.trigger.on===true) {
                    $scope.trigger.on = "true";
                } else if($scope.trigger.on===false) {
                    $scope.trigger.on = "false";
                }
            }
            $scope.NoThresholdTrigger($scope.trigger.condition);
            DownloadQuestion();
            //$scope.safeApply(fn => fn);
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get the trigger for product sub questions */
    GetTriggerForProductSubQuestion = function(){
        metaService.getTriggersForProductSubQuestion($scope.product_uid, $scope.question_uid, $scope.child_question_uid, subqs_trigger => {
            for(var product_trigger_condition in subqs_trigger) {
                $scope.subqs_trigger = subqs_trigger.knockout_trigger;
                if($scope.subqs_trigger.on===true) {
                    $scope.subqs_trigger.on = "true";
                } else if($scope.subqs_trigger.on===false) {
                    $scope.subqs_trigger.on = "false";
                }

            }
            $scope.NoThresholdTrigger($scope.subqs_trigger.condition);
            DownloadQuestion();
            //$scope.safeApply(fn => fn);
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Save Product Question Threshold */
    $scope.SaveProductQuestionThreshold = function(){
        if(!$scope.trigger) {return}
        if($scope.trigger.on == "true"){
            $scope.trigger.on = true;
            $scope.trigger.condition = '==';
        } else if($scope.trigger.on == "false"){
            $scope.trigger.on = false;
            $scope.trigger.condition = '==';
        }
        if($scope.trigger.on == "no_threshold"){
            $scope.trigger.condition = "no_threshold";
        } else if($scope.trigger.condition == "no_threshold"){
            $scope.trigger.on = "no_threshold";
        }

        if($scope.trigger.condition == "<>"){
          $scope.trigger.on = 0;
        }
        metaService.saveTriggersForProductQuestion($scope.product_uid, $scope.question_uid, $scope.trigger, () => {
            $state.reload()
            $rootScope.genService.showDefaultSuccessMsg('Instant Threshold Saved');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Save Product Sub Question Threshold */
    $scope.SaveProductSubQuestionThreshold = function(){
        if(!$scope.subqs_trigger) {return}
        if($scope.subqs_trigger.on == "true"){
            $scope.subqs_trigger.on = true;
            $scope.subqs_trigger.condition = '==';
        } else if($scope.subqs_trigger.on == "false"){
            $scope.subqs_trigger.on = false;
            $scope.subqs_trigger.condition = '==';
        }
        if($scope.subqs_trigger.on == "no_threshold"){
            $scope.subqs_trigger.condition = "no_threshold";
        } else if($scope.subqs_trigger.condition == "no_threshold"){
            $scope.subqs_trigger.on = "no_threshold";
        }
        metaService.saveTriggersForProductSubQuestion($scope.product_uid, $scope.question_uid, $scope.child_question_uid, $scope.subqs_trigger, () => {
            $state.reload()
            $rootScope.genService.showDefaultSuccessMsg('Instant Threshold Saved');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Condition for no threshold value field */
    $scope.NoThresholdTrigger = function(nothreshold_trigger_condition){
      if(nothreshold_trigger_condition == 'no_threshold'){
        $scope.hide_value = true;
          //$scope.trigger.on = 0;
      } else {
        $scope.hide_value = false;
      }
      $scope.safeApply(fn => fn)
    }


    /*redirect to insurance questions page*/
    $scope.back = function(){
        window.history.back();
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetMetaInformation();
    GetTriggerForProductQuestion();
    GetProductInfo();
    DownloadSubQuestion();

    if($scope.child_question_uid){
        GetTriggerForProductSubQuestion();
    }
}
