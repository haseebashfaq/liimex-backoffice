"use strict";

/* Constants */
const { ENV, LOG_ERROR, LOG_INFO, EMAIL_TYPE_VERIFICATION, DEFAULT_LANGUAGE, BASE_LINK_API } = require('../consts')
const firebase = require('./firebase.service');
const sendlog = require('./logger.service.js');
const appvars = require('../config/appvars.json')[ENV];
const uuid = require('uuid/v4');

/* Mark Email as Verified */
let mark_email_as_verified = (user_uid, callback, err_call) => {
  firebase.verify_user_email(user_uid, callback, err_call)
}

/* Send Verification Email */
let send_verification_email = (user, verification_link, callback) => {
  let params = {};
  params.language = user.language_preference || DEFAULT_LANGUAGE;
  params.type = EMAIL_TYPE_VERIFICATION;
  params.link_email_verification = verification_link
  params.to = user.email;
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params
  }, callback, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'email-verification', 'could not insert into mails tree');
  });
}

/* Get Verification Code */
let get_verification_code = () => {
  let verification_code = uuid();
  return verification_code;
}

/* Create Pending Verification */
module.exports.create_pending_verification = (user_uid, user, callback) => {
  let verification_code = get_verification_code();
  let verification_link = BASE_LINK_API.concat('verifyemail?verification_code=',verification_code,'&user_uid=',user_uid);
  let now = firebase.get_timestamp();
  firebase.push_data(appvars.firebase.email_verifications, {
    user_uid,
    email:user.email,
    verification_code,
    created_at:now,
    updated_at:now
  }, () => {
    send_verification_email(user, verification_link, callback);
  }, error => {
    sendlog(LOG_ERROR, 'email-verification', 'could create verification object for: '+user.email+' error: '+error);
  });
}

/* Verify Email */
module.exports.verify_email = (verification_code, user_uid, callback, err_call) => {
  firebase.get_data_once_equal_to(appvars.firebase.email_verifications, 'user_uid', user_uid, result => {

    // Sorting for newest
    let newest_result = {created_at : 0}
    for(let key in result){
      if(result[key].created_at > newest_result.created_at){
        newest_result = result[key]
      }
    }

    // Decide Validity of Code
    if(!newest_result || !newest_result.verification_code){
      err_call()
      sendlog(LOG_INFO, 'email-verification', 'someone fried to verify with a NULL code');
    } else if(newest_result.verification_code === verification_code){
      mark_email_as_verified(user_uid, callback, err_call);
      sendlog(LOG_INFO, 'email-verification', 'an email was verified');
    } else {
      err_call()
      sendlog(LOG_INFO, 'email-verification', 'a user: '+user_uid+', tried to verify with an invalid code');
    }

  }, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'email-verification', error);
    err_call(error);
  });
}
