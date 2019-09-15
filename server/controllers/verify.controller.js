/**************************************
    Email Verification Controller
**************************************/

/* Requirements */

const   fs = require('fs'),
        path = require('path');

const verification_service = require('../services/emailverification.service');
const sendlog = require('../services/logger.service.js');
const { LOG_ERROR } = require('../consts');

// TEST: http://localhost:2500/api/verifyemail?verification_code=2c0fce4b-7c76-4739-841a-bf00138c80b7&user_uid=964UuG4xX4QdGQPLC8cihppVOMe2


function send_html(file_path, callback) {
    fs.readFile(path.join(__dirname, '..', '..', 'build', file_path), 'utf8', (err, htmlContents) => {
        if (err) return callback(err);
        callback(null, htmlContents, {ignoreJSON: true});
    });
}

function code(filters, callback) {
    const {verification_code, user_uid} = filters;
    if (!user_uid || !verification_code) return callback({error: 'Failed to verify'});

    verification_service.verify_email(verification_code, user_uid, () => {
        return send_html('static/success_validating_email.html', callback);
        // return res.redirect(LOCATION_SUCCESS_EMAIL_VERIFICATION);
    }, error => {
        sendlog(LOG_ERROR, 'email-verification-controller', 'user: '+user_uid+' error: '+error);
        return send_html('static/error_validating_email.html', callback);
    });
}

module.exports = {code};