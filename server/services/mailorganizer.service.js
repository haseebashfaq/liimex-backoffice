"use strict";

const {ENV, LOG_ERROR, LOG_INFO} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

/* Requirements */
const firebase = require('./firebase.service'),
      mailservice = require('./mail.service'),
      sendlog = require('./logger.service.js');

/* Mark Attempted */
function mark_attempted(key, attempts) {
  firebase.update_data(appvars.firebase.emails+key, { sent: false, attempts: ++attempts}, f => f, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mail', 'could not increment attempts');
  });
}

/* Mark Sent */
function mark_sent(key,attempts) {
  firebase.update_data(appvars.firebase.emails+key, { sent: true, attempts: ++attempts } , f => f, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mail', 'could not mark as sent');
  });
}

/* Send Emails */
function send_emails(email_dict, key) {
    email_dict.attempts = email_dict.attempts || 0;

    if(email_dict.attempts >= appvars.jobs.max_attempts_to_send_email) return;

    const email_object = email_dict.params;
    if(!mailservice[email_object.type]) return;

    mailservice[email_object.type](email_object, () => {
      mark_sent(key, email_dict.attempts);
      console.log('[mail] email => ',email_object.to);
      sendlog(LOG_INFO, 'email ['+email_object.type+'] ==> ', email_object.to)
    }, error => {
      console.log(error);
      mark_attempted(key, email_dict.attempts);
    });
}

/* Fetch New Mails */
function fetch_new_mails(){
  console.log('[status] listening for new mails');//done
  sendlog('info','status','Listening for new mails');
  firebase.on_child_added(appvars.firebase.emails, 'sent', false, result => {
    try{
      send_emails(result.val(), result.key);
    } catch(e) {
      sendlog(LOG_ERROR, 'mail', 'there has been an error in sending an email')
    }
  }, error => {
    console.log(error);
    sendlog(LOG_ERROR, 'mail', 'failed to fetch new emails');
  });
}

 /* Module Exports */
 module.exports = {fetch_new_mails};
