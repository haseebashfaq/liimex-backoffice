/**
 *  Routing Class
 **/

const locations = {};
locations['/verifyemail'] = require('./controllers/verify.controller.js');
locations['/log'] = require('./controllers/log.controller.js');
locations['/email'] = require('./controllers/checkemail.controller.js');
locations['/countries'] = require('./controllers/countries.controller.js');
locations['/download'] = require('./controllers/download.controller.js');

/* Export */
module.exports = locations;
