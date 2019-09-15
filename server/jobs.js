/**
 *  JOBS CLASS
 *  this class handles the scheduled jobs that are recurring
 */

/* Requirements */
const mailorganizer = require('./services/mailorganizer.service');
const userorganizer = require('./services/userorganizer.service');
const recommendation = require('./services/recommendation.service');
const policyorganizer = require('./services/policyorganizer.service');
const offerorganizer = require('./services/offerorganizer.service');
const companyorganizer = require('./services/companyorganizer.service');
const mandateorganizer = require('./services/mandateorganizer.service');
const filegenerator = require('./services/filegenerator.service.js');
const meta = require('./services/meta.service');
const userrequests = require('./services/userrequest.service');
const schedule = require('node-schedule');

function activate_cron_jobs(){
  const job = schedule.scheduleJob('*/3 * * * * *', function(){
  //console.log('The answer to life, the universe, and everything!');
  });
}

/* Activate Other Jobs */
function activate_other_jobs(){
  console.log('[status] activating other jobs');
  if(process.env.SEND_EMAILS === 'true'){
    mailorganizer.fetch_new_mails();
  }
  if(process.env.SEND_SLACK_MESSAGES === 'true'){
    console.log('[slack] messages enabled');
    offerorganizer.fetch_offers_for_slack()
  }
  recommendation.listen_for_recommendations();
  userorganizer.fetch_new_users();
  policyorganizer.fetch_new_policies();
  offerorganizer.fetch_new_offers();
  mandateorganizer.fetch_new_mandates();
  companyorganizer.fetch_new_companies();
  userrequests.listen_user_requests();
  activate_cron_jobs();
}

/* Activate Jobs */
function activate_jobs(){
  meta.set_ready_callback(activate_other_jobs);
  meta.fetch_companies();
  meta.fetch_products();
  meta.fetch_insurance_types();
  meta.fetch_carriers();
  meta.fetch_activities();
  meta.fetch_industry_codes();
  meta.fetch_insurance_question_mapping();
  meta.fetch_insurance_questions();
  meta.fetch_recommendation_mapping();
  meta.fetch_main_addresses();
}

/* Module Exports */
module.exports = {
  activate_jobs
};
