"use strict";

const { EMAIL_TYPE_INDUSTRY_NOT_FOUND,
        ENV,
        DEFAULT_LANGUAGE} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const firebase = require('./firebase.service'),
      sendlog = require('./logger.service.js'),
      userorganizer = require('./userorganizer.service');

/* Mark Notified */
function mark_notified(key, callback){
  firebase.update_data(appvars.firebase.companies + key, {could_not_find_industry: false, could_not_find_industry_email: true} , callback, error => {
    console.log(error);
    sendlog('error', 'companyorganizer', 'could not set notified to true');
  });
}

/**
 * Update company data
 * @param company_uid
 * @param data
 * @param callback
 */
function update_company(company_uid, data, callback) {
    firebase.update_data(appvars.firebase.companies + company_uid, data, callback, error => {
        console.log(error);
        sendlog('error', 'companyorganizer', `could not update data for ${appvars.firebase.companies + company_uid}`);
        callback(error);
    })
}

/**
 * Queue the outbound email by params
 * @param {Object} params
 */
function send_email(params){
  firebase.push_data(appvars.firebase.emails, {
    sent : false,
    params : params
  },
    () => {},
  error => {
    console.log(error);
    sendlog('error', 'companyorganizer', 'could not insert into mails tree');
  });
}

/* Choose Email to Send */
function choose_email_to_send(company){

  if (!company.users) return;
  if (company.could_not_find_industry_email === true) return;
  const users = company.users;

  for (let key in users) {
    if (users.hasOwnProperty(key)) {
      const user = userorganizer.allusers[key];

      const params = {
        to: appvars.sendgrid.sales,
        first_name: user.first_name,
        last_name: user.last_name,
        user_phone_number: company.phone,
        user_email: user.email,
        language: user.language_preference || DEFAULT_LANGUAGE
      };

      params.type = EMAIL_TYPE_INDUSTRY_NOT_FOUND;
      send_email(params);
    }
  }
}

/* Fetch New Companies */
function fetch_new_companies(){
  console.log('[status] listening for changes in companies');
  sendlog('info','status','Listening for changes in companies');
  firebase.on_child_added(appvars.firebase.companies, 'could_not_find_industry', true, result => {
    mark_notified(result.key, () => { choose_email_to_send(result.val()) });
  }, error => {
    console.log(error);
    sendlog('error','companyorganizer','failed to fetch companies');
  });
}

 /* Module Exports */
 module.exports = {
     fetch_new_companies,
     update_company
 };
