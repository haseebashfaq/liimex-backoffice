/**
 *  Email Service
 *  this uses the send grid API
 *  check sendgrid for templates
 */

"use strict";

const {ENV, LOG_INFO, EMAIL_TYPE_VERIFICATION, MODEL_BLANK_EMAIL_TEMPLATE, EMAIL_SUB_LINK_EMAIL_VERIFICATION} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

/* Requirements */
const sg = require('sendgrid')(appvars.sendgrid.api_key);
const sendlog = require('./logger.service.js');


/* Email Types */
const email_types = {};
const test_address = process.env.TEST_MAIL || null;

sendlog(LOG_INFO,'config', 'using test email: '+ test_address + ' [null for production]');
console.log('[config] using test email: '+ test_address + ' [null for production]');


function send_email(email, callback, err_call){
  const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: email
  });
  sg.API(request, function(error, response) {
      if (error) {
        console.log(error);
        err_call(error);
      } else {
        callback();
      }
  });
}

/* Send Welcome Email */
// Params: first_name, last_name
email_types['welcome'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.welcome_template_id[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%": appvars.sendgrid.insurance_support_phone_number
  };
  email.from = {"email" : appvars.sendgrid.welcome_email};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Offer Requested Email */
// Params: first_name, last_name
email_types['offer_requested'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.offer_requested_template_id[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* New Offer With Request Email */
// Params: first_name, last_name, policy_type
email_types['new_offer_with_request'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.new_offer_with_request[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number,
    "%policy_type%" : params.policy_type,
    "%link_policy_overview%" : appvars.navigation.link_to_policies
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* New Offer Without Request Email */
// Params: first_name, last_name, policy_type
email_types['new_offer_without_request'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.new_offer_without_request[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number,
    "%policy_type%" : params.policy_type,
    "%link_policy_overview%" : appvars.navigation.link_to_policies
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Policy Digitized Email */
// Params: first_name, last_name, policy_type
email_types['policy_digitized'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.policy_digitized[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number,
    "%policy_type%" : params.policy_type,
    "%link_policy_overview%" : appvars.navigation.link_to_policies
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Policy Cancelled Email */
// Params: first_name, last_name, policy_type
email_types['policy_cancelled'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.policy_cancelled[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number,
    "%policy_type%" : params.policy_type
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};


/* Mandate Signed Email */
// Params: first_name, last_name, link_upload
email_types['mandate_signed'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.mandate_signed[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%link_upload%" : appvars.navigation.link_to_policies,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Offer Accepted Email */
// Params: first_name, last_name, policy_type
email_types['offer_accepted'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.offer_accepted[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%policy_type%" : params.policy_type,
    "%insurance_support_phone_number%" : appvars.sendgrid.insurance_support_phone_number
  };
  email.from = {"email" : appvars.sendgrid.advisory};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Could Not Find Industry */
// Params: first_name, last_name, user_email, user_phone_number
email_types['could_not_find_industry'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.could_not_find_industry[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%user_phone_number%" : params.user_phone_number,
    "%user_email%" : params.user_email
  };
  email.from = {"email" : appvars.sendgrid.no_reply};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Email Verification */
// Params: link_email_verification
email_types[EMAIL_TYPE_VERIFICATION] = function(params, callback, err_call){
  const email = require(MODEL_BLANK_EMAIL_TEMPLATE);
  email.template_id = appvars.sendgrid[params.type][params.language];
  email.personalizations[0].to[0] = {email : (test_address || params.to)};
  email.personalizations[0].substitutions = {};
  email.personalizations[0].substitutions[EMAIL_SUB_LINK_EMAIL_VERIFICATION] = '<a href="'+params.link_email_verification+'">'+params.link_email_verification+'</a>';
  email.from = {"email" : appvars.sendgrid.no_reply};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};


/* Offer Requested Internal */
// Params: first_name, last_name, user_email, user_phone_number, company_name
email_types['internal_offer_requested'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.internal_offer_requested[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%user_phone_number%" : params.user_phone_number,
    "%user_email%" : params.user_email,
    "%company_name%" : params.company_name
  };
  email.from = {"email" : appvars.sendgrid.no_reply};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};


/* Offer Accepted Internal */
// Params: first_name, last_name, user_email, user_phone_number, company_name
email_types['internal_offer_accepted'] = function(params, callback, err_call){
  const email = require('../models/email/email_template.json');
  email.template_id = appvars.sendgrid.internal_offer_accepted[params.language];
  email.personalizations[0].to[0] = {"email" : (test_address || params.to)};
  email.personalizations[0].substitutions = {
    "%first_name%" : params.first_name,
    "%last_name%" : params.last_name,
    "%user_phone_number%" : params.user_phone_number,
    "%user_email%" : params.user_email,
    "%company_name%" : params.company_name
  };
  email.from = {"email" : appvars.sendgrid.no_reply};
  email.content[0] = {"type" : "text/html", "value" : "content"};
  send_email(email, callback, err_call);
};

/* Module Exports */
module.exports = email_types;
