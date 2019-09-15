(function() {

    'use strict';

    angular.module('application').
    service('extractionService', extractionService);

    extractionService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','companyService','requestService','metaService'];

    /* Main Service */
    function extractionService($rootScope, firebase, $firebaseObject, activityService, companyService,requestService,metaService) {

        /* Constants */
        const general_keys = {}
        general_keys['body'] = 'Bodily Injury'
        general_keys['property'] = 'Property Damage'
        general_keys['financial'] = 'Financial Loss'

        /* Local Variables */
        var allIndustryCode = {};
        var allcomparisonCriteria = {};

        /* Get Specific Criteria */
        function getSpecificCriteriaForIndustryCodes(insuranceId,IndustryCodes,callback, err_call){
            metaService.getComparisonCriteriaMappingForInsuranceType(insuranceId,criteriaMapping=>{
                let specificCriteriaForIndustryCodesAndInsuranceType = [];
                let specificCriteriasWithIndustryCodes = [];
                if(criteriaMapping && criteriaMapping.comparison_criteria){
                    for(let criteriaId in criteriaMapping.comparison_criteria){
                        let criteriaMappingItem = criteriaMapping.comparison_criteria[criteriaId];
                        let specificCriteriaIndustryCodes = getIndustryCodesPerSpecificCriteria(criteriaMappingItem)
                        let allIndustryCodesWithParentsForCompany = getAllIndustryCodesWithParentsForCompany(IndustryCodes);
                        let isExcludeIndustryCodes = criteriaMappingItem.industry.exclude_all
                        for(let industryCode in allIndustryCodesWithParentsForCompany){
                            /* if exclude all is set to true then, include all the industry codes matching companies industry code. */
                            if(isExcludeIndustryCodes){
                                if(specificCriteriaIndustryCodes.indexOf(industryCode) > -1 ){
                                    specificCriteriaForIndustryCodesAndInsuranceType.push(criteriaId);
                                    if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                                        specificCriteriasWithIndustryCodes.push(criteriaId);
                                    }
                                    break;
                                }
                            }
                            else{
                                if(specificCriteriaIndustryCodes.indexOf(industryCode) == -1 ){
                                    specificCriteriaForIndustryCodesAndInsuranceType.push(criteriaId);
                                    if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                                        specificCriteriasWithIndustryCodes.push(criteriaId);
                                    }
                                }
                                else{
                                    /*  if u find any one of user's industry code matching the criteria's industry codes then remove it */
                                    specificCriteriaForIndustryCodesAndInsuranceType = specificCriteriaForIndustryCodesAndInsuranceType.filter(_criteriaId=> _criteriaId != criteriaId);
                                    specificCriteriasWithIndustryCodes = specificCriteriasWithIndustryCodes.filter(_criteriaId=> _criteriaId != criteriaId);
                                    break;
                                }
                            }
                        }
                    }
                }
                if(callback){
                    specificCriteriaForIndustryCodesAndInsuranceType = [...new Set(specificCriteriaForIndustryCodesAndInsuranceType)];
                    specificCriteriasWithIndustryCodes = [...new Set(specificCriteriasWithIndustryCodes)];
                    callback({"specificCriterias": specificCriteriaForIndustryCodesAndInsuranceType,"specificCriteriasWithIndustryCodes": specificCriteriasWithIndustryCodes});
                }
            },err_call);
        }

        function getAllIndustryCodesWithParentsForCompany(industry_keys){
            let object_with_all_codes = {}
            for(var index in industry_keys){
                let split_code = industry_keys[index].split('.');
                let tmp_code = '';
                for (let inner_index in split_code) {
                    if (split_code.hasOwnProperty(inner_index)) {
                        tmp_code = inner_index == 0 ?
                        tmp_code + split_code[inner_index] :
                        tmp_code + '.' + split_code[inner_index];
                        object_with_all_codes[tmp_code] = true;
                    }
                }
            }
            return object_with_all_codes;
        }

        function getIndustryCodesPerSpecificCriteria(criteriaMappingItem){
            let criteriaIndustryCodes = [];
            if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                for(let industryCode_id in criteriaMappingItem.industry.industry_codes){
                    let industryCode = allIndustryCode[industryCode_id].code;
                    if(industryCode)
                        criteriaIndustryCodes.push(industryCode);
                }
            }
            return criteriaIndustryCodes;
        }

        function getCriteriaName(criteriaId){
            if(allcomparisonCriteria[criteriaId] && allcomparisonCriteria[criteriaId].name_de)
                return allcomparisonCriteria[criteriaId].name_de;
        }

        (()=>{
            metaService.getIndustryCodes(_allIndustryCode => allIndustryCode = _allIndustryCode);
            metaService.getAllComparisonCriteria(_allcomparisonCriteria => allcomparisonCriteria = _allcomparisonCriteria);
        })()

        /* Get Options */
        function get_options(){
            return { general_keys };
        }

        /* Return Stuff */
        return {
            getSpecificCriteriaForIndustryCodes,
            getCriteriaName,
            get_options
        }
    }
})();
