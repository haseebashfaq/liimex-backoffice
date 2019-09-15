// Angular Module
angular.module('application').controller('MapInsuranceQuestionsController', MapInsuranceQuestionsController);

// Injections
MapInsuranceQuestionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService','insuranceQuestionsService'];

// Function
function MapInsuranceQuestionsController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService, insuranceQuestionsService) {
	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

	$scope.insuranceId = $stateParams.insuraneType;
	var selectedMainQuestion;
	$scope.subQstriggerConditions = [">","<","<=",">=","!=","=="];
	$scope.insuranceId = $stateParams.insuraneType;
	$scope.mainQuestionList = [];
	var subQsToRemove =[];


	function getInsuranceQuestions(){
		insuranceQuestionsService.getInsurenceMainQuestionForInsuranceId($scope.insuranceId,(_mainQuestions)=>{
			$scope.mainQuestionList = _mainQuestions;
			for(index in $scope.mainQuestionList){
				$scope.mainQuestionList[index].addAsSubQuestion = false;
				getAndAppendChildren($scope.mainQuestionList[index]);
			}
			$scope.$apply();
		},(error)=> console.log("error while fetching main insurance questions",error));
	}

	function getAndAppendChildren(mainQuestion){
		var children=mainQuestion.insuranceQuestionObj.mappings[$scope.insuranceId].children;
		var childrenArray = [];
		for(childIndex in children){
			var insuranceQuestionObj = {insuranceQuestionObj: children[childIndex],key: childIndex};
			childrenArray.push(insuranceQuestionObj);
		}
		mainQuestion.insuranceQuestionObj.mappings[$scope.insuranceId].children = childrenArray;
	}

	$scope.getSubQuestions = (_mainQuestions) =>_mainQuestions.insuranceQuestionObj.mappings[$scope.insuranceId].children;

	$scope.addSubQsInMainQ = function(_selectedMainQuestion){
		selectedMainQuestion = _selectedMainQuestion;
	}

	$scope.addSelectedQsAsSubQs = function(){
		/*get selected main quesion*/
		/*get the selected sub question*/		 
		/*get current insurance id*/
		var selectedQsForSubQing = getSelectedQuestion();
		/*validations*/
		if(isValidForAddingMainQsToSubQs()){
			insuranceQuestionsService.addSubquestionsToMainQuestion($scope.insuranceId,selectedMainQuestion,selectedQsForSubQing,()=>{
				/*save the list of subQ which has to be removed for this insurance type after saving the mapping*/
				subQsToRemove = $scope.mainQuestionList.filter((question)=>question.addAsSubQuestion);

				/*on success on success remove the selected question from the list, as it's added as subQs */
				$scope.mainQuestionList = $scope.mainQuestionList.filter((question)=>!question.addAsSubQuestion);

				$scope.$apply();
			});
		}
	}

	function getSelectedQuestion(){
		var selectedQs = $scope.mainQuestionList.filter((question)=>question.addAsSubQuestion);
		return selectedQs;
	}

	/*check if the selcted questions and main questions and insurance id etc,. are valid*/
	function isValidForAddingMainQsToSubQs(){
		return true;
	}

	/*save edited questions*/
	$scope.saveInsuranceQuestion = function(){
		$scope.mainQuestionList.forEach((mainQuestionObj)=>{
			var data = restructureMainQForFirebase(mainQuestionObj)
			insuranceQuestionsService.updateQuestion(mainQuestionObj.key, data);
		});
		subQsToRemove.forEach((subQ)=>{
			if(subQ.insuranceQuestionObj.mappings[$scope.insuranceId])
				subQ.insuranceQuestionObj.mappings[$scope.insuranceId] = null;
			var data = angular.fromJson(angular.toJson(subQ.insuranceQuestionObj));
			insuranceQuestionsService.updateQuestion(subQ.key, data);
		});
	}

	/*restucture main Q and and it's sub Q to be saved in db*/
	function restructureMainQForFirebase(mainQuestionObj){
		// remove properties added by angular (lik '$$hashKey')
		var insuranceQuestionObj = angular.fromJson(angular.toJson(mainQuestionObj.insuranceQuestionObj));
		if(insuranceQuestionObj.mappings[$scope.insuranceId] && insuranceQuestionObj.mappings[$scope.insuranceId].children){
			var childrenObj= {};
			for(var index in insuranceQuestionObj.mappings[$scope.insuranceId].children){
				var subQ = insuranceQuestionObj.mappings[$scope.insuranceId].children[index];
				childrenObj[subQ.key] = subQ.insuranceQuestionObj;
			}
			insuranceQuestionObj.mappings[$scope.insuranceId].children =  childrenObj;
		}
		return insuranceQuestionObj;
	}

	getInsuranceQuestions();
	/*function to */

}
