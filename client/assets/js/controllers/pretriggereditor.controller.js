// Angular Module
angular.module('application').controller('PretriggerEditorController', PretriggerEditorController);

// Injections
PretriggerEditorController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function PretriggerEditorController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.question_uid = $stateParams.question_uid;
    $scope.product_uid = $stateParams.product_uid;
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
        $scope.question = question;
        if($scope.question.input_type === 'bool'){
          $scope.trigger.on = $scope.trigger.on.toString();
        }

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

    /* Get the information about product */
    GetProductInfo = function(){
      metaService.getSingleProduct($scope.product_uid, product => {
        $scope.product = product;
        $scope.trigger = product.pre_triggers.questions[$stateParams.question_uid].trigger;
        DownloadQuestion();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Save Product Question Threshold */
    $scope.SaveProductQuestionThreshold = function(){
      if(!$scope.trigger) {return}

      if($scope.trigger.on === 'false'){
        $scope.trigger.on = false;
        $scope.trigger.condition = '=='
      }

      if($scope.trigger.on === 'true'){
        $scope.trigger.on = true;
        $scope.trigger.condition = '=='
      }

      if($scope.trigger.on === 'no_threshold'){
        $scope.trigger.condition = 'no_threshold'
      }

      if($scope.trigger.condition === 'no_threshold'){
        $scope.trigger.on = 'no_threshold'
      }
      metaService.savePretriggerQuestion($scope.product_uid, $scope.question_uid, $scope.trigger, () => {
        $state.reload()
        $rootScope.genService.showDefaultSuccessMsg('Trigger Saved');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Condition for no threshold value field */
    $scope.NoThresholdTrigger = function(nothreshold_trigger_condition){
      if($scope.question.input_type !== 'bool'){
        if($scope.trigger.condition !== 'no_threshold' && $scope.trigger.on === 'no_threshold'|| $scope.trigger.on === false){
          $scope.trigger.on = $scope.question.input_type === 'currency' ? 0 : $scope.trigger.on;
          $scope.trigger.on = $scope.question.input_type === 'number' ? 0 :   $scope.trigger.on;
        }
      }
      if($scope.trigger.condition === 'no_threshold'){
        $scope.trigger.on = 'no_threshold'
      }
      $scope.safeApply(fn => fn)
    }

    /*redirect to insurance questions page*/
    $scope.back = function(){
        window.history.back();
    }

    /* Unsaved Changes*/
    $scope.UnsavedChanges = function(){
      $scope.unsaved_changes = true;
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetMetaInformation();
    GetProductInfo();
}
