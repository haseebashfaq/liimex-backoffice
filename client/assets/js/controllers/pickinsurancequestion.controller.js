// Angular Module
angular.module('application').controller('PickinsuranceQuestionController', PickinsuranceQuestionController);

// Injections
PickinsuranceQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'insuranceQuestionsService', 'metaService'];

// Function
function PickinsuranceQuestionController($rootScope, $scope, $stateParams, $state, $controller,  insuranceQuestionsService, metaService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  $scope.selectedQuestionsList = {};
  $scope.selectedQuestionsList.set = new Set();
  $scope.selectedQuestion;
  $scope.selected_question;
  $scope.insurance_type = $stateParams.insuranceType;

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

  /*add question to the selected insurence*/
  $scope.addQuestionToInsurence = function(){
    var selectedQuestionObj = JSON.parse($scope.selectedQuestion);
    $scope.selectedQuestionsList.set.add(selectedQuestionObj);
    $scope.selectedQuestionsList.arr = Array.from( $scope.selectedQuestionsList.set);
  }

  /*user cannot find needed question, redirect to add new questions page*/
  $scope.addNewQuestions = function(){
    $state.go('questionsearch',{question_type:'specific'});
  }

  /*redirect to insurance questions page*/
  $scope.back = function(){
    $state.go('insurancequestions');
  }

  /*save selected question as main questions for current insurance type*/
  $scope.save = function(){
    $scope.selectedQuestionsList.arr.forEach((_selectedQuestion)=>{
      var selectedQuestion = _selectedQuestion.question;
      if(!selectedQuestion.mappings)
        selectedQuestion.mappings = {};
      selectedQuestion.mappings[$scope.insurance_type] = {"children":false};
      insuranceQuestionsService.updateQuestion(_selectedQuestion.key, selectedQuestion);
    });
  }

  /* Get All Questions */
  function GetAllInsuranceSpecificQuestions (){
    $rootScope.local_load = true;
    console.log('Getting Questions..');
    insuranceQuestionsService.getAllInsuranceQuestions(function(questions){
      $scope.questions = {};
      for(var key in questions){
        if((questions[key].question_type === 'specific' && $stateParams.insuranceType !== 'confirmatory' && $stateParams.insuranceType !== 'general') || (questions[key].question_type === 'general' && $stateParams.insuranceType === 'general') || (questions[key].question_type === 'confirmatory' && $stateParams.insuranceType === 'confirmatory')){
          if(!$scope.questions_map || !$scope.questions_map[key]){
            $scope.questions[key] = questions[key];
          }
        }
      }
      $rootScope.local_load = false;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
      console.error(error.message);
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

  /* Selector Change */
  $scope.selectorChange = function(){

  }

  /* Add Question to Mapping */
  $scope.AddQuestionToMapping = function() {
    if(!$scope.selected_question_key) { return }
    metaService.editQuestionMapping($scope.insurance_type, $scope.selected_question_key, { children : false, order:parseInt($scope.questions_map_length) }, result => {
      $rootScope.genService.showDefaultSuccessMsg('New Question Added');
      $state.go('insurancequestions', {insuranceType:$scope.insurance_type});
    }, error => {
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
      console.error(error.message);
    });
  }

  /* Get Question Mapping */
  GetQuestionMapping = function(){
    metaService.getQuestionMappingForInsuranceType($stateParams.insuranceType, question_mapping => {
      $scope.questions_map = question_mapping;
      if($scope.questions_map){
        $scope.questions_map_length = parseInt(Object.keys(question_mapping).length) + 1
      } else {
        $scope.questions_map_length = 1;
      }

      console.log('ORDER:',$scope.questions_map_length);
      GetAllInsuranceSpecificQuestions();
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }

  GetMetaInformation();
  GetQuestionMapping();
}
