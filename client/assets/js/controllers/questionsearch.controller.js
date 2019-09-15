// Angular Module
angular.module('application').controller('QuestionSearchController', QuestionSearchController);

// Injections
QuestionSearchController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function QuestionSearchController($rootScope, $scope, $stateParams, $state, $controller, companyService, insuranceQuestionsService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.question_type = $stateParams.question_type;
    let allowed_types = new Set();
    allowed_types.add('all');
    allowed_types.add('general')
    allowed_types.add('specific')
    allowed_types.add('confirmatory')


    if(!allowed_types.has($stateParams.question_type)){
      $state.go('questionsearch', {question_type:'all'});
    }

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

    /* Add New Question */
    $scope.AddNewQuestion = function(){
      insuranceQuestionsService.addNewQuestion( result => {
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.go('questioneditor', {question_uid:result.key});
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }


    /* Remap Insurance Mapping */
    RemapInsuranceMapping = function(mapping){
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
    }

    /* Get Question Mapping */
    GetQuestionMapping = function(){
      metaService.getAllQuestionMapping(question_mapping => {
        RemapInsuranceMapping(question_mapping);
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

    /* Call On Controller Load */
    $scope.GetAllQuestions();
    GetQuestionMapping();
    GetInsuranceTypes();
}
