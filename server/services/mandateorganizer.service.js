"use strict";

const {EMAIL_TYPE_MANDATE_SIGNED,
       ENV,
       DEFAULT_LANGUAGE,
       LOG_ERROR, LOG_INFO} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

/* Requirements */
const firebase = require('./firebase.service'),
      meta = require('./meta.service'),
      sendlog = require('./logger.service.js'),
      userorganizer = require('./userorganizer.service');

/* Mark Notified */
function mark_notified(key, callback){
  firebase.update_data(appvars.firebase.mandates+key, {notified: true} , callback, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mandateorganizer', 'could not set notified to true');
  });
}

/**
 * Creates new mandate entry (no linking to the company), see company.comtroller
 * @param company_uid
 * @param callback
 */
function create_new_mandate(company_uid, callback) {
    const now = firebase.get_timestamp();
    firebase.push_data(appvars.firebase.mandates, {
        company: company_uid,
        timestamp: now,
        updated_at: now
    }, mandate_uid => {
        callback(null, mandate_uid);
    }, error => {
        callback(error);
    })
}

/**
 *
 * @param params
 */
function send_email(params){
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params : params
  },
  () => {},
  error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mandateorganizer', 'could not insert into mails tree');
  });
}

/* Choose Email to Send */
function choose_email_to_send(result) {
  if (result.val().status !== 'signed') return;
  const company = meta.companies[result.val().company];
  if (!company.users) return;
  const users = company.users;

  for (let key in users) {
    if (users.hasOwnProperty(key)) {
      const user = userorganizer.allusers[key];

      const params = {
        to: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        language: user.language_preference || DEFAULT_LANGUAGE,
        type: EMAIL_TYPE_MANDATE_SIGNED
      };
      send_email(params);
    }
  }
}

/* Fetch New Mandates */
function fetch_new_mandates(){
  console.log('[status] listening for new mandates');
  sendlog(LOG_INFO, 'status', 'Listening for new mandates');

  firebase.on_child_added(appvars.firebase.mandates, 'notified', false, result => {
    mark_notified(result.key, () => { choose_email_to_send(result) });
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mandateorganizer','failed to fetch new mandates');
  });
}

 module.exports = {
    create_new_mandate,
    fetch_new_mandates
};
