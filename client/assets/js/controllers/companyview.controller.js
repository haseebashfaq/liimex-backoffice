// Angular Module
angular.module('application').controller('CompanyViewController', CompanyViewController);

// Injections
CompanyViewController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService' ,'claimService', 'FileUploader', 'userService', 'mandateService', 'metaService', 'backofficeService', 'offerService','authService'];

// Function
function CompanyViewController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, claimService, FileUploader, userService, mandateService, metaService, backofficeService, offerService,authService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  // Scope Models
  $scope.company = {};
  $scope.addresses = [];
  $scope.policies = [];
  $scope.users = [];
  $scope.answers = [];
  $scope.claims = [];
  $scope.this_company = $stateParams.company;

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

  /* Get All Companies */
  $scope.GetSingleCompanyInformation = function(){
    $scope.company = {};
    $scope.addresses = [];
    $scope.policies = [];
    $scope.claims = [];

    $rootScope.local_load = true;
    companyService.getCompanyInformation($stateParams.company, function(company){
      $scope.company = company;
      companyService.getCompanyAddress($stateParams.company, function(addresses){
        for(var key in addresses){
          $scope.addresses.push(addresses[key]);
        }
        $scope.GetCodesForCompany();
        $scope.GetAnswersToInsuranceQuestions();
        $scope.GetAllOffers();
        policyService.getPolicies($stateParams.company, function(policies){
          for(var key in policies){
            $scope.policies.push({policy:policies[key], key:key});
          }
          claimService.getClaims($stateParams.company, function(claims){
            for(var key in claims){
              $scope.claims.push(claims[key]);
            }
            $rootScope.local_load = null;
            $scope.safeApply( fn => fn);
          }, function(error){
            $rootScope.genService.showDefaultErrorMsg('claim error: '+error.message);
            backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
          });
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('policy error: '+error.message);
          backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('address error: '+error.message);
        backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      });
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg('company error: '+error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /**
   * Download policy. Rename according to alias if possible
   * @param policy
   */
  $scope.DownloadPolicy = function(policy){
    if(!policy) {return}
    const from = "policies/" + $scope.offer.company + "/" + policy.file;
    const rename_to = policy.alias ? (policy.alias + '.pdf') : policy.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* Get Users */
  $scope.GetUsersOfCompany = function(){
    $scope.users = [];
    userService.getUsersOfCompany($stateParams.company, function(users){
      for(var key in users){
        userService.returnUserInfo(key,user=>{
          $scope.users.push({key:key, user:user});
          $scope.safeApply( fn => fn);
        },function(error){
          console.error(error)
        })
      }
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  }



  /* Register New Policy */
  $scope.RegisterNewPolicy = function(){
    policyService.registerExistingPolicy($stateParams.company, null ,function(result){
      let policy_key = Object.keys(result)[1].split('/')[1];
      backofficeService.logpost({msg:'New Policy Added by Liimex',company:$stateParams.company},$rootScope.user.email,'company','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('New Policy Added');
      $state.go('extractionpreview', {policy: policy_key});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  }

  /* Select Policy */
  $scope.SelectPolicy = function(policy){
    $scope.selected_policy = policy;
    $scope.selected_policy.created_at = $rootScope.genService.convertStampToDate(policy.created_at);
    $scope.selected_policy.start_date = $rootScope.genService.convertStampToDate(policy.start_date);
    $scope.selected_policy.end_date = $rootScope.genService.convertStampToDate(policy.end_date);
    $scope.selected_policy.updated_at = $rootScope.genService.convertStampToDate(policy.updated_at);
  }

  /* Select Claim */
  $scope.SelectClaim = function(claim){
    $scope.selected_claim = claim;
  }

  /* Block Company */
  $scope.BlockCompany = function(){
    companyService.blockCompany($stateParams.company, function(){
      $rootScope.genService.showDefaultSuccessMsg('Company Blocked');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /* Unblock Company */
  $scope.UnblockCompany = function(){
    companyService.unblockCompany($stateParams.company, function(){
      $rootScope.genService.showDefaultSuccessMsg('Company Unblocked');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /**
   * Download signed mandate
   * @param {Object} mandate Mandate data
   */
  $scope.downloadMandate = function(mandate){
    if(!mandate) {return}
    const from = "mandates/" + $stateParams.company + "/" + mandate.signed_document_url;
    const rename_to = "Mandate for " + $scope.company.name + " signed at " + moment(mandate.timestamp).format("D MMMM YYYY HH.mm") + ".pdf";
    fileService.downloadWithName(from, rename_to);
  };

  $scope.newgetMandateInformation = function(){
    companyService.getCompanyInformation($stateParams.company, function(company){
      mandateService.getMandateById(company.mandate, mandate=>{
        $scope.mandate = mandate
      },function(error){
        console.error(error);
      })
    },function(error){
      console.error(error);
    })
  };

  /* Get Extraction Help */
  $scope.GetExtractionHelp = function(){
    $rootScope.local_load = true;
    metaService.getInsuranceTypes(function(insurance_types){
      $scope.insurance_types = insurance_types;
      $rootScope.local_load = null;
      $scope.safeApply( fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      console.error(error);
    });
  };

  /* Carrier info*/
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Codes For Company */
  $scope.GetCodesForCompany = function(){
    $rootScope.local_load = true;
    if(!$scope.company.industry_codes) { return }
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

  /*Get Mandate Information*/
  $scope.getMandateInformation = function(){
    mandateService.getSingleMandate($stateParams.company,function(mandates){
      //start pushing the mandates
      $scope.mandates = []
      for (var key in mandates){
        $scope.mandates.push({mandate:mandates[key], key:key});
      }
    },function(error){
      console.error(error);
    })
  }

  /* Get All Offers */
  $scope.GetAllOffers = function(){
    offerService.getOffersForCompany($stateParams.company, offers => {
      $scope.offers = [];
      for(var key in offers){
        $scope.offers.push({offer:offers[key], key:key});
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
    });
  }

  /* Get Answers */
  $scope.GetAnswersToInsuranceQuestions = function() {
    $scope.questions = {};
    metaService.getAllInsuranceQuestions(questions => {
      $scope.questions = questions;
    }, error => {
      console.error(error);
    });
  };

  /* Get Activities */
  $scope.GetActivities = function(forms){
    metaService.getAllActivities(activities => {
      $scope.activities = activities;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /* redirect to edit company industries  */
  $scope.EditIndustries = function(){
    $state.go('selectindustry',{'companyid': $scope.this_company});
  };


  /* redirect to getoffers page  */
  $scope.GetOffers = function(){
    $state.go('getoffer',{'companyid': $scope.this_company});
  };


  /* redirect to edit activities  */
  $scope.EditActivities = function(){
    $state.go('pickactivity',{'companyid': $scope.this_company});
  };

  /* reset user password */
  $scope.ResetUserPassword = function(email){
    authService.resetPassword({'email':email},()=>{
      console.log("reset password for user successfully");
      $rootScope.genService.showDefaultSuccessMsg('reset password for user successfully');
    },error=>{
      console.log("error while resetting the password",error);
      $rootScope.genService.showDefaultErrorMsg("error while resetting the password"+error.message);
    });
  };

  /* Perform upload on file change */
  $scope.MandateFileChanged = function(file){
    if(!file){return}

    mandateService.uploadMandate(file, $stateParams.company, $scope.company.mandate, () => {
      $rootScope.genService.showDefaultSuccessMsg('Mandate uploaded successfully');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser, 'company', 'error', ()=>{}, ()=>{});
    });
  };

  /* Go To Extraction View */
  $scope.GoToExtractionView = function(policy, policy_uid){
    if(policy.display_version === 2){
      $state.go('extractionpreview', {policy:policy_uid})
    } else {
      $state.go('extraction', {policy:policy_uid, company:$stateParams.company})
    }
  }

  /* Go To Offer View */
  $scope.GoToOfferView = function(offer, offer_uid){
    console.log(offer);
    if(offer.display_version === 2){
      $state.go('comparisonpreview', {offer:offer_uid})
      console.log('YO');
    } else {
      console.log('ELSE');
      $state.go('offer', {offer:offer_uid, company:$stateParams.company})
    }
  }


  /******************/
  /* Call On Controller Load */
  $scope.newgetMandateInformation();
  $scope.GetSingleCompanyInformation();
  $scope.GetUsersOfCompany();
  $scope.GetExtractionHelp();
  $scope.GetCarriers();
  $scope.GetActivities();

  /* Uploader Instance */
  // Uploader
  var uploader = $scope.uploader = new FileUploader({});
  uploader.filters.push({
    name: 'customFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      return this.queue.length < 10;
    }
  });

  /**********************************/
  /**  	  Uploader Listeners     **/
  /**********************************/

  uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
    console.info('onWhenAddingFileFailed', item, filter, options);
  };

  // File Added
  uploader.onAfterAddingFile = function(fileItem) {
    console.info('onAfterAddingFile', fileItem);
    console.info('Added file with name', fileItem.file.name);
    $scope.can_upload = true;
    $scope.current_file = fileItem;
  };

  uploader.onAfterAddingAll = function(addedFileItems) {
    console.info('onAfterAddingAll', addedFileItems);
  };
  uploader.onBeforeUploadItem = function(item) {
    console.info('onBeforeUploadItem', item);
  };
  uploader.onProgressItem = function(fileItem, progress) {
    console.info('onProgressItem', fileItem, progress);
  };
  uploader.onProgressAll = function(progress) {
    console.info('onProgressAll', progress);
  };
  uploader.onSuccessItem = function(fileItem, response, status, headers) {
    console.info('onSuccessItem', fileItem, response, status, headers);
  };
  uploader.onErrorItem = function(fileItem, response, status, headers) {
    console.info('onErrorItem', fileItem, response, status, headers);
  };
  uploader.onCancelItem = function(fileItem, response, status, headers) {
    console.info('onCancelItem', fileItem, response, status, headers);
  };
  uploader.onCompleteItem = function(fileItem, response, status, headers) {
    console.info('onCompleteItem', fileItem, response, status, headers);
  };
  uploader.onCompleteAll = function() {
    console.info('onCompleteAll');
  };


}
