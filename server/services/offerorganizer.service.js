"use strict";

const { ENV,
        DEFAULT_LANGUAGE,
        EMAIL_TYPE_NEW_OFFER_WO_REQUEST,
        EMAIL_TYPE_NEW_OFFER_W_REQUEST,
        EMAIL_TYPE_OFFER_ACCEPTED,
        EMAIL_TYPE_OFFER_REQUESTED,
        LOG_ERROR, LOG_INFO, LOG_WARNING,
        ON_CHILD_ADDED, ON_CHILD_CHANGED,
        EMAIL_TYPE_OFFER_REQUESTED_INTERNAL,
        EMAIL_TYPE_OFFER_ACCEPTED_INTERNAL,
        EVENT_TYPE_ON_CHILD_ADDED } = require('../consts');

const BUNDLE_TIMEOUT_MS = 500;
const BUNDLE_CHECK_TIMEOUT_MS = 250;
const KILLSWITCH_DELAY = 1000;
const BUNDLE_EXPIRY_TIMEOUT = BUNDLE_TIMEOUT_MS * 2;
const bundles = {};
const OFFER_SLACK_DELAY = 100;
let bundling_in_progress = false;

const _ = require('lodash');

const appvars = require('../config/appvars.json')[ENV];

const filegenerator = require('./filegenerator.service.js'),
      firebase = require('./firebase.service'),
      meta = require('./meta.service'),
      sendlog = require('./logger.service.js'),
      userorganizer = require('./userorganizer.service'),
      slack_service = require('./slack.service');


/* Mark Notified */
function mark_notified(key, callback){
  firebase.update_data(appvars.firebase.offers+key, {notified: true} , callback, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'could not set notified to true');
  });
}

/* Mark Processed */
function mark_processed(key, callback){
  firebase.update_data(appvars.firebase.offers+key, {insurance_report_generated: true} , callback, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'could not set notified to true');
  });
}

/* Edit Offer */
function edit_offer(key, data, callback){
  firebase.update_data(appvars.firebase.offers+key, data , callback, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'could not set notified to true');
  });
}

/* Send Emails */
function send_email(params){
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params : params
  } , f => {
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'could not insert into mails tree');
  });
}

/* Choose Email to Send */
function choose_email_to_send(result){
  const company = meta.companies[result.val().company];
  if(!company.users) { return }
  const users = company.users;
  for (let key in users) {
    if (users.hasOwnProperty(key)) {
      let user = userorganizer.allusers[key];

      const language = user.language_preference || DEFAULT_LANGUAGE;

      const params = {
        to: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        language
      };

      params.policy_type = meta.insurance_types[result.val().subject][`name_${language}`];

      if (result.val().status === 'requested') {
        params.type = EMAIL_TYPE_OFFER_REQUESTED;
        send_email(params)
        send_email({
          type: EMAIL_TYPE_OFFER_REQUESTED_INTERNAL,
          language:'en',
          to: appvars.sendgrid.advisory,
          first_name: user.first_name,
          last_name: user.last_name,
          user_phone_number: company.phone,
          user_email: user.email,
          company_name: company.name
        })
      } else if (result.val().status === 'accepted') {
        params.type = EMAIL_TYPE_OFFER_ACCEPTED;
        send_email(params)
      } else if (result.val().status === 'pushed' && result.val().not_requested === true) {
        params.type = EMAIL_TYPE_NEW_OFFER_WO_REQUEST;
        send_email(params)
      } else if (result.val().status === 'pushed') {
        params.type = EMAIL_TYPE_NEW_OFFER_W_REQUEST;
        send_email(params)
      }
    }
  }
}


/**
 * Collect questions for a single question mapping key, incl. children
 * @param question_mapping
 * @param key
 * @return {{}}
 * @private
 */
function _collect_questions(question_mapping, key) {
  const questions_dict = {};
  const question = meta.insurance_questions[key];
  if (!question) return;
  const children = [];
  for (let child_key in question_mapping[key].children) {
    if (question_mapping[key].children.hasOwnProperty(child_key)) {
      children.push(child_key);
    }
  }
  if (!questions_dict[question.question_type]) questions_dict[question.question_type] = {};
  questions_dict[question.question_type][question_mapping[key].order] = {
    question: key,
    children
  };
  return questions_dict;
}

/* Generate Insurance Report */
function generate_insurance_report(result){
  const offer = result.val();

  if(!meta.insurance_question_mapping.insurance_types[offer.subject]
    || !meta.insurance_question_mapping.insurance_types[offer.subject].questions
    || !meta.companies[offer.company].insurance_questionnaire)
  {
      console.log('Not enough data to generate offer report');
      sendlog(LOG_INFO, 'offers', `unsuccesfully tried to generate report for: ${offer.company} with error: not enough data`);
      return;
  }

  const question_mapping = Object.assign({},
    meta.insurance_question_mapping.insurance_types[offer.subject].questions,
    meta.insurance_question_mapping.insurance_types['general'].questions,
    meta.insurance_question_mapping.insurance_types['confirmatory'].questions
  );

  let questions_dict = {};

  _.each(question_mapping, (mapping, key) => {
    const collected_questions = _collect_questions(question_mapping, key);
    if (!_.isEmpty(collected_questions)) {
      questions_dict = _.defaultsDeep(questions_dict, collected_questions);
    }
  });

  if (!_.isEmpty(offer.products)) {
    questions_dict.products = {};
    _.each(offer.products, (bool, product_key) => {
       const product_mapping = meta.insurance_question_mapping.products[product_key].questions;
       _.each(product_mapping, (mapping, key) => {
         const collected_questions = _collect_questions(product_mapping, key);
         if (!_.isEmpty(collected_questions)) {
           questions_dict.products[product_key] = _.defaultsDeep(questions_dict.products[product_key], collected_questions.specific);
         }
       })
    });
  }

  console.log('[offers] generating file for: ' + offer.company);
  sendlog(LOG_INFO, 'offers', 'generating file for: ' + offer.company);

  filegenerator.generate_insurance_questions_report(offer, offer.subject, offer.company, questions_dict,
      file_name => {
        edit_offer(result.key, {report:file_name}, success => {
          console.log('[offers] file generated for: '+offer.company);
          sendlog(LOG_INFO, 'offers', 'file generated for: '+offer.company);
        });
      }, error => {
        console.error(error);
        sendlog(LOG_ERROR, 'offers', 'unsuccesfully tried to generate report for: '+offer.company + ' with error: '+error);
      })
}

function order_killswitch_check() {
    setTimeout(()=>{
       if (bundling_in_progress) {
         if (_.isEmpty(bundles)) {
            bundling_in_progress = false;
            sendlog(LOG_WARNING, 'offerorganizer', 'bundling terminated via killswitch');
         } else {
           let found_expired_bundles = false;
           _.each(bundles, (bundle) => {
             found_expired_bundles = found_expired_bundles || (Date.now() - bundle.timestamp > BUNDLE_EXPIRY_TIMEOUT);
           });
           if (found_expired_bundles) {
             bundling_in_progress = false;
             sendlog(LOG_WARNING, 'offerorganizer', 'bundling terminated via killswitch');
           } else {
             order_killswitch_check();
           }
         }
       }
    }, KILLSWITCH_DELAY);
}

/**
 * Check if we have pending offer emails to send
 */
function check_bundle() {
  const kill_list = [];
  _.each(bundles, (bundle, company_id) => {
    if (Date.now() - bundle.timestamp > BUNDLE_TIMEOUT_MS) {
      choose_email_to_send(bundle.offers.pop());
      kill_list.push(company_id);
    }
  });

  _.each(kill_list, company_id => {delete bundles[company_id]});

  if (_.isEmpty(bundles)) {
    bundling_in_progress = false;
    return;
  }

  setTimeout(check_bundle, BUNDLE_CHECK_TIMEOUT_MS);
}

/**
 * Add offer notification to the sending queue
 * @param result
 */
function bundle_notification_email(result) {
  const offer = result.val();
  if (_.isEmpty(bundles[offer.company])) {
    bundles[offer.company] = {
      offers: []
    }
  }
  bundles[offer.company].offers.push(result);
  bundles[offer.company].timestamp = Date.now();

  if (!bundling_in_progress) {
    bundling_in_progress = true;
    order_killswitch_check();
    setTimeout(check_bundle, BUNDLE_CHECK_TIMEOUT_MS);
  }
}

/* Fetch New Offers That Are Unnotified */
function fetch_new_offers(){
  console.log('[status] listening for offers');
  sendlog(LOG_INFO, 'status', 'Listening for new offers');

  firebase.on_child_added(appvars.firebase.offers, 'notified', false, result => {
    mark_notified(result.key, () => { bundle_notification_email(result) });
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'failed to fetch new offers');
  });

  firebase.on_child_added(appvars.firebase.offers, 'insurance_report_generated', false, result => {
    mark_processed(result.key, () => {
      try{
        generate_insurance_report(result)
      } catch(error){
        console.error(error);
        sendlog(LOG_ERROR, 'offers', `unsuccesfully tried to generate report for: ${result.val().company} with error: ${error}`);
      }
    });
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'offerorganizer', 'failed to fetch new offers');
  });
}

/* Decide Slack Message */
function decide_slack_message(result, event_type){
  let offer = result.val();
  if(!offer.created_at){
    return;
  }
  if(Date.now()-offer.created_at <= OFFER_SLACK_DELAY && event_type === EVENT_TYPE_ON_CHILD_ADDED){
    slack_service.post_changed_offer('Nice! A Client has *Requested* an offer', offer);
  } else if (offer.status !== module.exports.offers[result.key].status){
    module.exports.offers[result.key] = offer;
    if(offer.status === 'accepted'){
      slack_service.post_changed_offer('Wow! An offer has been *Accepted*', offer);
      let company = meta.companies[offer.company];
      let user = userorganizer.allusers[Object.keys(company.users)[0]];
      send_email({
        type: EMAIL_TYPE_OFFER_ACCEPTED_INTERNAL,
        language:'en',
        to: appvars.sendgrid.advisory,
        first_name: user.first_name, 
        last_name: user.last_name,
        user_phone_number: company.phone,
        user_email: user.email,
        company_name: company.name
      })
    } else if(offer.status === 'pushed'){
      slack_service.post_changed_offer('Cool! We *Pushed* an offer', offer);
    }
  }
}

/* Fetch Offers for Slack Messages */
function fetch_offers_for_slack(){
  module.exports.offers = {};
  firebase.on(appvars.firebase.offers, ON_CHILD_ADDED | ON_CHILD_CHANGED, (err, data) => {
    let result = data.snapshot;
    if (err) {
      console.error(err);
      sendlog(LOG_ERROR, 'offerorganizer', 'failed to fetch new offers for slack');
      return
    }
    if(data.event_type === EVENT_TYPE_ON_CHILD_ADDED){
      module.exports.offers[result.key] = result.val();
    }
    decide_slack_message(result, data.event_type)
  })
}

module.exports = {
  fetch_new_offers,
  fetch_offers_for_slack
};
