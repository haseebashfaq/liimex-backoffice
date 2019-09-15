// Angular Module
angular.module('application').controller('ProductQuestionPickerController', ProductQuestionPickerController);

// Injections
ProductQuestionPickerController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function ProductQuestionPickerController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.product_uid = $stateParams.product_uid;
    $scope.pre_trigger = $stateParams.pre_trigger === 'true';
    $scope.linkedData = {};
    $scope.isLinked = {};

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

    /* Get All Specific Questions */
    function GetAllInsuranceSpecificQuestions (){
      $rootScope.local_load = true;
      metaService.getAllInsuranceQuestions(function(questions){
        $scope.questions = {};
        for(var key in questions){
          if(!$scope.pre_trigger && questions[key].question_type === 'specific'){
            $scope.questions[key] = questions[key];
          } else if($scope.pre_trigger && questions[key].question_type === 'general'){
            $scope.questions[key] = questions[key];
          }
        }
        $rootScope.local_load = false;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.error(error.message);
        $rootScope.local_load = false;
      });
    }

    /* Get the information about product from firebase */
    GetProductInfo = function(){
        metaService.getSingleProduct($scope.product_uid, productInfo => {
            $scope.nameOfProduct = productInfo.name;
            $scope.isProduct = $scope.product_uid;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
        insuranceQuestionsService.getAllMetaInformation(meta => {
          $scope.meta = {};
          $scope.meta.input_types = meta.input_type_enum;
          $scope.meta.question_types = meta.question_type_enum;
          $scope.meta.account_page_status = meta.account_page_status;
        }, error => {
          console.error(error);
        });
    }

    /* when user cannot find needed question, redirect to add new questions page */
    $scope.addNewQuestions = function(){
        $state.go('questionsearch',{question_type:'specific'});
    }

    /*redirect to insurance questions page*/
    $scope.back = function(){
        $state.go('product', {product_uid:$stateParams.product_uid});
    }

    /* Save Linked Product Question */
    $scope.SaveLinkedProductQuestion = function(){
        if(!$scope.selected_question_key) { return }
        $scope.linkedData.questions = $scope.selected_question_key;
        metaService.saveLinkedProductQuestion($scope.product_uid, $scope.selected_question_key, Number($scope.questions_map_length), () => {
            window.history.back();
            $rootScope.genService.showDefaultSuccessMsg('This question has been linked to the product');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Save As Pretrigger Questions */
    $scope.SaveAsPretriggerQuestion = function(){
      metaService.addPretriggerToQuestion($scope.product_uid, $scope.selected_question_key, () => {
        $rootScope.genService.showDefaultSuccessMsg('Question added to Product')
        $state.reload()
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Save */
    $scope.Save = function(){
      if($scope.pre_trigger === true){
        $scope.SaveAsPretriggerQuestion();
      } else {
        $scope.SaveLinkedProductQuestion();
      }
    }

    /* Check if the question is already linked */
    function GetLinkedProductQuestion(){
      metaService.getLinkedProductQuestion($scope.product_uid, function(linkedProductQuestion){
        for(var linked_product_question in linkedProductQuestion) {
          $scope.isLinked[linked_product_question] = linked_product_question;
        }
        if($scope.isLinked){
          $scope.questions_map_length = parseInt(Object.keys($scope.isLinked).length) + 1
        } else {
          $scope.questions_map_length = 1
        }
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetAllInsuranceSpecificQuestions();
    GetMetaInformation();
    GetLinkedProductQuestion();
    GetProductInfo();
}
