"use strict";

const {ENV, OK} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const async = require('async'),

      firebase = require('./firebase.service'),
      sendlog = require('./logger.service.js');

const PROCEED_TO_OK_RESPONSE = Symbol();

/**
 *
 * @param {string} email_address
 * @param {Object} callback Brest callback
 */
function checkemail(email_address, callback) {
  async.waterfall([
    (next) => {
      firebase.get_data_once_equal_to(appvars.firebase.users, 'email', email_address, (res) => next(null, res), (err) => next(err));
    },
    (users_with_email, next) => {
      sendlog('info','mailcheck','checking user info for mail');
      if (users_with_email !== null) return next(PROCEED_TO_OK_RESPONSE);
      firebase.get_data_once_equal_to(appvars.firebase.admins, 'email', email_address, (res) => next(null, res), (err) => next(err));
    },
    (admins_with_email, next) => {
      if (admins_with_email !== null) return next(PROCEED_TO_OK_RESPONSE);
      firebase.fetch_auth_record_by_email(email_address, next);
    },
    (uid, next) => {
      firebase.try_user_deletion_auth(uid, err => next(err, uid));
    },
    (uid, next) => {
      sendlog('info', 'mailcheck', `deleted user with uid('${uid}') and email ('${email_address}')`);
      next();
    }
  ], (err) => {
    if (err && err !== PROCEED_TO_OK_RESPONSE) {
        return callback();
    }
    return callback();
  });
}

// Exporting Modules
module.exports = checkemail;
