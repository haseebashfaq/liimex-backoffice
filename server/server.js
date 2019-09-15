'use strict';

const {
        ENV
      } = require('./consts');
const appvars = require('./config/appvars.json')[ENV];

const _ = require('lodash'),
      // bodyParser = require('body-parser'),
      // express = require('express'),
      Brest = require('brest'),
      helmet = require('helmet'),
      methodOverride = require('method-override'),
      path = require ('path');

const jobs = require('./jobs');
const sendlog = require('./services/logger.service.js');

// Activate Recurring Jobs UNCOMMENT FOR PRODUCTION
if (process.env.ACTIVATE_JOBS === 'true') {
  jobs.activate_jobs();
}

//var db = require('./models'); // Database stuff

const brest = new Brest(require('./brest.settings'));

brest.on('error', err => {
    const error_message = err.message ? err.message : err;
    sendlog('error', 'server', error_message);
    console.log('error', error_message);
});

//
// // Set API prefix
// const api_prefix = '/api';
//
// // Create Application
// const app = express();
//
// // Configuretion and stuff
// app.use(helmet());
// app.use(bodyParser.urlencoded({extended:true}));
// app.use(bodyParser.json());
// app.use(methodOverride('X-HTTP-Method-Override'));
// app.set('port', process.env.PORT || DEFAULT_SERVER_PORT);
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'ejs');
//
// // Set Static Contect Folder
// app.set('views', path.join(__dirname, '../build'));
// app.use(express.static(app.get('views')));
// app.get('', function(request, respons
// e) {
//     response.render('index');
// });
//
// //CORS Support
// app.use(function(req, res, next){
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });
//
// // Assign Models to app.models for easy access
// //app.models = require('./models'); // Database models
//
// // Routes File
// const routes = require('./routes');
//
// _.each(routes, function(controller, route){
//     app.use(api_prefix + route, controller(app, api_prefix + route));
// });
//
// // Redirect to not found in case of anything else
// // var null_controller = require('./controllers/not_found_controller');
// // app.use('*', null_controller(app,'*'));
//
// // Listen To Sequelize Database!
// // db.sequelize.sync().then(function() {
//
// let server;
// exports.listen = function(){
//     server = app.listen(app.get('port'), function(){
//         console.log('\n[status] listening on port ' + app.get('port'));
//         sendlog('info','startup', '\n************************************************');
//         sendlog('info','startup', '\n**            Server Starting..               **');
//         sendlog('info','startup', '\n************************************************\n');
//         sendlog('info','startup', 'port: '+app.get('port'));
//     });
// };
//
// exports.close =function(){
//     server.close();
// };
// this.listen();
// });

/* Log Configurations */

/* Send Logs To Notify Server Start */
