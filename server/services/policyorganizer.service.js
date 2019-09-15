"use strict";

const { ENV,
        DEFAULT_LANGUAGE,
        LOG_ERROR, LOG_INFO,
        EMAIL_TYPE_POLICY_DIGITIZED,
        EMAIL_TYPE_POLICY_CANCELED
      } = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const firebase = require('./firebase.service'),
      meta = require('./meta.service'),
      sendlog = require('./logger.service.js'),
      userorganizer = require('./userorganizer.service');

/* Mark Notified */
function mark_notified(key, callback){
  firebase.update_data(appvars.firebase.policies + key, {notified: true}, callback, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'policyorganizer', 'could not set notified to true');
  });
}

/* Send Emails */
function send_emails(params){
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params : params
  },
  () => {},
  error => {
    console.log(error);
    sendlog(LOG_ERROR, 'policyorganizer', 'could not insert into mails tree');
  });
}

const policy_email_types = {
  active: EMAIL_TYPE_POLICY_DIGITIZED,
  deleted: EMAIL_TYPE_POLICY_CANCELED,
};

/* Choose Email to Send */
function choose_email_to_send(result) {
  const company = meta.companies[result.val().company];
  if (!company.users) { return }
  const users = company.users;
  for (let key in users){
    if (users.hasOwnProperty(key)) {
      const user = userorganizer.allusers[key];

      const language = user.language_preference || DEFAULT_LANGUAGE;

      let params = {
        to: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        language,
        type: policy_email_types[result.val().status]
      };

      if(result.val().subject){
        params.policy_type = meta.insurance_types[result.val().subject][`name_${language}`];
      }

      send_emails(params);
    }
  }
}

/* Fetch New Policies */
function fetch_new_policies(){
  console.log('[status] listening for policy changes');
  sendlog(LOG_INFO, 'status', 'Listening for policy changes');
  firebase.on_child_added(appvars.firebase.policies, 'notified', false, result => {
    mark_notified(result.key, () => { choose_email_to_send(result) });
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'policyorganizer', 'failed to fetch new policies');
  });
}

 /* Module Exports */
 module.exports = {fetch_new_policies};
