
/************************************************
                Custom Middleware
/************************************************

/* Requirements */
const {
  STATUS_CODE_DENIED = 403,
  LOG_INFO
} = require('./consts');
const path = require('path');
const fs = require('fs');
const request_ip = require('request-ip');
const sendlog = require('./services/logger.service.js');

/* Send HTML As Response */
function send_html(file_path, callback) {
  fs.readFile(path.join(__dirname, '..', 'build', file_path), 'utf8', (err, htmlContents) => {
    callback(htmlContents)
  });
}

/* Whitelister */
let whitelister = (approved_ips, denied_url) => {
  return (req, res, next) => {
    const except = denied_url.split('/')[1] < req.url.split('/')[1]
    if(approved_ips && req.url.slice(0, denied_url.length) === denied_url.slice(0, denied_url.length) && !except){
      const approved_set = new Set(approved_ips.split(','))
      if(!approved_set.has(request_ip.getClientIp(req))){
        return send_html('static/access_denied.html', html => {
          sendlog(LOG_INFO, 'whitelister', 'Accedd denied at: '+denied_url + ' for client with IP: '+request_ip.getClientIp(req));
          res.status(STATUS_CODE_DENIED).send(html);
        });
      } else {
        return next();
      }
    } else {
      return next();
    }
  }
}

module.exports = {
  whitelister
}
