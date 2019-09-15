// Angular Module
angular.module('application').controller('QuestionEditController', QuestionEditController);

// Injections
QuestionEditController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function QuestionEditController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));




    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////
    $scope.question_uid = $stateParams.question_uid;


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
    $scope.easyApply = function(){
      $scope.safeApply(fn => fn);
    };

    /* Download Question */
    DownloadQuestion = function(){
      insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.question_uid, question => {
        question.account_page_status = question.account_page_status || 'hide';
        $scope.question = question;
        $scope.safeApply(fn => fn)
      }, error => {
        console.error(error);
      });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
      insuranceQuestionsService.getAllMetaInformation(meta => {
        $scope.meta = {};
        $scope.meta.input_types = meta.input_type_enum;
        $scope.meta.question_types = meta.question_type_enum;
        $scope.meta.account_page_status = meta.account_page_status;
        $scope.meta.future_dates = meta.future_dates;
      }, error => {
        console.error(error);
      });
    }

    /* Save Question */
    $scope.SaveQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, $scope.question, () => {
        $rootScope.genService.showDefaultSuccessMsg('Saved')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Delete Question */
    $scope.DeleteQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.deleteQuestion($stateParams.question_uid, () => {
        $rootScope.genService.showDefaultSuccessMsg('Deleted')
        $state.go('questionsearch');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Disable Question */
    $scope.DisableQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, {disabled : true}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Disabled')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Activate Question */
    $scope.ActivateQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, {disabled : false}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Activated')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Get All Questions */
    $scope.GetAllQuestions = function(){
      $rootScope.local_load = true;
      console.log('Getting Questions..');
      insuranceQuestionsService.getAllInsuranceQuestions(function(questions){
        $scope.questions = []
        for(var key in questions){
          let qt = $stateParams.question_type;
          if(qt === questions[key].question_type || qt === 'all'){
            $scope.questions.push({key:key, question:questions[key]});
          }
        }
        $rootScope.local_load = false;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
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

    /* Get Question Mapping */
    GetQuestionMapping = function(callback){
      metaService.getAllQuestionMapping(question_mapping => {
        RemapInsuranceMapping(question_mapping, callback);
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
      });
    }

    /* Get all Insurance Types */
    GetInsuranceTypes = function(){
      $rootScope.local_load = true;
      $scope.insurance_types = {};
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types
        $scope.insurance_types['general'] = {name_de : 'General'}
        $scope.insurance_types['confirmatory'] = {name_de : 'Confirmatory'}
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Display Delete Question button */
    $scope.displayDeleteBtn = function(questionmapping_element) {
      for(var element in questionmapping_element){
        if(questionmapping_element[element].has($scope.question_uid)) {
          return true;
        } 
      }
      return false;
    }

    /* Confirm Delete Question if not used anywhere */
    $scope.ConfirmDeleteQuestion = function(){
      console.log('Attempding delete')
      if(!$scope.question) {return}
      GetQuestionMapping(() => {
        for(var question_element in $scope.question_mapping){
          if($scope.question_mapping[question_element].has($scope.question_uid)) {
            console.log('Delete denied')
            return false; // it will simply return false and won't delete the question
          } 
        }
        insuranceQuestionsService.deleteQuestion($stateParams.question_uid, () => {
          $rootScope.genService.showDefaultSuccessMsg('Question Deleted')
          $state.go('questionsearch');
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message)
        });
        console.log('Delete Approved')
      });
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////
    GetMetaInformation();
    DownloadQuestion();
    GetQuestionMapping();
    GetInsuranceTypes();
    $scope.GetAllQuestions();
}
