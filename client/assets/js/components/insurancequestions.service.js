(function() {

	'use strict';

	angular.module('application').
	service('insuranceQuestionsService', insuranceQuestionsService);
	insuranceQuestionsService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'fileService', 'metaService'];

	function insuranceQuestionsService($rootScope, firebase, $firebaseObject, fileService, metaService){

		/////////////////////////////
		/*      Scope Variables    */
		/////////////////////////////

		/* Question Input Types */
		let input_type_enum = {}
		input_type_enum['bool'] = "Yes / No";
		input_type_enum['number'] = "Number";
		input_type_enum['date'] = "Date";
		input_type_enum['currency'] = "Currency/Money";
		input_type_enum['text'] = "Free Text";

		/* Question Types */
		let question_type_enum = {}
		question_type_enum['general'] = "General (shown in the beginning)";
		question_type_enum['confirmatory'] = "Confirmatory (shown in the end)";
		question_type_enum['specific'] = "Specific (specific to an insurance type)";

		/* Show on Account Page Bool */
		let account_page_status = {};
		account_page_status['hide'] = "Hide from account page";
		account_page_status['show'] = "Show on account page";
		account_page_status['edit'] = "Show and Edit from account page";

		/* Are */
		let future_dates = {};
		future_dates[false] = "No";
		future_dates[true] = "Yes";

		let trigger_conditions = {}
		trigger_conditions['<'] = "<";
		trigger_conditions['>'] = ">";
		trigger_conditions['<='] = "<=";
		trigger_conditions['>='] = ">=";
		trigger_conditions['!='] = "!=";
		trigger_conditions['=='] = "=";

		/* Boolean Answers */
		let boolean_answers = {};
		boolean_answers[false] = "No";
		boolean_answers[true] = "Yes";


		var allInsuranceQuestionsArray = [];

		/////////////////////////////
		/*        Functions        */
		/////////////////////////////
		/*get insuranceQuestions from meta service and convert to an array.*/
		function getAllInsuranceQuestionsArray(successCallback,errorCallback){
			metaService.getAllInsuranceQuestions((insuranceQuestionslistObj)=>{
				for(var index in insuranceQuestionslistObj){
					var insuranceQuestionObj= {insuranceQuestionObj: insuranceQuestionslistObj[index],key: index};
					allInsuranceQuestionsArray.push(insuranceQuestionObj);
				}
				if(successCallback)
					successCallback(allInsuranceQuestionsArray);
			});
		}

		/*get all main questions for the insurence type*/
		function getInsurenceMainQuestionForInsuranceId(insurenceTypeId,successCallback, errorCallback){
			getAllInsuranceQuestionsArray(()=>{
				var mainQuestionPerInsurance = allInsuranceQuestionsArray.filter((questionObj)=> {
					if(questionObj.insuranceQuestionObj.mappings && questionObj.insuranceQuestionObj.mappings[insurenceTypeId])
						return true;

					else
						return false;
				});
				successCallback(mainQuestionPerInsurance);
			});
		}
		/*move converts the selected main questions as sub questions*/
		function addSubquestionsToMainQuestion(insurenceTypeId,mainQuestion,subquestions,successCallback, errorCallback){
			/*1 check if the insuranceid already exists */
			/*2 check if the subquestion already exists */
			/*3 if 2 is false add subquestionid to the mainquestion obj*/

			if(!mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId]){
				mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId] = {"children":{}}
			}

			/*remove bool from the child's property*/
			mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId].children = {};

			subquestions.forEach((subquestion)=>{
				mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId].children[subquestion.key] = {insuranceQuestionObj: {trigger:{}},key: subquestion.key};
			});

			if (successCallback)
				successCallback(mainQuestion);
		}

		/* Get All Insurance Questions */
		function getAllInsuranceQuestions(question_uid, callback, err_call){
			metaService.getAllInsuranceQuestions(question_uid, callback, err_call);
		}

		/* Get Single Insurance Question */
		function getSingleInsuranceQuestion(question_uid, callback, err_call){
			metaService.getSingleInsuranceQuestion(question_uid, callback, err_call);
		}

		/* Get all meta information */
		function getAllMetaInformation(callback, err_call){
			callback({input_type_enum, question_type_enum, account_page_status, future_dates, trigger_conditions, boolean_answers});
		}

		/* Update Question */
		function updateQuestion(question_uid, data, callback, err_call){
			for(var key in data){
				if(data[key] === undefined){
					data[key] = null;
				}
			}
			metaService.updateInsuranceQuestion(question_uid, data, callback, err_call);
		}

		/* Delete Question */
		function deleteQuestion(question_uid, callback, err_call){
			metaService.deleteInsuranceQuestion(question_uid, callback, err_call);
		}

		/* Add New Question */
		function addNewQuestion(callback, err_call){
			metaService.addNewInsuranceQuestion({disabled:true}, callback, err_call);
		}

		/////////////////////////////
		/*         Returns         */
		/////////////////////////////
		return {
			getSingleInsuranceQuestion : getSingleInsuranceQuestion,
			getAllMetaInformation : getAllMetaInformation,
			updateQuestion : updateQuestion,
			getAllInsuranceQuestions : getAllInsuranceQuestions,
			deleteQuestion : deleteQuestion,
			addNewQuestion : addNewQuestion,
			getInsurenceMainQuestionForInsuranceId: getInsurenceMainQuestionForInsuranceId,
			addSubquestionsToMainQuestion: addSubquestionsToMainQuestion
		}
	}

})();
