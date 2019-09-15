// Angular Module
angular.module('application').controller('ComparisonPreviewController', ComparisonPreviewController);

// Injections
ComparisonPreviewController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'extractionService', 'metaService', 'FoundationApi', 'backofficeService', 'fileService', 'documentService', '$sce'];

// Function
function ComparisonPreviewController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, extractionService, metaService, FoundationApi, backofficeService, fileService, documentService, $sce) {

  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  /* Scope Variables */
  $scope.offer_uid = $stateParams.offer;
  const REPORT_GENERATION_TIMEOUT = 4000;
  $scope.Math = window.Math;
  $scope.file_limit = 5;
  $scope.files_to_upload = {};
  $scope.files_uploaded = {};

  /* WD50 */
  $scope.safeApply = function (fn = fn => fn) {
    if (!this.$root) {
      return;
    }
    const phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  $scope.max_offer_count = 3;

  $scope.generic_keys = {
    'general': 'General',
    'specific': 'Specific',
    'additional': 'Additional Insurance Modules'
  };

    /**
     * Prepare html string to be displayed as part of the DOM
     * @param {String} html Raw html data
     * @return {String} Trusted html string
     */
  $scope.transformToHtml = function(html){
    return $sce.trustAsHtml(html);
  };

  /**
   * Retrieve offer section caption by text key
   * @param {String} key Section text key or industry type
   * @return {String} Section text caption
   */
  $scope.getSectionName = function (key) {
    if (!key) {
        return '';
    }
    if ($scope.comparisons && $scope.comparisons[key]) {
        return $scope.comparisons[key].name_de;
    }
    return $scope.generic_keys[key] || key;
  };

  $scope.includeCriteria = function(comparison_uid, insurance_type_uid, criteria_uid, callback) {
      $scope.onInlineChange({
          comparison_uid,
          insurance_type_uid,
          criteria_uid,
          value_type: 'specific',
          key: 'included'}, true, callback);
  };

  $scope.excludeCriteria = function(comparison_uid, insurance_type_uid, criteria_uid, callback) {
      $scope.onInlineChange({
          comparison_uid,
          insurance_type_uid,
          criteria_uid,
          value_type: 'specific',
          key: 'included'}, false, callback);
  };

  $scope.switchToPercents = function(identity, callback) {
      const params = Object.assign({}, identity, {key: 'deductible_is_percent'});
      $scope.onInlineChange(params, true, callback);
  };

  $scope.switchToAbsolute = function(identity, callback) {
      const params = Object.assign({}, identity, {key: 'deductible_is_percent'});
      $scope.onInlineChange(params, false, callback);
  };

    $scope.switchToUnlimited = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'unlimited_sum_insured'});
        $scope.onInlineChange(params, true, callback);
    };

    $scope.switchToLimited = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'unlimited_sum_insured'});
        $scope.onInlineChange(params, false, callback);
    };

    $scope.switchMaxToPercents = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'deductible_max_is_percent'});
        $scope.onInlineChange(params, true, callback);
    };

    $scope.switchMaxToAbsolute = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'deductible_max_is_percent'});
        $scope.onInlineChange(params, false, callback);
    };

  $scope.onInlineChange = function(identity, value, callback) {
      const params = Object.assign({offer_uid: $scope.offer_uid, value}, identity);
      console.log(identity, value);
      offerService.updateSingleValue(params, () => {
          loadOffer();
          if (typeof callback === 'function') {
              callback();
          }
      }, err => {
          if (typeof callback === 'function') {
              callback(err);
          }
          console.log(err);
      });
  };

  $scope.onRightIcon = function(identity, value, action, callback) {
      if (action === 'exclude') {
          $scope.excludeCriteria(identity.comparison_uid, identity.insurance_type_uid, identity.criteria_uid, callback);
      }
      if (action === 'to_unlimited') {
          $scope.switchToUnlimited(identity, callback);
      }
      if (action === 'to_limited') {
          $scope.switchToLimited(identity, callback);
      }
      if (action === 'to_percent') {
          $scope.switchToPercents(identity, callback);
      }
      if (action === 'to_absolute') {
          $scope.switchToAbsolute(identity, callback);
      }
      if (action === 'max_to_percent') {
          $scope.switchMaxToPercents(identity, callback);
      }
      if (action === 'max_to_absolute') {
          $scope.switchMaxToAbsolute(identity, callback);
      }
  };

  $scope.includedDefined = function(included) {
      return typeof included === 'boolean';
  };

  /**
   * Apply class for the comparison criteria
   * @param {Object | false} comparison Offer comparison object
   * @return {String} Class name
   */
  $scope.checkCoverage = function (comparison, comparison_uid, insurance_type_uid) {
    if (typeof $scope.offer.comparisons[comparison_uid].insurance_types[insurance_type_uid] === 'undefined') {
        return "not-used";
    }
    if (!comparison || typeof comparison.included !== 'boolean') {
        return "not-applicable";
    }
    if (!comparison.included) {
        return "not-included";
    }
    if (comparison.included && comparison.sublimit == null) {
        return 'is-empty';
    }
    return '';
  };

  $scope.checkEmptyCell = function(value) {
        if (value == null) return 'is-empty';
        return '';
  };

  /* Check Basic */
  $scope.checkBasic = function(basic_criteria){
    if (typeof basic_criteria === 'undefined') return "not-applicable";
    return '';
  };

  $scope.filterNullHandling = function(branch_key) {
    return Boolean($scope.comparisons || branch_key === 'general');
  };

  /**
   * Apply class for the empty insurance type header
   * @param {Object | false} insurance_type
   * @return {string}
   */
  $scope.checkEmpty = function (insurance_type) {
    return insurance_type ? '' : 'empty';
  };

  $scope.checkObsolete = function (insurance_type_key, criterion_key) {
    if (!$scope.obsolete_criteria[insurance_type_key]) return '';
    return $scope.obsolete_criteria[insurance_type_key][criterion_key] ? 'obsolete' : '';
  };

  $scope.isEditEnabled = function() {
      return $scope.offer.status === 'requested' && $scope.offer.advisor === $scope.user.email;
  };

  /**
   * Retrieve comparisons for the single insurance type
   * @param {String} insurance_type_key
   * @param {Object} company
   * @return {Promise}
   */
  function getInsuranceIndustryComparisons(insurance_type_key, company) {
    return new Promise((resolve, reject) => {
      extractionService.getSpecificCriteriaForIndustryCodes(insurance_type_key, company.industry_codes, (res) => {
        resolve(res.specificCriterias || []);
      }, reject);
    });
  }

  /**
   * Get all possible comparison criteria for the given offer and company
   * @param {Object} offer
   * @param {Object} company
   * @param {Function} callback
   */
  function prepareMappedComparisons(offer, company, callback) {
    const insurance_types = new Set();
    Object.keys(offer.comparisons || {}).forEach(comparison_key => {
      Object.keys(offer.comparisons[comparison_key].insurance_types || {}).forEach(insurance_type_key => insurance_types.add(insurance_type_key));
    });

    const insurance_type_keys = [...insurance_types];

    function mapType(insurance_type_key) {
      return getInsuranceIndustryComparisons(insurance_type_key, company);
    }

    Promise.all(insurance_type_keys.map(mapType))
      .then(comparisons => {
        const cache = {};
        insurance_type_keys.forEach((insurance_type_key, i) => {
          cache[insurance_type_key] = comparisons[i];
        });
        callback(null, cache);
      })
      .catch(callback);
  }

  /**
   * Retrieve current offer from the database and prepare the data for the template
   */
  function loadOffer() {
    $rootScope.local_load = true;

    $scope.offer_id = $stateParams.offer;

    offerService.getSingleOffer($stateParams.offer, function (offer) {
      companyService.getCompanyInformation(offer.company, function (company) {
        prepareMappedComparisons(offer, company, function (err, criteria) {
          $scope.criteria = criteria;
          if (err) return console.log(err);

          $scope.offer = offer;
          $scope.company = company;
          $scope.offer_count = 0;

          $scope.getProductsForThisInsuranceType();
          $scope.number_of_eligible_products = $scope.offer.products ? Object.keys($scope.offer.products).length : 0;

          $scope.tree = {};

          if (offer.comparisons) {

            $scope.comparison_keys = Object.keys($scope.offer.comparisons);
            $scope.offer_count = $scope.comparison_keys.length;

            $scope.compare_insurance_types = [];
            $scope.general={};

            $scope.tree = {
              specific: {},
              additional: {}
            };

            $scope.branch_keys = Object.keys($scope.tree);
            $scope.obsolete_criteria = {};

            //iterate offer comparisons
            $scope.comparison_keys.forEach(comparison_key => {
              const comparison = offer.comparisons[comparison_key];

              //iterate comparison insurance types
              for (let insurance_type_key in comparison.insurance_types) {
                if (comparison.insurance_types.hasOwnProperty(insurance_type_key)) {
                  const insurance_type = comparison.insurance_types[insurance_type_key];

                  if (typeof insurance_type === 'object') { //Dev.purposes mostly: we don't expect this to be false in real life

                    /**
                     * Additional & Specific
                     */

                    const comparison_type = insurance_type_key === offer.subject ? 'specific' : 'additional';

                    //Combining criteria from comparison object with industry/insurance criteria mapping
                    const related_criteria = [...new Set((criteria[insurance_type_key] || []).concat(Object.keys(insurance_type.specific || {})))];

                    if (related_criteria.length) { //There're applicable criteria for this insurance/industry
                      if (!$scope.tree[comparison_type][insurance_type_key]) $scope.tree[comparison_type][insurance_type_key] = {};

                      related_criteria.forEach(criterion_key => {
                        if (!$scope.tree[comparison_type][insurance_type_key][criterion_key]) $scope.tree[comparison_type][insurance_type_key][criterion_key] = {};
                        $scope.tree[comparison_type][insurance_type_key][criterion_key][comparison_key] = insurance_type.specific ? insurance_type.specific[criterion_key] : false;

                        // Checking for the "obsolete" criteria. I.e. the criteria that exist in the offer, but have been removed from the mapping
                        if (criteria[insurance_type_key].indexOf(criterion_key) === -1) {
                          if (!$scope.obsolete_criteria[insurance_type_key]) $scope.obsolete_criteria[insurance_type_key] = {};
                          $scope.obsolete_criteria[insurance_type_key][criterion_key] = true;
                        }
                      });
                    } else { //Empty insurance type has no applicable criteria
                      $scope.tree[comparison_type][insurance_type_key] = false;
                    } //if (related_criteria.length)
                  } //if (typeof insurance_type === 'object')
                } //if (comparison.insurance_types.hasOwnProperty(insurance_type_key))
              }

            });
          }
          $rootScope.local_load = null;
          $scope.adding_comparison = false;
          $scope.copying_comparison = false;
          $scope.CheckModel();
            console.log($scope.tree);
            console.log($scope.offer.comparisons);
          $scope.safeApply();
        }); //prepareMappedComparisons(offer, company, function (err, criteria)
      }); //companyService.getCompanyInformation(offer.company, function (company)
    }); //offerService.getSingleOffer($stateParams.offer, function (offer)
  }

  $scope.addSingleComparison = function(comparison_uid, insurance_type_id) {
    // $rootScope.local_load = true;
    Object.assign($scope.offer.comparisons[comparison_uid].insurance_types, {[insurance_type_id]: {specific : false}});
    offerService.saveComparison($stateParams.offer, comparison_uid, $scope.offer.comparisons[comparison_uid], () => {
      $rootScope.genService.showDefaultSuccessMsg('Insurance Type added');
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /* Make Preferred */
  $scope.MakePreferred = function(comparison_key){
    $rootScope.local_load = true;
    $scope.offer.preferred = comparison_key;
    offerService.saveOffer($stateParams.offer, $scope.offer, () => {
      $rootScope.genService.showDefaultSuccessMsg('Marked Preferred');
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /**
   * Remove comparison from the current offer
   * @param comparison_uid
   */
  $scope.deleteComparison = function (comparison_uid) {
    $rootScope.local_load = true;
    offerService.deleteComparison($stateParams.offer, comparison_uid, () => {
      loadOffer();
      FoundationApi.publish('comparison-deletion-modal', 'hide');
      $rootScope.genService.showDefaultSuccessMsg('Comparison deleted');
    }, (err) => {
      console.log(err);
    })
  };

  /**
   * Remove insurance type from the offer
   * NB! Not applicable to the offer subject
   * @param insurance_type_key
   */
  $scope.deleteInsuranceType = function (insurance_type_key, comparison_key) {
    $rootScope.local_load = true;
    if (insurance_type_key === $scope.offer.subject) { return; }
    const comparison_keys = comparison_key ? [comparison_key] : $scope.comparison_keys;
    Promise.all(comparison_keys.map(comparison_key => {
      return new Promise((resolve, reject) => {
        offerService.deleteOfferInsuranceType($stateParams.offer, comparison_key, insurance_type_key, resolve, reject);
      });
    }))
    .then(() => {
      loadOffer();
      FoundationApi.publish('insurance-type-deletion-modal', 'hide');
    })
    .catch(console.log);
  };

  /**
   * Remove criterion data from the offer.
   * NB! It will not remove criterion from the insurance type or industry
   * @param insurance_type_key
   * @param criterion_key
   */
  $scope.purgeCriterion = function (insurance_type_key, criterion_key) {
    Promise.all($scope.comparison_keys.map(comparison_key => {
      return new Promise((resolve, reject) => {
        offerService.deleteOfferCriteria($stateParams.offer, comparison_key, insurance_type_key, criterion_key, resolve, reject);
      });
    }))
      .then(() => {
        loadOffer();
        FoundationApi.publish('criterion-deletion-modal', 'hide');
      })
      .catch(console.log);
  };

  const criteria_dummy = {
    sum_insured: 0,
    deductible_absolute_max: 0,
    deductible_absolute_min: 0,
    deductible_is_percent: false,
    deductible_percent_max: 0,
    included: false,
    maximisation: 1
  };

  /* Remove From Offer */
  $scope.RemoveFromOffer = function(key){
    offerService.removeDocument($stateParams.offer, $scope.selected_comparison, key, () => {
      delete $scope.files_uploaded[key];
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
    })
  };

  /**
   * Create a new blank comparison in the current offer
   * @return {undefined}
   */
  $scope.createNewComparison = function () {
    if ($scope.offer_count < $scope.max_offer_count) {
      $scope.adding_comparison = true;

      const comparison = {
        basic : {insurance_tax : 19},
        insurance_types: {
          [$scope.offer.subject]: {
            general: Object.assign({}, criteria_dummy),
            specific: {}
          }
        }
      };

      offerService.addComparison($stateParams.offer, comparison, () => {
        loadOffer();
      }, err => {
        console.log(err);
      });
    }
  };

  /**
   * Duplicate Comparison
   */
  $scope.DuplicateComparison = function (old_comparison, comparison_key) {
    if ($scope.offer_count < $scope.max_offer_count) {
      $scope.copying_comparison = {}
      $scope.copying_comparison[comparison_key] = true;
      const comparison = old_comparison
      offerService.addComparison($stateParams.offer, comparison, () => {
        loadOffer();
      }, (err) => {
        console.log(err);
      });
    }
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
  };

  /* Edit Alias */
  $scope.EditAlias = function(key){
    $scope.selected_document = $scope.files_uploaded[key];
    $scope.selected_document_key = key;
  };

  /* Perform upload */
  $scope.PerformUpload = function(file){
    if(!file){ return }
    $rootScope.local_load = true;
    $scope.disableUploadBtn= true;
    documentService.uploadFile(file, $scope.offer.company, file_urls => {
      documentService.createGenericDocument(file_urls, $scope.offer.company, (newUpdateDocuments, document_list) => {
        offerService.addDocumentToOffer(newUpdateDocuments, document_list.document, $stateParams.offer, $scope.selected_comparison, () => {
          $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
          delete $scope.files_to_upload[file.name];
          $rootScope.local_load = null;
          loadOffer();
        }, error => {
          $scope.disableUploadBtn= false;
          $rootScope.local_load = null;
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.code);
          backofficeService.logpost(error,$scope.currentUser,'offer_v2','error',()=>{},()=>{});
        });
      });
    }, error => {
      console.error(error);
      $scope.disableUploadBtn= false;
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Save Document */
  $scope.SaveDocument = function(selected_document) {
    let route = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].route;
    let key = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].key;
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
  };

  /* Download Policy */
  $scope.DownloadFile = function(object){
    if(!object) { return }
    const from = "documents/" + $scope.offer.company + "/" + object.file;
    const rename_to = object.alias ? (object.alias + '.pdf') : object.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* Mark as Offered */
  $scope.MarkAsOffered = function(){
    $rootScope.local_load = true;
    let offer_display_version = 2;
    offerService.markOfferAsOffered(offer_display_version, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
      backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };


  $scope.note_editor = {};

  /**
   * Edit Note
   */
  $scope.EditNote = function(comparison_uid){
    if (!$scope.isEditEnabled()) return;
    $scope.note_editor.comparison_uid = comparison_uid;
    $scope.note_editor.html = $scope.offer.comparisons[comparison_uid].basic.note || '';
    FoundationApi.publish('edit_note_modal', 'show');    
    $scope.safeApply(fn => fn);
  };

  $scope.SaveNote = function(note_html){

      const params = {
          offer_uid: $stateParams.offer,
          comparison_uid: $scope.note_editor.comparison_uid,
          value_type: 'basic',
          key: 'note',
          value: note_html
      };
      offerService.updateSingleValue(params, () => {
          $scope.key_note_edit = null;
          $rootScope.genService.showDefaultSuccessMsg('Saved');
          FoundationApi.publish('edit_note_modal', 'close');
          loadOffer();
      }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
      });
  };

  /* Mark as Offered Dont Notify */
  $scope.MarkAsOfferedDontNotify = function(){
    $rootScope.local_load = true;
    let offer_display_version = 2;
    offerService.markOfferAsOfferedDontNotify(offer_display_version, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
      backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{})
    });
  };

  /* Generate New Report */
  $scope.GenerateNewReport = function() {
    $scope.offer_in_progress = true;
    offerService.generateReport($stateParams.offer, function(){
      setTimeout(()=>{
        $scope.offer_in_progress = false;
        loadOffer();
      }, REPORT_GENERATION_TIMEOUT);
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error, $rootScope.user.email, 'offer_v2', 'error', ()=>{}, ()=>{});
    });
  };

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
  };

  /* Revoke Offer */
  $scope.RevokeOffer = function(){
    $rootScope.local_load = true;
    offerService.revokeOffer($stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Mark as Requested');
      backofficeService.logpost({msg:'Offer revoked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Lock */
  $scope.Lock = function(){
    $rootScope.local_load = true;
    offerService.lockToAdvisor($rootScope.user.email, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('You have been marked as Advisor');
      backofficeService.logpost({msg:'Offer Locked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      $rootScope.local_load = null;
      loadOffer();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Unlock */
  $scope.Unlock = function(){
    $rootScope.local_load = true;
    offerService.unlockForAdvisor($stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Unlocked');
      backofficeService.logpost({msg:'Offer unlocked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      $rootScope.local_load = null;
      loadOffer();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  $scope.requestDeleteComparison = function(comparison_key) {
    $scope.delete_comparison = {
      key: comparison_key,
      comparison: $scope.offer.comparisons[comparison_key]
    };
    FoundationApi.publish('comparison-deletion-modal', 'show');
  };

  $scope.requestDeleteInsuranceType = function(insurance_type_key, comparison_key) {
    $scope.delete_insurance_type = {
      key: insurance_type_key,
      insurance_type: $scope.insurance_types[insurance_type_key]
    };
    if (comparison_key) {
      $scope.delete_insurance_type['comparison_key'] = comparison_key;
      $scope.delete_insurance_type['comparison'] = $scope.offer.comparisons[comparison_key];
    }
    FoundationApi.publish('insurance-type-deletion-modal', 'show');
  };

  $scope.requestPurgeCriterion = function(insurance_type_key, criteria_key) {
    $scope.delete_criterion = {
      key: criteria_key,
      insurance_type_key: insurance_type_key,
      insurance_type: $scope.insurance_types[insurance_type_key]
    };
    FoundationApi.publish('criterion-deletion-modal', 'show');
  };

  metaService.getInsuranceTypes(function (insurance_types) {
    $scope.insurance_types = insurance_types;
  });
  metaService.getCarriers(function (carriers) {
    $scope.carriers = carriers;
  });
  metaService.getAllComparisonCriteria(function (comparisons) {
    $scope.comparisons = comparisons;
  });

  /* Get Documents */
  $scope.GetDocuments = function(){
    $scope.documents_viewable = false;
    if(!$scope.offer) {
      return
    }
    if($scope.files_uploaded){
      $scope.files_uploaded = {};
    }
    const comparison_documents = $scope.offer.comparisons[$scope.selected_comparison].documents;
    for (let key in comparison_documents){
      if (comparison_documents.hasOwnProperty(key)) {
        let doc = comparison_documents[key];
        documentService.getDocument(doc.route, doc.key, document => {
          $scope.files_uploaded[doc.key] = null;
          $scope.files_uploaded[doc.key] = document;
          $scope.documents_viewable = true;
          $scope.safeApply(fn => fn);
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error, $rootScope.user.email, 'offer_v2', 'error', () => {
          }, () => {
          })
        });
      }
    }
  };

  /* Finalize Offer */
  $scope.FinalizeOffer = function(chosen_comparison){
    $scope.offer.comparisons[chosen_comparison].display_version = 2;
    offerService.finalizeOffer($scope.offer.company, $scope.offer.comparisons[chosen_comparison], $stateParams.offer, $scope.offer.subject, result => {
      $rootScope.genService.showDefaultSuccessMsg('New Extraction Created from Offer');
      $state.go('extractionpreview',{policy: result.policy_uid});
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{})
      console.error(error);
    })
  };

  /* Length Of Object */
  $scope.LengthOfObject = function(object){
    if(!object){
      return '0';
    }
    let length = Object.keys(object).length;
    return length || '0';
  };

  $scope.SelectComparison = function(key){
    $scope.selected_comparison = key;
    $scope.GetDocuments();
  };

  /* Check Model */
  // Returns true for a Disabled Button and False for an Enabled
  $scope.CheckModel = function(){
    $scope.isModelValid = true;
    for (var key in $scope.offer.comparisons){
      const comparison = $scope.offer.comparisons[key];
      const is_basic_valid = Boolean(comparison.basic.carrier && comparison.basic.start_date && comparison.basic.premium != null && comparison.basic.insurance_tax != null);
      if(!is_basic_valid){
        $scope.isModelValid = false;
        break;
      }
      for (var type_key in comparison.insurance_types){
        const general = comparison.insurance_types[type_key].general;
        if (!general) {
            $scope.isModelValid = false;
            break;
        }
        const is_general_valid = Boolean(
                (general.sum_insured != null || general.unlimited_sum_insured) &&
                 general.maximisation != null &&
                (general.deductible_is_percent ? general.deductible_percent != null : general.deductible_absolute != null)
        );
        if (!is_general_valid){
            $scope.isModelValid = false;
            break;
        }

        for (let criteria_key in comparison.insurance_types[type_key].specific) {
            const criteria = comparison.insurance_types[type_key].specific[criteria_key];
            const is_criteria_valid = criteria.included === false || (criteria.included && criteria.sublimit != null);
            if (!is_criteria_valid){
                $scope.isModelValid = false;
                break;
            }

        }

      }
    }
  };
  loadOffer();

}
