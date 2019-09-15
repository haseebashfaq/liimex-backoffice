// Angular Module
angular.module('application').controller('OfferController', OfferController);

// Injections
OfferController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService'];

// Function
function OfferController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.deductibleType = {};
    $scope.file_limit = 5;
    $scope.files_to_upload = {};
    $scope.files_uploaded = {};
    $scope.unsaved_changes = false;

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

    /* Get Single Offer */
    $scope.GetSingleOffer = function(callback){
      $rootScope.local_load = true;
      offerService.getSingleOffer($stateParams.offer, function(offer){
        if(offer && offer.display_version && offer.display_version == 2){
          $state.go("comparisonpreview",{"offer":$stateParams.offer});
        }
        companyService.getCompanyInformation(offer.company, function(company){
          $rootScope.local_load = null;
          $scope.offer = offer;
          $scope.num_offers = 0;
          for(var key in offer.comparisons){
            $scope.num_offers++;
          }
          getdeductibleType();
          $scope.company = company;
          $scope.getProductsForThisInsuranceType();
          $scope.GetPolicySpecificCriteria();
          $scope.GetIndustrySpecificCriteria();
          $scope.number_of_eligible_products = $scope.offer.products ? Object.keys($scope.offer.products).length : 0
          $scope.safeApply(fn => fn);
          if (typeof callback === 'function') callback(null, offer);
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
          if (typeof callback === 'function') callback(error);
        });
      }, function(error){
        if (typeof callback === 'function') callback(error);
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Lock */
    $scope.Lock = function(){
      $rootScope.local_load = true;
      offerService.lockToAdvisor($rootScope.user.email, $stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('You have been marked as Advisor');
        backofficeService.logpost({msg:'Offer Locked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    const REPORT_GENERATION_TIMEOUT = 4000;

    $scope.GenerateNewReport = function() {
      $scope.offer_in_progress = true;
      offerService.generateReport($stateParams.offer, function(){
      setTimeout(()=>{
          $scope.GetSingleOffer((err) => {
          if (err || !$scope.offer.report) {
              $scope.offer_broken = true;
          }
          $scope.offer_in_progress = false;
        });
      }, REPORT_GENERATION_TIMEOUT);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error, $rootScope.user.email, 'offer', 'error', ()=>{}, ()=>{});
      });
    };

    /* Unlock */
    $scope.Unlock = function(){
      $rootScope.local_load = true;
      offerService.unlockForAdvisor($stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Unlocked');
        backofficeService.logpost({msg:'Offer unlocked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Finalize Offer */
    $scope.FinalizeOffer = function(chosen_comparison){
      console.log('Finalizing:',chosen_comparison);
      offerService.finalizeOffer($scope.offer.company, $scope.offer.comparisons[chosen_comparison], $stateParams.offer, $scope.offer.subject, result => {
        $state.go('extraction',{ policy:result.policy_uid, company:$scope.offer.company });
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      })
    }

    /* Get Extraction Help */
    $scope.GetExtractionHelp = function(){
      $rootScope.local_load = true;
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Get Carriers */
    $scope.GetCarriers = function(){
      $rootScope.local_load = true;
      $scope.carriers = [];
      $scope.carrier_dictionary = {};
      metaService.getCarriers(function(carriers){
        $scope.carrier_dictionary = carriers;
        for(var key in carriers){
          $scope.carriers.push({key:key, carrier:carriers[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Add Offer */
    $scope.AddOffer = function(){
      $rootScope.local_load = true;
      offerService.addComparison($stateParams.offer,{}, function(){
        $rootScope.genService.showDefaultSuccessMsg('Added');
        backofficeService.logpost({msg:'Offer Added',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})

        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Delete Comparison */
    $scope.DeleteComparison = function(comparison_uid){
      offerService.deleteComparison($stateParams.offer, comparison_uid, function(){
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        backofficeService.logpost({msg:'Delete comparition',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Save */
    $scope.Save = function(){

      // Null every undefined
      for(var key in $scope.offer.comparisons){
        for(var field in $scope.offer.comparisons[key]){
          if(!$scope.offer.comparisons[key][field]){
            $scope.offer.comparisons[key][field] = 0;
          }
        }
        for(var field in $scope.offer.comparisons[key].custom_fields){
          if($scope.offer.comparisons[key].custom_fields[field] === undefined){
            $scope.offer.comparisons[key].custom_fields[field] = 0;
          }
        }
      }
      //
      //
      // //check if deductible is entered in % or number
      //
      // for(var key in $scope.offer.comparisons){
      //   for(var comp_key in $scope.offer.comparisons[key]){
      //     if(!$scope.offer.comparisons[key][comp_key]){
      //       $scope.offer.comparisons[key][comp_key] = 0;
      //     }
      //   }
      // }
      setdeductibleType();
      $scope.offer.display_version = 1;
      console.log($scope.offer);
      offerService.saveOffer($stateParams.offer, $scope.offer, function(){
        console.log($scope.offer);
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        backofficeService.logpost({msg:'Offer saved',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    $scope.Download = function(file){
      offerService.downloadFile(file, $scope.offer.company, function(url_for_download){
        $rootScope.genService.downloadWithLink(url_for_download);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    $scope.DownloadReport = function(){
        const from = "documents/" + $scope.offer.company + "/" + $scope.offer.report;
        const rename_to = "Report for " + $scope.company.name + " for the offer of " + $scope.insurance_types[$scope.offer.subject].name_de + " " + moment($scope.offer.created_at).format("D MMMM YYYY HH.mm") + ".pdf";
        $scope.offer_in_progress = true;
        fileService.downloadWithName(from, rename_to)
          .then(() => {
              $scope.offer_in_progress = false;
              $scope.safeApply();
          })
          .catch(error => {
              $rootScope.genService.showDefaultErrorMsg('Q&A document link is broken');
              backofficeService.logpost(error, $scope.currentUser, 'offer_v2', 'error', () => {
              }, () => {});
              $scope.offer_in_progress = false;
              $scope.offer_broken = true;
              $scope.safeApply();
          })
    };

    /* Get Policy Specific Criteria */
    $scope.GetPolicySpecificCriteria = function(){
      metaService.getPolicySpecificCriteriaFromSubjectTrigger($scope.offer.subject, function(policy_specific_criteria){
        $scope.custom_fields = [];
        for(var key in policy_specific_criteria){
          if(policy_specific_criteria[key].disabled)
            continue;

          for(var field_key in policy_specific_criteria[key].fields){
            $scope.custom_fields.push({key: field_key, field: policy_specific_criteria[key].fields[field_key]});
          }
        }
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Get Industry Specific Criteria */
    $scope.GetIndustrySpecificCriteria = function(){
      $scope.industry_fields = [];
      metaService.getIndustrySpecificCriteriaFromPolicyTrigger($scope.offer.subject, function(industry_criteria){
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
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Mark as Offered */
    $scope.MarkAsOffered = function(){
      let offer_display_version = 1;
      offerService.markOfferAsOffered(offer_display_version, $stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
        backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Revoke Offer */
    $scope.RevokeOffer = function(){
      offerService.revokeOffer($stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Mark as Requested');
        backofficeService.logpost({msg:'Offer revoked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /*get the deductible type based on the suffix added (% for percent)*/
    function getdeductibleType (){
      for(var key in $scope.offer.comparisons){
        $scope.deductibleType[key]= "number";
        var comparisonObj = $scope.offer.comparisons[key];
        $scope.deductibleType[key]
        if (comparisonObj.deductible){
          var suffix = comparisonObj.deductible.toString().slice(-1);
          if (suffix == "%"){
            //trim the % suffix and set the radio button.
            $scope.offer.comparisons[key].deductible = comparisonObj.deductible.slice(0, -1);
            $scope.deductibleType[key]="percent";
          }
        }
      }
    }

    /*set deductible type before saving*/
    setdeductibleType = function(){
      for(var key in $scope.offer.comparisons){
        var comparisonObj = $scope.offer.comparisons[key];
        if(comparisonObj.deductible){
          if($scope.deductibleType[key] == "percent"){
          //append % if the radio is selected for percent.
          $scope.offer.comparisons[key].deductible += "%";
          }
        }
      }
    }

    /* File Changed */
    $scope.FileChanged = function(file){
      if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
        return;
      }
      $scope.files_to_upload[file.name] = file
      $scope.PerformUpload(file)
    }

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

    /* Edit Alias */
    $scope.EditAlias = function(key){
      $scope.selected_document = $scope.files_uploaded[key];
      $scope.selected_document_key = key;
    }

    /* Download Policy */
    $scope.DownloadFile = function(object){
      if(!object) {return}
      const from = "documents/" + $scope.offer.company + "/" + object.file;
      const rename_to = object.alias ? (object.alias + '.pdf') : object.file;
      fileService.downloadWithName(from, rename_to);
    };

    /* Remove From Offer */
    $scope.RemoveFromOffer = function(key){
      offerService.removeDocument($stateParams.offer, $scope.selected_comparison, key, () => {
        delete $scope.files_uploaded[key];
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
      })
    }

    /* Save Document */
    $scope.SaveDocument = function(selected_document) {
      let route = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].route
      let key = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].key
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

    /* Get Documents */
    $scope.GetDocuments = function(){
      if(!$scope.offer) {
        return
      };
      if($scope.files_uploaded){
        $scope.files_uploaded = {};
      }
      for(var key in $scope.offer.comparisons[$scope.selected_comparison].documents){
        let doc = $scope.offer.comparisons[$scope.selected_comparison].documents[key];
        documentService.getDocument(doc.route, doc.key, document => {
          $scope.files_uploaded[doc.key] = null;
          $scope.files_uploaded[doc.key] = document;
          console.log(document);
          $scope.safeApply(fn => fn);
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email, 'offer', 'error',()=>{},()=>{})
        });
      }
    }

    /* Perform upload */
  	$scope.PerformUpload = function(file){
      if(!file){return}
      $rootScope.local_load = true;
      $scope.disableUploadBtn= true;
      documentService.uploadFile(file, $scope.offer.company, file_urls => {
        documentService.createGenericDocument(file_urls, $scope.offer.company, (newUpdateDocuments, document_list) => {
          offerService.addDocumentToOffer(newUpdateDocuments, document_list.document, $stateParams.offer, $scope.selected_comparison, () => {
            $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
            delete $scope.files_to_upload[file.name]
            $rootScope.local_load = null;
            $scope.safeApply(fn => fn);
            $scope.GetSingleOffer();
          }, error => {
            $scope.disableUploadBtn= false;
            $rootScope.local_load = null;
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.code);
            backofficeService.logpost(error,$scope.currentUser,'offer','error',()=>{},()=>{});
          });
        });
      }, error => {
        console.error(error);
        $scope.disableUploadBtn= false;
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
        backofficeService.logpost(error,$scope.currentUser,'offer','error',()=>{},()=>{});
      });
    }

    $scope.SelectComparison = function(key){
      $scope.selected_comparison = key;
      $scope.GetDocuments();
    }

    /* Get Products for Offers Insurance Type */
    $scope.getProductsForThisInsuranceType = function(){
      metaService.getProductsWithInsuranceType($scope.offer.subject, products => {
        $scope.products = products;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
      });
    }

    /* Change Display Version */
    $scope.ChangeDisplayVersion = function(version){
      offerService.changeDisplayVersion($scope.offer, $stateParams.offer, () => {
        $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
        $state.go("comparisonpreview",{"offer":$stateParams.offer});
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
      });
    }

    $scope.EnablePushToClient = function(offerObj){
      let is_enabled = false;
      if(offerObj){
        for(let comparison_id in offerObj.comparisons){
          if(!offerObj.comparisons[comparison_id].carrier || !offerObj.comparisons[comparison_id].start_date || !offerObj.comparisons[comparison_id].end_date || !offerObj.comparisons[comparison_id].premium || !offerObj.comparisons[comparison_id].deductible || !offerObj.comparisons[comparison_id].sum_insured){
            is_enabled = true;
          }
        }
      }
      return is_enabled;
    }

    /* Unsaved Changes */
    $scope.UnsavedChanges = function(){
      $scope.unsaved_changes = true;
    }

    /* On Controller Load */
    $scope.GetSingleOffer();
    $scope.GetExtractionHelp();
    $scope.GetCarriers();

}
