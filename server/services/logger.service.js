"use strict";

const {ENV, LOG_ERROR, LOG_WARNING, LOG_INFO, LOG_VERBOSE, LOG_DEBUG, LOG_SILLY} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const winston = require('winston');
require('winston-papertrail').Papertrail; //expose winston.transports.Papertrail

const winstonPapertrailBackoffice = new winston.transports.Papertrail({
  host: appvars.logging.papertrail_host,
  port: appvars.logging.papertrail_port
  //hostname: appvars.logging.hostname,
});

winstonPapertrailBackoffice.on('error', function(err) {
  // Handle, report, or silently ignore connection errors and failures
});

const LOG_TYPES = [LOG_ERROR, LOG_WARNING, LOG_INFO, LOG_VERBOSE, LOG_DEBUG, LOG_SILLY];
const MAX_INFO_LENGTH = 1000;

function sendlogs(level, program, info, hostname = appvars.logging.hostname) {

  const logger = new winston.Logger({
    transports: [winstonPapertrailBackoffice]
  });

  logger.transports.Papertrail.program = program;//maybe add check
  logger.transports.Papertrail.hostname = hostname;
  if (LOG_TYPES.indexOf(level) >= 0)
  //add check on info length//block spam with ip from using the log api
  {
    if (info.length <= MAX_INFO_LENGTH)
    {
      try{
        logger[level](info)
      }
      catch(err) {
        console.log(err)
      }
    }
    else
    {
      logger.transports.Papertrail.program = LOG_WARNING;
      try {
        logger.error('received info too long')
      }
      catch(err) {
        console.log(err)
      }
    }
  }
  else
  {
  //log a wrong level logging attempt//modify hostname
    logger.transports.Papertrail.program = LOG_WARNING;
    try{
      logger.error('wrong level attempt')
    }
    catch(err) {
      console.log(err)
    }
  }
}

module.exports = sendlogs;
