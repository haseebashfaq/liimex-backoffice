// Angular Module
angular.module('application').controller('InsuranceQuestionsController', InsuranceQuestionsController);

// Injections
InsuranceQuestionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService', 'insuranceQuestionsService'];

// Function
function InsuranceQuestionsController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService, insuranceQuestionsService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  //TODO: What is this?
  var insuranceQuestionsList = [];


  /* Scope Variables */
  $scope.insurance_type = $stateParams.insuranceType || null;
  $rootScope.insurance_type = $scope.insurance_type;
  $scope.questions = []

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

  /* Get all Insurance Types */
  GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Change Insurance Type */
  $scope.ChangeInsuranceType = function(){
    $state.go('insurancequestions',{insuranceType: $scope.insurance_type});
  }

  /* Get and Append Children */
  function GetAndAppendChildren(mainQuestion){
		var children = mainQuestion.insuranceQuestionObj.mappings[$scope.insurance_type].children;
		var childrenArray = [];
		for(childIndex in children){
			var insuranceQuestionObj = {insuranceQuestionObj: children[childIndex],key: childIndex};
			childrenArray.push(insuranceQuestionObj);
		}
		mainQuestion.insuranceQuestionObj.mappings[$scope.insurance_type].children = childrenArray;
	}

  /* Get all Insurance Types */
  GetAllQuestions = function(){
    insuranceQuestionsService.getInsurenceMainQuestionForInsuranceId($scope.insurance_type,(_mainQuestions)=>{
			$scope.mainQuestionList = _mainQuestions;
			for(index in $scope.mainQuestionList){
				$scope.mainQuestionList[index].addAsSubQuestion = false;
				GetAndAppendChildren($scope.mainQuestionList[index]);
			}
			$scope.safeApply(fn => fn);
		},(error)=> console.log("error while fetching main insurance questions",error));
  }

  /* Insurence type is changed on the dropdown */
  $scope.selectInsurenceTypeChange =  function(){
    console.log("inside the selctor change", $scope.insurance_type);
    getInsurenceQuestion(insurenceTypeId);
  }

  /* Redirect to add_new_question_to_insurence */
  $scope.addQuestionToInsurence =function(){
    $state.go('pickinsurancequestion',{insuranceType: $scope.insurance_type, order:Object.keys($scope.question_mapping).length+1});
  }

  /* Get all questions for the insurence type */
  function getInsuranceQuestion(insuranceTypeId){
    insuranceQuestionsService.getInsuranceQuestion(insuranceTypeId);
  }

  /* Redirect to map questions to subquestion page */
  $scope.mapQuestions = function(){
    $state.go('mapinsurancequestions',{insuraneType: $scope.insurance_type});
  }

  /* Get Meta Information */
  GetMetaInformation = function(){
    insuranceQuestionsService.getAllMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.input_types = meta.input_type_enum;
      $scope.meta.question_types = meta.question_type_enum;
      $scope.meta.account_page_status = meta.account_page_status;
      $scope.meta.trigger_conditions = meta.trigger_conditions;
      $scope.meta.boolean_answers = meta.boolean_answers;
    }, error => {
      console.error(error);
    });
  }

  /* Get Single Question */
  GetSingleQuestion = function(question_uid){
    metaService.getSingleInsuranceQuestion(question_uid, question => {
      if(!question.order){
        $scope.order_undefined = false;
      }
      $scope.questions_dict[question_uid] = question;
      $scope.questions.push({key: question_uid, question : question});
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestion','error',()=>{},()=>{})
    });
  }

  /* Get Question Mapping */
  GetQuestionMapping = function(){
    metaService.getQuestionMappingForInsuranceType($stateParams.insuranceType, question_mapping => {
      $scope.question_mapping = question_mapping || {};
      $scope.questions = [];
      $scope.questions_from_map = [];
      $scope.questions_dict = {}
      for(var key in question_mapping){
        $scope.questions_from_map.push({key:key, question:question_mapping[key]});
        GetSingleQuestion(key);
        for(var child_key in question_mapping[key].children){
          GetSingleQuestion(child_key);
        }
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }

  /* Decrement all question Above */
  DecrementAboveQuestions = function(deleted_question_uid)  {
    let ordered_map = {};
    let highest_order = 0;
    for(var key in $scope.question_mapping){
      if(key === deleted_question_uid) { continue }
      ordered_map[$scope.question_mapping[key].order] = {question:$scope.question_mapping[key], key:key}
      highest_order = highest_order < $scope.question_mapping[key].order ? $scope.question_mapping[key].order : highest_order;
    }
    let goal = 1;
    for(var i=1; i<=highest_order;i++){
      let question = ordered_map[i];
      if(question && goal === question.question.order){
        goal++;
        continue;
      } else if(question) {
        question.question.order = goal;
        goal++;
        metaService.editQuestionMapping($scope.insurance_type, question.key, question.question, result => {

        }, error => {
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
          console.error(error.message);
        });
      }
    }
  }

  /* Delete Question From Mapping */
  $scope.DeleteQuestionFromMapping = function(question_uid) {
    let deleted_question = $scope.question_mapping[question_uid]
    metaService.deleteQuestionFromMapping($stateParams.insuranceType, question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      DecrementAboveQuestions(question_uid)
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* Move Up */
  $scope.MoveUp = function(key) {
    let question_up = $scope.question_mapping[key]
    let question_down_index = null;
    if(question_up.order <= 1) { return }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_up.order-1){
        question_down_index = index
        break;
      }
    }
    if(!question_down_index){ return }
    metaService.swapOrderOnQuestionInMapping($scope.insurance_type, key, question_down_index, question_up.order-1, question_up.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }

  /* Move Down */
  $scope.MoveDown = function(key) {
    let question_down = $scope.question_mapping[key]
    let question_up_index = null;
    if(question_down.order >= $scope.questions_from_map.length) { return }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_down.order+1){
        question_up_index = index
        break;
      }
    }
    if(!question_up_index){ return }
    metaService.swapOrderOnQuestionInMapping($scope.insurance_type, key, question_up_index, question_down.order+1, question_down.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }

  /* Auto Order */
  $scope.AutoOrder = function() {
    for(var index in $scope.questions){
      let order = $scope.questions.order || index;
      console.log('question:',$scope.questions[index]);
    };
  }

  /* Make Subquestion of Above */
  $scope.MakeSubQuestionOfAbove = function(key) {
    let question_above_index = null;
    let question_to_subquestion = $scope.question_mapping[key];
    if(question_to_subquestion.order <= 1) {
      return
    }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_to_subquestion.order-1){
        question_above_index = index
        break;
      }
    }
    if(!question_above_index) {
      return
    }

    if($scope.question_mapping[key].children !== false){
      return;
    }

    if($scope.questions_dict[question_above_index].input_type === 'date') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Date');
      })
      return;
    }

    if($scope.questions_dict[question_above_index].input_type === 'text') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Free Text');
      })
      return;
    }

    metaService.deleteAndMakeSubquestionOf($scope.insurance_type, question_above_index, key, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      DecrementAboveQuestions(key);
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    })
  }

  /* Subquestion */
  $scope.SaveSubquestion = function(parent_question_uid, child_question_uid, subquestion) {
    metaService.editSubquestion($scope.insurance_type, parent_question_uid, child_question_uid, subquestion, result => {
      $rootScope.genService.showDefaultSuccessMsg('Subquestion Updated');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'updatesubquestion','error',()=>{},()=>{})
    })
  }

  $scope.SetSubquestionTriggerBool = function(parent_question_uid, child_question_uid, subquestion, new_bool){
    subquestion.trigger = {};
    subquestion.trigger.condition = "==";
    subquestion.trigger.on = new_bool;
    $scope.SaveSubquestion(parent_question_uid, child_question_uid, subquestion);
  }

  /* Detele Subquestion */
  $scope.DeleteSubQuestion = function(question_uid, subquestion_uid) {
    metaService.deleteSubquestion($scope.insurance_type, question_uid, subquestion_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Suqeustion Removed');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    });
  }

/* On Controller Load */
 GetInsuranceTypes();
 GetAllQuestions();
 GetMetaInformation();
 GetQuestionMapping();
}
