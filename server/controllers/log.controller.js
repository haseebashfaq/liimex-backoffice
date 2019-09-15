// ************************************ //
// **       Log Controller          ** //
// ************************************ //
"use strict";

const { ENV,
        LOG_SOURCE_PLATFORM,
        LOG_SOURCE_BACKOFFICE,
        LOG_SOURCE_UNKNOWN
      } = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const sendlog = require('../services/logger.service.js');

const source_path = {
    [LOG_SOURCE_PLATFORM]: appvars.logging.hostname_plat,
    [LOG_SOURCE_BACKOFFICE]: appvars.logging.hostname_backoffice_frontend,
    [LOG_SOURCE_UNKNOWN]: appvars.logging.hostname_backoffice_frontend
};

function log(loginfo, callback) {

    if (Object.keys(source_path).indexOf(loginfo.source) === -1) loginfo.source = LOG_SOURCE_UNKNOWN;
    const log_path = source_path[loginfo.source];

    sendlog(loginfo.level, loginfo.program, JSON.stringify({
        user: loginfo.user,
        log: loginfo.logs_object,
        origin: loginfo.origin
    }), log_path);

    callback();
}

module.exports = {log};
