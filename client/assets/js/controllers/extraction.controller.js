// Angular Module
angular.module('application').controller('ExtractionViewController', ExtractionViewController);

// Injections
ExtractionViewController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService', 'Upload', 'metaService', 'backofficeService', 'documentService','extractionService','$window', '$sce'];

// Function
function ExtractionViewController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, Upload, metaService, backofficeService, documentService, extractionService, $window, $sce) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  // Scope Models
  $scope.company = {};
  $scope.types = {};
  $scope.insurance_types = [];
  $scope.file_limit = 5;
  $scope.carriers = [];
  $scope.deductibleType = "number";
  $scope.files_to_upload = {};
  $scope.files_uploaded = {};
  $scope.company_uid = $stateParams.company;
  $scope.selectedInsuranceType = $stateParams.insurance_uid;
  $scope.specificCriterias = {};
  $scope.options = extractionService.get_options();
  $scope.isCriteriasFormValid = true;
  $scope.isSpecificCriteriasEmpty = false;
  const policyId = $stateParams.policy;
  $scope.maximisation_limit = 15;

  $scope.applicabilityOptions =[
    {text:'Included', value: true},
    {text:'Not Included', value: false},
  ];

  var previousSubject;
  $scope.specificCriteriasWithIndustryCodes=[];

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

  /* Get Single Policy Information */
  $scope.GetSinglePolicyInformation = function(){
    $rootScope.local_load = true;
    console.log('Getting information for policy:', $stateParams.policy);
    var company_uid = $stateParams.company;
    if(!company_uid){
      company_uid = $scope.policy.company;
    }
    policyService.getSinglePolicy($stateParams.policy, function(policy){
      $scope.policy = policy;
      getdeductibleType();
      companyService.getCompanyInformation(company_uid, function(company){
        $scope.company = company;
        $scope.GetPolicySpecificCriteria();
        $scope.GetIndustrySpecificCriteria();
        $scope.GetCodesForCompany();
        $rootScope.local_load = null;
        $scope.GetDocuments();
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{});
      });
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{});
    });
  }

  /* Get Extraction Help */
  $scope.GetExtractionHelp = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Specific Criteria */
  $scope.GetSpecificCriteria = function(insurance_uid){
    extractionService.getSpecificCriteriaForIndustryCodes(insurance_uid, $scope.company.industry_codes, criteria =>{
      $scope.specific_preview_criteria = {};
      criteria.specificCriterias.forEach(key => {$scope.specific_preview_criteria[key] = true})
      loadExtrationsPreview();
      $scope.num_specific_preview_criteria = Object.keys($scope.specific_preview_criteria).length
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Company Information */
  $scope.GetCompanyInformation = function(){
    companyService.getCompanyInformation($scope.policy.company, company => {
      $scope.company = company
      $scope.GetSpecificCriteria($scope.policy.subject);
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Carriers */
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    $scope.carriers = [];
    metaService.getCarriers(function(carriers){
      for(var key in carriers){
        $scope.carriers.push({key:key, carrier:carriers[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Custom Fields */
  $scope.GetCustomFields = function(type){
    $scope.customFields = type.fields;
    custom_fields = [];
    for(var key in type.fields){
      custom_fields.push(type.fields[key].variable_name);
    }
    console.log('custom fields==> ',custom_fields);
  }

  /* Download Policy */
  $scope.DownloadPolicy = function(policy, old){
    if(!policy) {return}
    const from = (old ? "policies" : "documents") + "/" + $scope.policy.company + "/" + policy.file;
    const rename_to = policy.alias ? (policy.alias + '.pdf') : policy.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* File Changed */
  $scope.FileChanged = function(file){
    if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
      return;
    }
    $scope.files_to_upload[file.name] = file;
    $scope.PerformUpload(file)
  };

  /* Remove From Uploads */
  $scope.RemoveFromUploads = function(key, files){
    if(!$scope.files_to_upload[key]){
      return;
    }
    delete $scope.files_to_upload[key];
    if(Object.keys($scope.files_to_upload).length === 0){
      // Nothing Yet
    }
    $scope.safeApply(fn => fn);
  }

  /* Perform upload */
  $scope.PerformUpload = function(file){
    if(!file){return}
    $rootScope.local_load = true;
    $scope.disableUploadBtn= true;
    var company_uid = $stateParams.company;
    if(!company_uid){
      company_uid = $scope.policy.company;
    }
    documentService.uploadPolicies(file, company_uid, file_urls => {
      documentService.createDocuments(file_urls, company_uid, (newUpdateDocuments, document_list) => {
        policyService.addDocumentToPolicy(newUpdateDocuments, document_list.document, $stateParams.policy, () => {
          $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
          delete $scope.files_to_upload[file.name]
          $rootScope.local_load = null;
          $scope.safeApply(fn => fn);
          $scope.GetSinglePolicyInformation();
        }, error => {
          $scope.disableUploadBtn= false;
          $rootScope.local_load = null;
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.code);
          backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
        });
      });
    }, error => {
      console.error(error);
      $scope.disableUploadBtn= false;
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
    });
  }

  /* Remove From Policy */
  $scope.RemoveFromPolicy = function(key){
    policyService.removeDocument($stateParams.policy, key, () => {
      delete $scope.files_uploaded[key];
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
    })
  }

  /* Get Documents */
  $scope.GetDocuments = function(){
    $scope.number_of_documents = 0;
    if($scope.policy.file){
      $scope.number_of_documents += 1;
    }

    if(!$scope.policy.documents) {
      return
    }
    if($scope.files_uploaded){
      $scope.files_uploaded = {};
    }

    for(var key in $scope.policy.documents){
      let doc = $scope.policy.documents[key];
      documentService.getDocument(doc.route, doc.key, document => {
        $scope.files_uploaded[doc.key] = null;
        $scope.files_uploaded[doc.key] = document;
        $scope.number_of_documents++;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email, 'extraction', 'error',()=>{},()=>{})
      });
    }
  }

  /* Length Of Object */
  $scope.LengthOfObject = function(object){
    if(!object){
      return '0';
    }
    let length = Object.keys(object).length;
    return length.toString() || '0';
  }

  /* Edit Alias */
  $scope.EditAlias = function(key){
    $scope.selected_document = $scope.files_uploaded[key];
    $scope.selected_document_key = key;
    $scope.GetSinglePolicyInformation();
  }

  /* Delete Policy */
  $scope.DeletePolicy = function(){
    $scope.ConfirmAction = null;
    policyService.deletePolicy($stateParams.policy, function(){
      backofficeService.logpost({msg:'policy removed',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Marked as Deleted');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Pending */
  $scope.MakePending = function(){
    $scope.ConfirmAction = null;
    policyService.makePending($stateParams.policy, function(){
      backofficeService.logpost({msg:'extraction Marked as pending',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Marked as Pending');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Lock to Employee */
  $scope.LockToEmployee = function(){
    $rootScope.local_load = true;
    $scope.ConfirmAction = null;
    policyService.lockToExtractor($rootScope.user.email, $stateParams.policy, function(){
      //logme
      backofficeService.logpost({msg:'extraction locked',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('You have been marked as Extractor');
      $rootScope.local_load = null;
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Unlock */
  $scope.Unlock = function(){
    $rootScope.local_load = true;
    $scope.ConfirmAction = null;
    policyService.unlockForExtractors($stateParams.policy, function(){
      backofficeService.logpost({msg:'extraction unlocked',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Extraction is now open for others');
      $rootScope.local_load = null;
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Policy Specific Criteria */
  $scope.GetPolicySpecificCriteria = function(){
    if(!$scope.policy || !$scope.policy.subject) return;
    metaService.getPolicySpecificCriteriaFromSubjectTrigger($scope.policy.subject, function(policy_specific_criteria){
      $scope.custom_fields = [];
      for(var key in policy_specific_criteria){
        if(policy_specific_criteria[key].disabled)
          continue;

        for(var field_key in policy_specific_criteria[key].fields){
          $scope.custom_fields.push({key: field_key, field: policy_specific_criteria[key].fields[field_key]});
        }
      }
      $scope.$apply();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Industry Specific Criteria */
  $scope.GetIndustrySpecificCriteria = function(){
    $scope.industry_fields = [];
    if(!$scope.policy || !$scope.policy.subject) return;
    metaService.getIndustrySpecificCriteriaFromPolicyTrigger($scope.policy.subject, function(industry_criteria){
      var included_criteria = [];
      for(var key in industry_criteria){
        triggers = industry_criteria[key].industry_trigger;
        criteria_loop:
        for(var trigger in triggers){
          for(var code in $scope.company.industry_codes){
            var should_include = $scope.company.industry_codes[code].includes(triggers[trigger]);
            if(should_include === true){
              if(industry_criteria[key].disabled)
                continue;

              included_criteria.push(industry_criteria[key]);

              console.log('Criteria triggered for industry code',triggers[trigger],'and business code',$scope.company.industry_codes[code]);
              break criteria_loop;
            }
          }
        }
      }
      for(in_key in included_criteria){
        var fields = included_criteria[in_key].fields;
        for(var field_key in fields){
          $scope.industry_fields.push({key : field_key, field : fields[field_key]});
        }
      }
      $scope.$apply();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Active */
  $scope.MakeActive = function(){
    $scope.ConfirmAction = null;
    let display_version = $state.current.name == 'extractionpreview' ? 2 : null
    policyService.activatePolicy($stateParams.policy, display_version, function(){
      $rootScope.genService.showDefaultSuccessMsg('Activated');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Active No Email */
  $scope.MakeActiveNoEmail = function(){
    $scope.ConfirmAction = null;
    let display_version = $state.current.name == 'extractionpreview' ? 2 : null    
    policyService.activatePolicyNoEmail($stateParams.policy, display_version, function(){
      $rootScope.genService.showDefaultSuccessMsg('Activated');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Save Unfinished Extraction */
  $scope.SaveUnfinishedExtraction = function(){

    // Nullify undefined
    for(var key in $scope.policy.custom_fields){
      if($scope.policy.custom_fields[key]===null || $scope.policy.custom_fields[key]===undefined){
        $scope.policy.custom_fields[key] = null;
      }
    }
    //check if deductible is entered in % or number
    setdeductibleType();
    policyService.savePolicy($stateParams.policy, $scope.policy, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Save Document */
  $scope.SaveDocument = function(selected_document) {
    let route = $scope.policy.documents[$scope.selected_document_key].route
    let key = $scope.policy.documents[$scope.selected_document_key].key
    documentService.saveDocument(route, key, selected_document, () => {
      $scope.GetDocuments();
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      document.getElementById('close_alias').click();
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'could not update document','error',()=>{},()=>{})
    })
  }

  /*set deductible type before saving*/
  setdeductibleType = function(){
    if($scope.policy && $scope.policy.deductible){
      if($scope.deductibleType == "percent"){
        //append % if the radio is selected for percent.
        $scope.policy.deductible += "%";
      }
    }
  }

  /*get the deductible type based on the suffix added (% for percent)*/
  getdeductibleType = function(){
    if ($scope.policy && $scope.policy.deductible){
      var suffix = $scope.policy.deductible.toString().slice(-1);
      if (suffix == "%"){
        //trim the % suffix and set the radio button
        $scope.policy.deductible = $scope.policy.deductible.slice(0, -1);
        $scope.deductibleType = "percent";
      }
    }
  }

  /* Get Codes For Company */
  $scope.GetCodesForCompany = function(){
    $rootScope.local_load = true;
    if(!$scope.company || !$scope.company.industry_codes) { return };
    let codes_to_get = [];
    for(var code in $scope.company.industry_codes){
      let combined = "", temp_code = $scope.company.industry_codes[code].split('.');
      for(var place in temp_code){
        combined = combined === "" ? combined.concat(temp_code[place]) : combined.concat('.',temp_code[place])
        codes_to_get.push(combined);
      }
    }
    $scope.codes_to_show = [];
    for(var index in codes_to_get){
      let search_code = !codes_to_get[index].includes('.')  ? Number(codes_to_get[index]) : codes_to_get[index]
      metaService.getCodeDataFromCode(search_code, function(code){
        $rootScope.local_load = null;
        if(!code) {return}
        $scope.codes_to_show.push(code[Object.keys(code)[0]]);
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }
  }


  /* edit the basic information */
  $scope.editBasicInfo = function(){
    $scope.gotoExtractionBasic();
  }

  /* saves the basic information for the extractions */
  $scope.SaveBasicInformation = function(){
    if(previousSubject != undefined && previousSubject != $scope.policy.subject){
      if($scope.policy.insurance_types &&  $scope.policy.insurance_types[previousSubject]){
        delete $scope.policy.insurance_types[previousSubject];
      }
    }
    policyService.savePolicy(policyId, $scope.policy, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.go('extractionpreview', {policy:$stateParams.policy});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* redirect to the extractions preview */
  $scope.gotoExtractionPreview = function(){
    $state.go("extractionpreview",{"policy":policyId});
  }

  $scope.gotoExtractionBasic = function(){
    $state.go("extractionbasic",{"policy":policyId});
  }

  $scope.gotoGeneralComparisonCriteria = function(insurance_type){
    $state.go("extractiongereralcriteria",{"policy":policyId})
  }

  $scope.gotoSpecificComparisonCriteria = function(insuranceId){
    $state.go("extractionspecificcriteria",{"policy":policyId,"insurance_uid":insuranceId})
  }

  $scope.gotoChooseAdditionalModule = function(){
    $state.go("extractionchooseadditionalmodule",{policy:policyId});
  }

  $scope.deleteAdditionalModule = function(insuranceType){
    policyService.deleteAdditionalModule(policyId,insuranceType,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Additional Module deleted successfully');
      $state.reload();
    },error=>{
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  function getSpecificCriteria (insuranceId){
    $rootScope.local_load = true;
    companyService.getCompanyInformation($scope.policy.company,company=>{
      $scope.company = company;
      extractionService.getSpecificCriteriaForIndustryCodes(insuranceId,$scope.company.industry_codes,(data)=>{
        $rootScope.local_load = null;
        let specificCriterias = data.specificCriterias;
        $scope.specificCriteriasWithIndustryCodes = data.specificCriteriasWithIndustryCodes;
        if(!specificCriterias || specificCriterias.length ==0)
          $scope.isSpecificCriteriasEmpty = true;

        specificCriterias.forEach(criteriaId=>{
          $scope.specificCriterias[criteriaId] = getExisitingCriteria(insuranceId,criteriaId);
        });
        converNativeTypesToStrings($scope.specificCriterias);
        $scope.safeApply(fn => fn);
      });
    });
  }

  function getExisitingCriteria(insuranceId,criteriaId){
    let specificCriteriaData = {};
    if($scope.policy.insurance_types && $scope.policy.insurance_types[insuranceId] && $scope.policy.insurance_types[insuranceId].specific  && $scope.policy.insurance_types[insuranceId].specific[criteriaId]){
      specificCriteriaData = $scope.policy.insurance_types[insuranceId].specific[criteriaId]
    }
    return specificCriteriaData
  }

  $scope.getCriteriaName = function(criteriaId){
    return extractionService.getCriteriaName(criteriaId)
  }

  $scope.isIndustrySpecifComparisonCriteria = function(criteriaId){
    if($scope.specificCriteriasWithIndustryCodes){
      if($scope.specificCriteriasWithIndustryCodes.indexOf(criteriaId) > -1){
        return true;
      }
    }
    return false;
  }

  function converSelectOptionsToNativeTypes(criterias){
    for(let criteriaKey in criterias){
      if(criterias[criteriaKey].included != undefined && criterias[criteriaKey].included == 'true')
        criterias[criteriaKey].included = true;
      else
        criterias[criteriaKey].included = false;
    }
  }

  function converNativeTypesToStrings(criterias){
    for(let criteriaKey in criterias){
      if(criterias[criteriaKey].included !== undefined && criterias[criteriaKey].included !== null)
        {
        criterias[criteriaKey].included = criterias[criteriaKey].included.toString();
      }
    }
  }

  $scope.MakeSumInsuredUnlimited = function(insurance_type){
    $scope.policy.insurance_types[insurance_type] = $scope.policy.insurance_types[insurance_type] || { general: {} };
    if($scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured === true){
      $scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured = false;
    } else {
      $scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured = true;
    }
  }

  /* Save the general criteria */
  $scope.SaveGeneralCriteria = function(insurance_type = $scope.policy.subject){
    policyService.saveGeneralCriteria($stateParams.policy, insurance_type, $scope.policy.insurance_types[insurance_type].general, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.go('extractionpreview', {policy:$stateParams.policy});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  $scope.goBack = function(){
    $window.history.back();
  }


  /* saves the additional modules specific criteria added */
  $scope.saveSpecifCriteriaForInsuranceType = function(insuranceId){
    converSelectOptionsToNativeTypes($scope.specificCriterias);
    policyService.saveSpecificCriteria(policyId,insuranceId,$scope.specificCriterias,()=> {
      converNativeTypesToStrings($scope.specificCriterias);
      $scope.SaveGeneralCriteria(insuranceId);
    }, error=>{
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Update Annual Premium */
  $scope.UpdateAnnualPremium = function(){
    if(!$scope.policy.basic || !$scope.policy.basic) { return }
    $scope.annual_gross_premium = $scope.policy.basic.premium*(($scope.policy.basic.insurance_tax*0.01)+1);
  }

  function loadExtrationsPreview(){
    $scope.extrationsPreview_generalCriteria = {};
    $scope.extrationsPreview_specificCriteria = {};
    $scope.extrationsPreview_additionalModules = {};
    let subject = $scope.policy.subject;

    if($scope.policy.insurance_types){
      if($scope.policy.insurance_types[subject]){
        if($scope.policy.insurance_types[subject].general){
          $scope.extrationsPreview_generalCriteria  = $scope.policy.insurance_types[subject].general;
        }
      }
      /* add all inusrance types except for the 'subject', insurance type to the additional modules list */
      for(let insuranceType in $scope.policy.insurance_types){
        if(insuranceType != subject){
          $scope.extrationsPreview_additionalModules[insuranceType] = $scope.policy.insurance_types[insuranceType].specific;
        }
      }
      $scope.safeApply(fn => fn);
    }
    isBasicInformationValid();
    isGeneralCriteriaValid();
    isSpecificCriteriaValid();
    $scope.GetDocuments();
  }

  /* Nullcheck General Criteria */
  $scope.NullCheckGeneralCriteria = function(){
    for(var key in $scope.options.general_keys){
      $scope.policy.insurance_types = $scope.policy.insurance_types || {};
      $scope.policy.insurance_types[$scope.policy.subject] = $scope.policy.insurance_types[$scope.policy.subject] || {general: {}}
      $scope.policy.insurance_types[$scope.policy.subject].general[key] = $scope.policy.insurance_types[$scope.policy.subject].general[key] || {};
    }
  }


  $scope.getCarrierName = function(carrierKey){
    if(!carrierKey) return;
    let carrierObj = $scope.carriers.find(carrierObj=>carrierObj.key == carrierKey);
    if(carrierObj && carrierObj.carrier && carrierObj.carrier.name)
      return carrierObj.carrier.name;
  }

  $scope.getInsuranceName = function(insuranceKey){
    if(!insuranceKey) return;
    let insuranceObj = $scope.insurance_types.find(insuranceObj=>insuranceObj.key == insuranceKey);
    if(insuranceObj && insuranceObj.insurance_type && insuranceObj.insurance_type.name_de)
      return insuranceObj.insurance_type.name_de;
  }

  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(insurance_type){
    if(!$scope.policy.insurance_types[insurance_type].general.deductible_is_percent){
      $scope.policy.insurance_types[insurance_type].general.deductible_is_percent = true
    } else {
      $scope.policy.insurance_types[insurance_type].general.deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }

   /* Make deductible Max Percent */
   $scope.MakedeductibleMaxPercent = function(insurance_type){
    if(!$scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent){
      $scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent = true
    } else {
      $scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }

  /* Make deductible Percent */
  $scope.MakeSpecificdeductiblePercent = function(criteriaObject){
    if(!criteriaObject.deductible_is_percent){
      criteriaObject.deductible_is_percent = true;
    } else {
      criteriaObject.deductible_is_percent = false;
    }
    $scope.safeApply(fn => fn);
  }

  $scope.isInsuranceIncluded = function(insuranceKey){
    if(insuranceKey == $scope.policy.subject){
      return true;
    }
    for(let insuranceId in $scope.policy.insurance_types){
      if(insuranceKey == insuranceId){
        return true;
      }
    }
    return false;
  }
  /* returns true if atleast one of the general criterias is included else it returns false */
  function isGeneralCriteriaValid(){
    if(!$scope.policy.insurance_types || !$scope.policy.insurance_types[$scope.policy.subject] || !$scope.policy.insurance_types[$scope.policy.subject].general){
      $scope.isGeneralCriteriaValid = false;
    }
    else if(!$scope.policy.insurance_types[$scope.policy.subject].general.sum_insured || !$scope.policy.insurance_types[$scope.policy.subject].general.maximisation){
      $scope.isGeneralCriteriaValid = false;
    } else {
      $scope.isGeneralCriteriaValid = true;
    }
  }

  /**
   * Is Extraction Valid
   * This is the ONLY Model Validation function avtively
   * used in ExtractionPreview.html
   */
  $scope.isExtractionValid = function(){
    if($scope.policy.basic && $scope.policy.insurance_types){
      if(!($scope.policy.basic.carrier && $scope.policy.basic.policy_number && $scope.policy.basic.start_date && $scope.policy.basic.notice_period && $scope.policy.basic.main_renewal_date && $scope.policy.basic.prolongation && $scope.policy.basic.premium && $scope.policy.basic.insurance_tax)){
        return false;
      }
      for(let type in $scope.policy.insurance_types){
        if(!$scope.policy.insurance_types[type].general){
          return false;
        }
        if($scope.specific_preview_criteria){
          for(let criteria in $scope.specific_preview_criteria){
            if($scope.policy.insurance_types[type].specific){
              if(!$scope.policy.insurance_types[type].specific[criteria]){
                return false;
              }
            } else {
              return false;
            }
          }
        } 
      }
      return true;
    }
   return false;
  }

  function isSpecificCriteriaValid(){
    $scope.isSpecificCriteriaValid = false;
    if($scope.specific_preview_criteria && Object.keys($scope.specific_preview_criteria).length >0){
      for(let specific_id in $scope.specific_preview_criteria){
        if($scope.policy.insurance_types 
          && $scope.policy.insurance_types[$scope.policy.subject] 
          && $scope.policy.insurance_types[$scope.policy.subject].specific 
          && $scope.policy.insurance_types[$scope.policy.subject].specific[specific_id]){
          $scope.isSpecificCriteriaValid = true;
        }
        else{
          $scope.isSpecificCriteriaValid = false;
          break;
        }
      }
    }
    else{
      /* if there are no specific criteria in the policy */
      $scope.isSpecificCriteriaValid = true;
    }
  }

  /* isBasicInformationValid is set to true if all the basic information is entered else it's set to false */
  function isBasicInformationValid(){
    $scope.isBasicInformationValid = false;
    if($scope.policy.basic){
      let basicInfo = $scope.policy.basic;
      if(basicInfo.carrier && basicInfo.policy_number && basicInfo.start_date && basicInfo.notice_period && basicInfo.main_renewal_date && basicInfo.prolongation && basicInfo.premium && basicInfo.insurance_tax){
        $scope.isBasicInformationValid = true;
      }
    }
  }

  function processStateParamsAndViews(){
    /* TODO: conver below if conditiona to switch-case  */
    if($state.current.name == 'extractionspecificcriteria' && $stateParams.insurance_uid){
      getSpecificCriteria($stateParams.insurance_uid)
    }
    if($state.current.name == 'extractionpreview'){
      $scope.GetCompanyInformation();
      $scope.GetCarriers();
    }
    if($state.current.name == 'extractionbasic'){
      previousSubject = $scope.policy.subject;
      $scope.GetCarriers();
    }
    if($state.current.name == 'extractiongereralcriteria'){
      let subject = $scope.policy.subject;
      if($scope.policy && $scope.policy.insurance_types && $scope.policy.insurance_types[subject] && $scope.policy.insurance_types[subject].general){
        $scope.gereralCritteria = $scope.policy.insurance_types[subject].general;
        converNativeTypesToStrings($scope.gereralCritteria);
        $scope.safeApply(fn => fn);
      }

    }
  }

  /* self executing function for every controller load,
  do all sorts of initialization for the controller here.
  */
  (()=>{ policyService.getSinglePolicy($stateParams.policy,policy=>{
    $scope.policy = policy;
    $scope.UpdateAnnualPremium();
    if( $scope.policy && ($state.current.name == 'extractionpreview' || $state.current.name == 'extractionspecificcriteria')){
      processStateParamsAndViews();
    }
    /* previous version of initializing the controller */
    else{
      /* Call On Controller Load */
      $scope.GetSinglePolicyInformation();
      $scope.GetCarriers();
    }
  });
})()

/* Change Display Version */
$scope.ChangeDisplayVersion = function(version){
  // policyService.changeDisplayVersion($scope.policy, $stateParams.policy, () => {
  //   $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
    $state.go("extractionpreview",{"policy": $stateParams.policy});
  // }, error => {
  //   console.error(error);
  //   $rootScope.local_load = null;
  //   $rootScope.genService.showDefaultErrorMsg(error.code);
  // });
}

/* Transform into Html */
$scope.transformToHtml = function(html){
  return $sce.trustAsHtml(html);
}

/* On Controller Load */
$scope.GetExtractionHelp();
$scope.GetCarriers();

}
