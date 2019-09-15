"use strict";

const { ENV,
        DEFAULT_LANGUAGE,
        LOG_ERROR, LOG_INFO} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

// Requirements
const firebase = require('./firebase.service'),
      meta = require('./meta.service'),
      sendlog = require('./logger.service.js');

/* Perform Recommendations */

/* Post Recommended */
function post_recommended(datakey, new_data) {
  firebase.update_data(appvars.firebase.recommendations+datakey, new_data, ()=>{
    console.log('[recommendation] sent succesfully');
    sendlog(LOG_INFO, 'recommendation', 'Sent Successfully');
  }, error=>{
    console.log(error);
    sendlog(LOG_ERROR, 'recommendation', 'could not perform');
  });
}

/* Perform Recommendation */
function perform_recommendation(request, datakey){
  const insurance_types = meta.insurance_types;
  const recommendation_mapping = meta.recommendation_mapping.insurance_types;
  const all_keys_by_code = meta.industry_key_from_code;
  const activity_keys = request.activities;
  const industry_keys = request.industry_codes;
  const recommended = {};


  // insurance_type_loop:
  for(let key in insurance_types) {
    if (insurance_types.hasOwnProperty(key)) {
      recommended[key] = {score: 0};
      if (recommendation_mapping[key]) {

        // Loop Industry Codes
        let industry_weights = recommendation_mapping[key].industry_weights || {};
        outer_industry_loop:
          for (let index in industry_keys) {
            if (industry_keys.hasOwnProperty(index)) {
              let score = industry_weights[all_keys_by_code[industry_keys[index]]]
              if (score) {
                score = parseInt(score.score);
                recommended[key].score = recommended[key].score < score ?
                  score :
                  recommended[key].score;
                continue outer_industry_loop;
              }
              let split_code = industry_keys[index].split('.');
              let new_code_array = [];
              let tmp_code = '';
              for (let inner_index in split_code) {
                if (split_code.hasOwnProperty(inner_index)) {
                  tmp_code = inner_index == 0 ? tmp_code + split_code[inner_index] : tmp_code + '.' + split_code[inner_index];
                  new_code_array[split_code.length - inner_index - 1] = tmp_code
                }
              }
              new_code_array.push('default');
              inner_industry_loop:
                for (let rev_index in new_code_array) {
                  if (new_code_array.hasOwnProperty(rev_index)) {
                    let code_to_check = all_keys_by_code[new_code_array[rev_index]] || 'default';
                    let new_score = industry_weights[code_to_check];
                    if (new_score) {
                      new_score = parseInt(new_score.score);
                      recommended[key].score = recommended[key].score < new_score ?
                        new_score :
                        recommended[key].score;
                      continue inner_industry_loop;
                    }
                  }
                }
            }
          }

        // Loop Activities
        const activity_weights = recommendation_mapping[key].activity_weights || {};
        for (let index in activity_keys) {
          if (activity_keys.hasOwnProperty(index)) {
            let activity_uid = activity_keys[index];
            if (activity_weights[activity_uid]) {
              let score = activity_weights[activity_uid].score;
              recommended[key].score = recommended[key].score < score ?
                parseInt(score) :
                recommended[key].score;
            }
          }
        }
      }
    }
  }


  // Concatinate Recommendation
  const new_data = {
    recommended : recommended,
    processed : true,
    offer_requested: false
  };

  // Perform Update
  post_recommended(datakey, new_data);

  /* For Testing Purposes */
  return new_data;
}

/* Fetch Pending Recommendations */
function listen_for_recommendations() {
  console.log('[status] listening for recommendations');
  sendlog(LOG_INFO, 'status', 'Listening for recommendations');
  firebase.on_child_added(appvars.firebase.recommendations, 'processed', false,
    data => {
      console.log('[recommendation] requested');
      sendlog(LOG_INFO, 'recommendation', 'requested');
      perform_recommendation(data.val(), data.key)
    },
    error => {
      console.log(error);
      sendlog(LOG_ERROR, 'recommendation', 'could not fetch pending');
  });
}

/* Module Exports */
module.exports = {
  listen_for_recommendations,
  perform_recommendation
};
