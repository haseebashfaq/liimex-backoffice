(function() {

    'use strict';

    angular.module('application').
    service('userrequestService', userrequestService);

    userrequestService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService','companyService','metaService','offerService'];

    function userrequestService($rootScope, firebase, $firebaseObject, requestService, companyService,metaService,offerService) {

        /* Endpoints */
        const user_request_prefix = 'user_requests';
        const users_prefix = "users";
        const employments_prefix = "employments";
        const companies_prefix = "companies";
        const address_prefix = "addresses";
        const recommendation_prefix = "recommendations";
        const industry_suffix = "industry_codes";
        const activity_suffix = 'activities';
        const insurance_questionnaire_suffix = 'insurance_questionnaire';

        let userRequestid = "";
        let generalInsuranceQuestions = [];
        let insuranceTypesGroups = {};
        let insuranceTypesGroups_tracker = [];
        let confirmatoryInsuranceQuestions = [];
        let specificInsuranceTypesGroups = {};
        let allInsuranceQuestions = [];
        let allInsuranceQuestionMappings =[];
        let selectedMappingObjs = [];

        /* Delete Request */
        function deleteRequest(request_uid){
            requestService.deleteData([user_request_prefix, request_uid], success => {
                console.log('Request deleted');
            }, error => {
                console.error(error);
            })
        }

        function saveUserRequest(data,callback, err){
            data.processed = false;
            if(data.email.includes('liimex')){
                err({error_message: 'Dont use @Liimex emails here !'})
                return;
            }
            requestService.pushData([user_request_prefix], data, new_user_request =>{
                userRequestid = new_user_request.key;
                setTimeout(()=>{getUserRequest(new_user_request.key,updated_user_request=>{
                    if(!updated_user_request.error && updated_user_request.uid){
                        callback(updated_user_request.uid, userRequestid);
                    }
                    else {
                        err(updated_user_request);
                    }
                    //deleteRequest(new_user_request.key);
                },err)},3000);
            },err);
        }

        function getUserRequest(key,callback, err){
            requestService.getDataOnce([user_request_prefix,key],callback,err);
        }

        function getUserObj(key,callback,err){
            requestService.getDataOnce([users_prefix,key],callback,err);
        }

        function getCompanyFromUserid(uid,callback,err){
            requestService.getDataOnce([employments_prefix,uid],employee=>{
                let compId = employee.company;
                requestService.getDataOnce([companies_prefix, compId],(company)=>{
                    let addressKey;
                    let address;
                    if(company && company.addresses){
                        addressKey = Object.keys(company.addresses)[0];
                        requestService.getDataOnce([address_prefix,addressKey],(addressObj)=> {
                            address = addressObj
                            callback(company,compId,address,addressKey);
                        },e=>{
                            console.log("error fetching address",e);
                            callback(company,compId);
                        });
                    }
                    else
                        callback(company,compId)
                },err);
            },err);
        }

        function updateUserAndCompany(user_request_id, uid, user_params, company_params, address_params , callback, err, compId, addressId){
            address_params.country = "Deutschland";
            company_params.users = {};
            company_params.users[uid] = true;
            company_params.liimex_id = generateCompanyId(company_params, address_params);
            requestService.getMultipleKeys([{
                name:'user', route:[users_prefix]
            },{
                name:'company', route:[companies_prefix]
            },{
                name:'address', route:[address_prefix]
            },{
                name:'employment', route:[employments_prefix]
            }], keys => {
                var newUpdate = {}, now = requestService.getTimestamp();
                let compKey = compId? compId: keys['company'].key;
                let addressKey = addressId? addressId: keys['address'].key;
                user_params.created_at = now;
                user_params.updated_at = now;
                user_params.welcome_email_sent = true;

                address_params.company = compKey;
                address_params.main = true;
                company_params.addresses = {};
                company_params.created_at = now;
                company_params.updated_at = now;
                company_params.addresses[addressKey] = true
                newUpdate[keys['user'].route+uid] = user_params;
                newUpdate[keys['address'].route+addressKey] = address_params;
                newUpdate[keys['company'].route+compKey] = company_params;
                newUpdate[keys['employment'].route+uid] = {
                    company:compKey, created_at:now, updated_at:now
                };
                requestService.multiPathUpdate(newUpdate, data => {
                    deleteRequest(user_request_id);
                    callback(data, keys['company'].key, keys['address'].key)
                }, err);
            });
        }

        /* Generate Company IDs */
        function generateCompanyId(company,address){
            var lower_code = company.name[0] + address.street[0] + address.country[0];
            var upper_code = lower_code.toUpperCase();
            var date = new Date(),
            milistamp = date.getTime().toString().slice(-4),
            random_num = Math.floor((Math.random() * 9999));
            random_num = '0'.repeat(4-random_num.toString().length).concat(random_num);
            var final_code = upper_code+'-'+random_num+'-'+milistamp;
            return final_code;
        }

        const getUserRequestKey = () => userRequestid;

        function updateIndustryCodes(company_uid, industry_codes, callback, err_call){
            requestService.setData([companies_prefix, company_uid, industry_suffix], industry_codes, callback, err_call);
        }

        function updateActivityAndRecommendation(company_uid, activity_keys,industry_codes, callback, err_call){
            requestService.getMultipleKeys([{
                name:'recommendation', route:[recommendation_prefix]
            }], recommendationKey => {
                var newUpdate = {}, recommendation_params ={}, company_params = {} , now = requestService.getTimestamp();
                recommendation_params.created_at = now;
                recommendation_params.updated_at = now;
                recommendation_params.company = company_uid;
                recommendation_params.activities = activity_keys;
                recommendation_params.industry_codes = industry_codes;
                recommendation_params.processed = false;

                newUpdate[recommendationKey['recommendation'].route+recommendationKey['recommendation'].key] = recommendation_params;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'updated_at'] = now;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'activities'] = activity_keys;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'recommendations'] = {[recommendationKey['recommendation'].key]: true};

                requestService.multiPathUpdate(newUpdate, callback, err_call);
            });
        }

        function getRecommendationForCompanyID(companyid, callback, err){
            companyService.getCompanyInformation(company=>{
                if(company.recommendations){
                    let recommendations = Object.keys(company.recommendations)[0];
                }

            },err);
        }

        function getQsForSelectedInsurances(selectedInsuranceTypes,companyid,callback,err_call){
            let selectedInsuranceQuestions =[];
            selectedMappingObjs = [];
            allInsuranceQuestionMappings = [];
            metaService.getAllQuestionMapping((_allInsuranceQuestionMappings)=>{
                for(var index in _allInsuranceQuestionMappings ){
                    var mappingsObj = _allInsuranceQuestionMappings[index].questions;
                    allInsuranceQuestionMappings.push({insuranceType: index, mappings: mappingsObj});
                }
                /*add all the general question to the selected mappings list*/
                selectedMappingObjs.push(allInsuranceQuestionMappings.find((mappingsObj)=> mappingsObj.insuranceType == 'general'));
                selectedMappingObjs.push(allInsuranceQuestionMappings.find((mappingsObj)=> mappingsObj.insuranceType == 'confirmatory'));
                selectedInsuranceTypes.forEach((selectedInsuranceType)=>{
                    let _selectedMappingObj = allInsuranceQuestionMappings.find((mappingsObj)=>mappingsObj.insuranceType == selectedInsuranceType);
                    if(_selectedMappingObj)
                        selectedMappingObjs.push(_selectedMappingObj);
                });
                selectedMappingObjs.forEach((selectedMObj)=>{
                    for(var qKey in selectedMObj.mappings){
                        var mainQuestion = getInsuranceQsByQId(qKey);
                        mainQuestion.subQuestions = [];
                        mainQuestion.insurance_type = selectedMObj.insuranceType;
                        mainQuestion.order = selectedMObj.mappings[qKey].order;
                        if(selectedMObj.mappings[qKey].children){
                            for(var childQKey in selectedMObj.mappings[qKey].children){
                                var childQuestion = getInsuranceQsByQId(childQKey);
                                childQuestion.trigger = selectedMObj.mappings[qKey].children[childQKey].trigger;
                                mainQuestion.subQuestions.push(childQuestion);
                            }
                        }
                        selectedInsuranceQuestions.push(mainQuestion);
                    }
                });
                /*remove duplicate question objs*/
                selectedInsuranceQuestions = [...new Set(selectedInsuranceQuestions)];

                assignExistingAnswersForQuesions(selectedInsuranceQuestions,companyid,()=>{
                    divideQuestionTypes(selectedInsuranceQuestions);
                    if(callback)
                        callback({generalInsuranceQuestions:generalInsuranceQuestions,confirmatoryInsuranceQuestions:confirmatoryInsuranceQuestions,specificInsuranceTypesGroups: specificInsuranceTypesGroups});
                },err_call);
            });
        }

        function assignExistingAnswersForQuesions(questionsArr,companyid,callback,err_call){
            companyService.getCompanyInformation(companyid,company=>{
                if(company.insurance_questionnaire){
                    questionsArr.forEach((question)=>{
                        if(company.insurance_questionnaire && company.insurance_questionnaire[question.key])
                            question.answer = company.insurance_questionnaire[question.key].answer;
                        if(question.subQuestions)
                            question.subQuestions.forEach((subQ)=>{
                            if(company.insurance_questionnaire && company.insurance_questionnaire[subQ.key]){
                                subQ.answer = company.insurance_questionnaire[subQ.key].answer;
                                if(!question.triggerMarchingSubQs)
                                    question.triggerMarchingSubQs = [];
                                question.triggerMarchingSubQs.push(subQ);
                            }
                        });
                        if(question.triggerMarchingSubQs)
                            question.triggerMarchingSubQs = [...new Set(question.triggerMarchingSubQs)];
                    });
                }
                if(callback)
                    callback();
            },err_call);
        }

        function divideQuestionTypes(selectedInsuranceQuestions) {
            generalInsuranceQuestions = [];
            specificInsuranceTypesGroups = {};
            insuranceTypesGroups_tracker = [];
            confirmatoryInsuranceQuestions = [];

            selectedInsuranceQuestions.forEach((insuranceQuestion)=>{
                if(insuranceQuestion.insurance_type == 'general')
                    generalInsuranceQuestions.push(insuranceQuestion);
                else if(insuranceQuestion.insurance_type == 'confirmatory')
                    confirmatoryInsuranceQuestions.push(insuranceQuestion);
                else{
                    if(!specificInsuranceTypesGroups[insuranceQuestion.insurance_type]){
                        specificInsuranceTypesGroups[insuranceQuestion.insurance_type] =[];
                        insuranceTypesGroups_tracker.push(insuranceQuestion.insurance_type);
                    }
                    specificInsuranceTypesGroups[insuranceQuestion.insurance_type].push(insuranceQuestion);
                }
            });
        }

        /* returns the insurance question object for the given question ids*/
        function getInsuranceQsByQId(qkey){
            return allInsuranceQuestions.find((insuranceQuestion)=>insuranceQuestion.key == qkey);
        }

        /* Update insurance questions and answers */
        function updateInsuraceAnswer(company_uid, question_uid, params, callback, err_call){
            requestService.updateData([companies_prefix, company_uid, insurance_questionnaire_suffix, question_uid], params, callback, err_call);
        }

        /* Request Multiple Offers At Once */
        function requestMultipleOffers(insuranceKeys, company_uid, callback, err_call) {
            offerService.requestMultipleOffers(insuranceKeys, company_uid, callback, err_call);
        }

        /* self executing function */
        (()=>{
            metaService.getAllInsuranceQuestions((_allInsuranceQuestions)=> {
                for(var index in _allInsuranceQuestions){
                    allInsuranceQuestions.push({key:index,insuranceQuestionObj: _allInsuranceQuestions[index]});
                }
            },error=>{console.log("error while fetching all insurance questions",error)});

        })()



        /* Return Stuff */
        return {
            saveUserRequest:saveUserRequest,
            getUserObj:getUserObj,
            getUserRequest: getUserRequest,
            getCompanyFromUserid: getCompanyFromUserid,
            getUserRequestKey: getUserRequestKey,
            updateUserAndCompany: updateUserAndCompany,
            updateIndustryCodes: updateIndustryCodes,
            updateActivityAndRecommendation: updateActivityAndRecommendation,
            getQsForSelectedInsurances: getQsForSelectedInsurances,
            updateInsuraceAnswer: updateInsuraceAnswer,
            requestMultipleOffers: requestMultipleOffers
        }

    }
})();
