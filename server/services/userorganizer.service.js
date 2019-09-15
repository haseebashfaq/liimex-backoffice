"use strict";

const { EMAIL_TYPE_WELCOME,
        ENV,
        DEFAULT_LANGUAGE,
        LOG_ERROR, LOG_INFO,
        ON_CHILD_ADDED,
        ON_CHILD_CHANGED,
        ON_CHILD_REMOVED,
        DEV_REPLACE_VERIFY,
        EVENT_TYPE_ON_CHILD_REMOVED} = require('../consts');

const appvars = require('../config/appvars.json')[ENV];
const VERIFICATION_EMAIL_TIMEOUT = 5000;
const VERIFICATION_EMAIL_TIMEING = 500;

/* Requirements */
const firebase = require('./firebase.service'),
      sendlog = require('./logger.service.js'),
      verification_service = require('./emailverification.service'),
      slack_service = require('./slack.service');

/* Mark Sent */
function mark_email_sent(key){
  firebase.update_data(appvars.firebase.users+key, {welcome_email_sent: true} , f => f, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'userorganizer', 'could not set welcome_email_sent to true');
  });
}

/* Mark Verification Email Sent */
function mark_verification_email_sent(key){
  firebase.update_data(appvars.firebase.users+key, {verification_email_sent: true, updated_at:firebase.get_timestamp()} , f => f, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'userorganizer', 'could not set verification_email_sent to true');
  });
}

/* Send Emails */
function send_email(user, key) {
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params : {
      language : user.language_preference || DEFAULT_LANGUAGE,
      type : EMAIL_TYPE_WELCOME,
      first_name : user.first_name,
      last_name : user.last_name,
      to: user.email
    }
  },
    () => {
      mark_email_sent(key);
    },
    error => {
      console.error(error);
      sendlog(LOG_ERROR, 'userorganizer', 'could not insert into mails tree');
    });
}

/**
 * Check Verification
 */
function checkVerification(user, key){
  if(user.force_url === 'verify' && ENV === 'development'){
    firebase.update_data(appvars.firebase.users+key, {force_url: DEV_REPLACE_VERIFY}, () => {
      console.log('[userorganizer] skipped user verification')
    }, error => {
      console.error(error);
    });
  }
}

/* Fetch New Users */
function fetch_new_users() {
  listen_for_email_verifications();
  module.exports.allusers = {};
  console.log('[status] listening for new users');
  sendlog(LOG_INFO, 'status', 'Listening for new users');
  firebase.on(appvars.firebase.users, ON_CHILD_ADDED | ON_CHILD_REMOVED | ON_CHILD_CHANGED,
    (err, data) => {
      let result = data.snapshot;
      if (err) {
        console.error(err);
        sendlog(LOG_ERROR, 'userorganizer', 'failed to fetch new users');
        return
      }
      if (data.event_type === EVENT_TYPE_ON_CHILD_REMOVED) {
        delete module.exports.allusers[data.snapshot.key];
        sendlog(LOG_INFO, 'userorganizer', 'user has been deleted');
      } else {
        module.exports.allusers[data.snapshot.key] = data.snapshot.val();
        checkVerification(data.snapshot.val(), data.snapshot.key);
      }
    });
}

/* Listen For Email Verifications */
function listen_for_email_verifications() {
  console.log('[status] listening for email verifications');
  firebase.on_child_added(appvars.firebase.users, 'verification_email_sent', false,
    result => {
      try{
        if(result.val().email){
          if(Date.now() - result.val().updated_at > VERIFICATION_EMAIL_TIMEOUT || result.val().updated_at === result.val().created_at) {
            verification_service.create_pending_verification(result.key, result.val(), () => {
              mark_verification_email_sent(result.key);
              console.log('VERIFYING');
            });
          } else {
            mark_verification_email_sent(result.key);
          }
        }
      } catch(e) {
        sendlog(LOG_ERROR, 'userorganizer', 'there has been an error in sending an email to a new user')
      }
    }, error => {
      console.error(error);
      sendlog(LOG_ERROR, 'userorganizer', 'failed to email verifications');
    });
}

module.exports = {fetch_new_users};
