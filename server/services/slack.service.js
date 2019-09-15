"use strict";

/* Constants */
const {LOG_ERROR} = require('../consts')

/* Requirements */
var Slack = require('slack-node');
const sendlog = require('./logger.service.js');
const meta = require('./meta.service')
const webhook_url = 'https://hooks.slack.com/services/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'
var slack = new Slack();
slack.setWebhook(webhook_url);

/* Send Slack Message */
module.exports.post_slack_message = (text) => {
  slack.webhook({
    channel: "@jcfinnerup",
    username: "Backoffice",
    icon_emoji: "https://media.licdn.com/media/AAEAAQAAAAAAAAxDAAAAJGJmYTFhODViLTc2NTctNDkwNS05N2Y4LTUyYTgwMWNlOWM4Zg.jpg",
    text: text
  }, function(err, response) {
    console.log(response);
    if(err){
      sendlog(LOG_ERROR, 'slackservice', error);
    }
  });
}

/* Post Changed Offer */
module.exports.post_changed_offer = (text, offer) => {
  let channel = process.env.SLACK_CHANNEL_URL || '@jcfinnerup'
  try{
    offer.subject = offer.insurance_type || offer.subject
    let company = meta.companies[offer.company];
    let insurance_type = meta.insurance_types[offer.subject];
    slack.webhook({
      channel: channel,
      username: "Backoffice",
      icon_emoji: ":euro:",
      text: text+" - <https://backoffice-production.herokuapp.com/#!/dashboard/search/"+offer.company+"|view company> ```\nCompany: "+company.name+" "+company.type+"\nLiimex ID: "+company.liimex_id+"\nInsurance Type: "+insurance_type.name_de+"\n```"
    }, function(err, response) {
      if(err){
        console.log(err);
        sendlog(LOG_ERROR, 'slackservice', error);
      }
    });
  } catch(e) {
    sendlog(LOG_ERROR, 'slackservice', 'error caught:',e);
  }
}

/* Post User Signed Up */
module.exports.post_user_signed_up = (text, user) => {
  console.log(user);
  // let channel = process.env.SLACK_CHANNEL_URL || '@jcfinnerup'
  // try{
  //   offer.subject = offer.insurance_type || offer.subject
  //   let company = meta.companies[offer.company];
  //   let insurance_type = meta.insurance_types[offer.subject];
  //   slack.webhook({
  //     channel: channel,
  //     username: "Backoffice",
  //     icon_emoji: ":euro:",
  //     text: text+" - <https://backoffice-production.herokuapp.com/#!/dashboard/search/"+offer.company+"|view company> ```\nCompany: "+company.name+" "+company.type+"\nLiimex ID: "+company.liimex_id+"\nInsurance Type: "+insurance_type.name_de+"\n```"
  //   }, function(err, response) {
  //     if(err){
  //       console.log(err);
  //       sendlog(LOG_ERROR, 'slackservice', error);
  //     }
  //   });
  // } catch(e) {
  //   sendlog(LOG_ERROR, 'slackservice', 'error caught:',e);
  // }
}
