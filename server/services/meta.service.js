/**
 * Recommendation Service
 */
"use strict";

const {ENV,
      ON_CHILD_ADDED, ON_CHILD_CHANGED, ON_CHILD_REMOVED,
      EVENT_TYPE_ON_CHILD_ADDED, EVENT_TYPE_CHILD_CHANGED, EVENT_TYPE_ON_CHILD_MOVED, EVENT_TYPE_ON_CHILD_REMOVED, EVENT_TYPE_ON_VALUE,
      LOG_ERROR, LOG_INFO} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

// Requirements
const _ = require('lodash'),

      firebase = require('./firebase.service'),
      sendlog = require('./logger.service.js');

// Variables
let ready = false;
let call_when_ready;
let called = false;



// Fetch Insurance Types
function fetch_insurance_types(){
  firebase.on_child_value(appvars.firebase.insurance_types, 'disabled', false, data => {
    module.exports.insurance_types = data.val();
    console.log('[meta] insurance types updated');
    sendlog(LOG_INFO, 'meta', 'insurance type fetched');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to fetch insurance type');
  });
}

// Fetch Activity Questions
function fetch_activities(){
  firebase.on_child_value(appvars.firebase.activities, 'disabled', false, data => {
    module.exports.activities = data.val();
    console.log('[meta] activities updated');
    sendlog(LOG_INFO, 'meta', 'activities fetched');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to fetch activities');
  });
}

/**
 * Fetch insurance question mapping
 */
function fetch_insurance_question_mapping(){
  console.log('[meta] insurance question mapping updated');
  sendlog(LOG_INFO, 'meta', 'insurance question mapping fetched');
  module.exports.insurance_question_mapping = {};

  firebase.on(appvars.firebase.insurance_question_mapping, ON_CHILD_ADDED | ON_CHILD_REMOVED | ON_CHILD_CHANGED,
    (err, data) => {
      if (err) {
        console.log(err);
        return sendlog(LOG_ERROR, 'meta', 'unable to fetch insurance question mapping');
      }
      if (data.event_type === EVENT_TYPE_ON_CHILD_REMOVED) {
        delete module.exports.insurance_question_mapping[data.snapshot.key];
      } else {
        module.exports.insurance_question_mapping[data.snapshot.key] = data.snapshot.val();
      }
      check_ready();
    });
}

// Fetch Industry Codes
function fetch_insurance_questions(){
  firebase.on_child_value(appvars.firebase.insurance_questions, 'disabled', false, data => {
    module.exports.insurance_questions = data.val();
    console.log('[meta] insurance questions updated');
    sendlog(LOG_INFO, 'meta', 'insurance questions fetched');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to fetch insurance questions');
  });
}

// Remap Industry Codes (With Code as Key)
function remap_industry_codes(){
  module.exports.industry_key_from_code = {};
  for(let key in module.exports.industry_codes){
    if (module.exports.industry_codes.hasOwnProperty(key)) {
      module.exports.industry_key_from_code[module.exports.industry_codes[key].code] = key;
    }
  }
  console.log('[meta] industry codes re-mapped');
  sendlog(LOG_INFO, 'meta', 'industry codes re-mapped');
}

// Fetch Industry Codes
function fetch_industry_codes(){
  firebase.on_child_value(appvars.firebase.industry_codes, 'disabled', false, data => {
    module.exports.industry_codes = data.val();
    remap_industry_codes();
    console.log('[meta] industry codes updated');
    sendlog(LOG_INFO, 'meta', 'industry codes fetched');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to fetch industry codes');
  });
}

// Fetch Carrers
function fetch_carriers(){
  firebase.on_child_value(appvars.firebase.carriers, 'disabled', false, data => {
    module.exports.carriers = data.val();
    console.log('[meta] carriers updated');
    sendlog(LOG_INFO, 'meta', 'carriers fetched');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to fetch carriers');
  });
}

// Set Callback When Ready
function set_ready_callback(callback){
  call_when_ready = callback;
}

/* Get Main Address */
function fetch_main_addresses(){
  module.exports.main_addresses = {};
  console.log('[meta] addresses updated');
  firebase.on_child_added(appvars.firebase.addresses, 'main', true, result => {
    module.exports.main_addresses[result.val().company] = result.val();
    check_ready();
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR,'companyorganizer','failed to fetch companies');
  });
}

// Fetch Companies
function fetch_companies(){
  module.exports.companies = {};
  console.log('[meta] companies updated');
  sendlog(LOG_INFO, 'meta', 'companies updated');

  firebase.on(appvars.firebase.companies, ON_CHILD_ADDED | ON_CHILD_CHANGED | ON_CHILD_REMOVED,
    (err, data) => {
      if (err) {
        console.log(err);
        return sendlog(LOG_ERROR, 'meta', 'unable to fetch companies');
      }
      if (data.event_type === ON_CHILD_REMOVED) {
        delete module.exports.companies[data.snapshot.key];
      } else {
        module.exports.companies[data.snapshot.key] = data.snapshot.val();
      }
    });
}

// Fetch Companies
function fetch_products(){
  module.exports.products = {};
  console.log('[meta] products updated');
  sendlog(LOG_INFO, 'meta', 'products updated');

  firebase.on(appvars.firebase.products, ON_CHILD_ADDED | ON_CHILD_CHANGED | ON_CHILD_REMOVED,
    (err, data) => {
      if (err) {
        console.log(err);
        return sendlog(LOG_ERROR, 'meta', 'unable to fetch products');
      }
      if (data.event_type === ON_CHILD_REMOVED) {
        delete module.exports.products[data.snapshot.key];
      } else {
        module.exports.products[data.snapshot.key] = data.snapshot.val();
      }
    });
}

// Fetch Recommendation Mapping
function fetch_recommendation_mapping(){
  firebase.on_child_value_no_query(appvars.firebase.recommendation_mapping, data => {
    module.exports.recommendation_mapping = data.val();
    console.log('[meta] recommendation mapping updated');
    sendlog(LOG_INFO, 'meta', 'recommendation mapping');
    check_ready()
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'meta', 'unable to recommendation mapping');
  });
}

// Check Ready
function check_ready(){
  if(module.exports.carriers
    && module.exports.insurance_types
    && module.exports.activities
    && module.exports.industry_codes
    && module.exports.insurance_question_mapping
    && module.exports.insurance_questions
    && module.exports.recommendation_mapping
    && module.exports.main_addresses
  ) {
    ready = true;
  }

  if(ready && !called){
    called = true;
    console.log('[status] metadata ready');
    sendlog(LOG_INFO, 'status', 'metadata ready');
    call_when_ready();
  }
}


/* Module Exports */
module.exports = {
  fetch_insurance_types,
  fetch_carriers,
  set_ready_callback,
  fetch_activities,
  fetch_industry_codes,
  fetch_companies,
  fetch_insurance_question_mapping,
  fetch_insurance_questions,
  fetch_recommendation_mapping,
  fetch_main_addresses,
  fetch_products
};
