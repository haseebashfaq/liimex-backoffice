"use strict";

const { ENV,
  DEFAULT_LANGUAGE,
  LOG_ERROR, LOG_INFO} = require('../consts');

const appvars = require('../config/appvars.json')[ENV];
const uuid4 = require('uuid/v4'),
  firebase = require('./firebase.service'),
  sendlog = require('./logger.service.js');

/* Mark Sent */
function mark_successful(key, uid){
  firebase.update_data(appvars.firebase.user_requests + key, { "processed": true, "error":false, "uid":uid } , f => f, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'user requests (1)', 'could not mark as sent');
  });
}

/* Mark Error */
function mark_error(key, error){
  firebase.update_data(appvars.firebase.user_requests+key, { "processed": true, "error":true, "uid": null, error_message : error.message} , f => f, error => {
    console.error(error);
    sendlog(LOG_ERROR, 'user requests (2)',error);
  });
}

/* listens to the processed field in user request obj */
function listen_user_requests(){
  console.log('[status] listening for user requests');
  sendlog(LOG_INFO, 'status', 'Listening for user requests');

  firebase.on_child_added(appvars.firebase.user_requests, 'processed', false,
    data => {
      sendlog(LOG_INFO, 'user requests', 'new user request on: ' + data.val().email);
      console.log('[user requests] new request on: ' + data.val().email);

      const email = data.val().email;
      if (email) {
        get_uid_by_email(email , uid => {
          mark_successful(data.key, uid);
        },
        error => {
          const password = uuid4();
          create_user_auth_record(email, password, data);
        });
      } else {
        mark_error(data.key, {message: 'Missing Information'});
      }
    },
    error => {
      console.error(error);
      sendlog(LOG_ERROR, 'user requests (3)', error);
    });
}

/* Create User Auth Record */
function create_user_auth_record(email, password,userRequestObj){
  firebase.create_user_auth_record({email, password},
    firebase_user =>{
      mark_successful(userRequestObj.key, firebase_user.uid);
    }, error=>{
      mark_error(userRequestObj.key,error);
    });
}

/* Get uid By Email */
function get_uid_by_email(email, callback, err) {
  firebase.fetch_auth_record_by_email(email,  (error, uid) => {
      if (error) return err(error);
      callback(uid);
  });
}

/* Module Exports */
module.exports = {
  listen_user_requests
}
