/**
 *  Firebase Handler Class
 */

"use strict";

const {ENV,
  ON_CHILD_ADDED, ON_CHILD_CHANGED, ON_CHILD_MOVED, ON_CHILD_REMOVED, ON_VALUE,
  EVENT_TYPE_ON_CHILD_ADDED, EVENT_TYPE_CHILD_CHANGED, EVENT_TYPE_ON_CHILD_MOVED, EVENT_TYPE_ON_CHILD_REMOVED, EVENT_TYPE_ON_VALUE
} = require('../consts');

const appvars = require('../config/appvars.json')[ENV];

// Imports
const _ = require("lodash"),
      admin = require("firebase-admin");

const serviceAccount = require(appvars.firebase.path_to_service_account);

// Initialization
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: appvars.firebase.database
});

// Database&Auth References
const db = admin.database();
const auth = admin.auth();


/* Get Timestamp */
function get_timestamp(){
  return admin.database.ServerValue.TIMESTAMP
}

/* Get Dynamic Endpoint */
/* Needed to reset endpoint between users sign in/out */
function getEndpoint(routeList, route_only){
  var route = "";
  for(var i in routeList){
    route = route.concat(routeList[i],'/');
  }
  if(route_only === true){
    return {route:route}
  } else {
    return {ref:db.ref().child(route), route:route};
  }
}


// Logging
// admin.database.enableLogging(true)

/**
 * Retrieve user auth record by email
 * @param {string} email
 * @param {Function} callback
 */
function fetch_auth_record_by_email(email, callback){
  auth.getUserByEmail(email)
    .then(userRecord => callback(null, userRecord.toJSON().uid))
    .catch(callback);
}

/**
 * Attempt to delete user
 * @param {String} uid
 * @param {Function} callback
 */
function try_user_deletion_auth(uid, callback){
  auth.deleteUser(uid)
    .then(() => callback())
    .catch(callback);
}

function create_user_auth_record(userData, callback, err_call){
  auth.createUser({email:userData.email, password: userData.password}).then(function(firebase_user){
   callback(firebase_user);
  }).catch(function(error){
    err_call(error);
  });
}

/* Get Data Once */
function get_data_once(url, callback, err_call){
  const ref = db.ref(url);
  ref.once("value", function(snapshot) {
    callback(snapshot.val());
  },function(error){
    err_call(error);
  });
}

/* Get Data Once Equal To*/
function get_data_once_equal_to(url, sort_param, sort_value, callback, err_call){
  const ref = db.ref(url);
  ref.orderByChild(sort_param).equalTo(sort_value).once("value", function(snapshot) {
    callback(snapshot.val());
  },function(error){
    err_call(error);
  });
}

/* Update Data */
function update_data(url, data, callback, err_call, update_timestamp){
  const ref = db.ref(url);
  ref.update(data).then(function(){
    callback();
  }, function(error){
    err_call(error);
  });
}

/* Set Data */
function set_data(url, data, callback, err_call){
  const ref = db.ref(url);
  ref.set(data).then(function(){
    callback();
  }, function(error){
    err_call(error);
  });
}

/* Push Data */
function push_data(url, data, callback, err_call){
  const ref = db.ref(url);
  const key = ref.push().key;
  const update = {};
  update[key] = data;
  ref.update(update).then(function(){
    callback(key);
  }, function(error){
    err_call(error);
  });
}

/* Update User Data */
function verify_user_email(user_uid, callback, err_call) {
  admin.auth().updateUser(user_uid, {
    emailVerified: true
  }).then(callback).catch(err_call)
}

/* On Child Added */
function on_child_added(url, sort_param, sort_value, callback, err_call){
  const ref = db.ref(url);
  ref.orderByChild(sort_param).equalTo(sort_value).on("child_added", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

/* On Child Value */
function on_child_value(url, sort_param, sort_value, callback, err_call){
  const ref = db.ref(url);
  ref.orderByChild(sort_param).equalTo(sort_value).on("value", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

/* On Child Changed */
function on_child_changed(url, sort_param, sort_value, callback, err_call){
  const ref = db.ref(url);
  ref.orderByChild(sort_param).equalTo(sort_value).on("child_changed", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

// Get Multiple Keys
function get_multiple_keys(route_list, callback){
  var key_list = {};
  for(var key in route_list){
    var endpoint = getEndpoint(route_list[key].route);
    var dataRef = endpoint.ref.push();
    var dataKey = dataRef.key;
    key_list[route_list[key].name] = {};
    key_list[route_list[key].name].route = endpoint.route;
    key_list[route_list[key].name].key = dataKey;
  }
  callback(key_list);
}

// Multi Path update
function multipath_update(newUpdate, callback, err_call){
  db.ref().update(newUpdate).then(function(result){
    if(callback){
      callback(newUpdate);
    }
  }, function(error){
      if(err_call){
        err_call(error);
      }
  });
}

/* On Child Changed No Query */
function on_child_changed_no_query(url, callback, err_call){
  const ref = db.ref(url);
  ref.on("child_changed", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

/* On Child Added no Query */
function on_child_added_no_query(url, callback, err_call){
  const ref = db.ref(url);
  ref.on("child_added", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

/* On Child Value no Query */
function on_child_value_no_query(url, callback, err_call){
  const ref = db.ref(url);
  ref.on("value", function(snapshot, prevChildKey) {
    callback(snapshot);
  }, err_call);
}

const events_map = {
  [ON_VALUE]: EVENT_TYPE_ON_VALUE,
  [ON_CHILD_ADDED]: EVENT_TYPE_ON_CHILD_ADDED,
  [ON_CHILD_CHANGED]: EVENT_TYPE_CHILD_CHANGED,
  [ON_CHILD_REMOVED]: EVENT_TYPE_ON_CHILD_REMOVED,
  [ON_CHILD_MOVED]: EVENT_TYPE_ON_CHILD_MOVED
};

/**
 * Generate resolve function for the given event_key
 * @param {String} event_type
 * @param {Function} callback
 * @returns {Function}
 * @private
 */
function _get_event_resolve(event_type, callback) {
  return function(snapshot, prevChildKey) {
    return callback(null, {event_type, snapshot, prevChildKey});
  }
}

/**
 * Generate reject function for the given event_key
 * @param {String} event_type
 * @param {Function} callback
 * @returns {Function}
 * @private
 */
function _get_event_reject(event_type, callback) {
  return function(error) {
    callback(error, {event_type});
  }
}

/**
 * Set new listeners to the provided url
 *
 * @param {String} url
 * @param {binary} events
 * @param {String} [key]
 * @param {*} [value]
 * @param {Function} callback
 */
function on(url, events, key, value, callback) {
  if (_.isFunction(key)) { //check if no query
    callback = key;
    key = undefined;
  }
  _.each(events_map, (event_type, event_bitmap) => {
      if (events & event_bitmap) {
        let ref = db.ref(url);
        if (!_.isEmpty(key) && !_.isEmpty(value)) { //Add query if there's one
          ref = ref.orderByChild(key).equalTo(value)
        }
        ref.on(event_type, _get_event_resolve(event_type, callback), _get_event_reject(event_type, callback));
      }
  });
}

function get_download_url(path, callback) {
  storage.ref(path).getDownloadURL()
    .then(url => callback(null, url))
    .catch(err => callback(err));
}

/* Module Exports */
module.exports = {
  get_data_once,
  get_data_once_equal_to,
  update_data,
  on_child_added,
  on_child_value,
  fetch_auth_record_by_email,
  try_user_deletion_auth,
  set_data,
  push_data,
  on,
  on_child_changed_no_query,
  on_child_added_no_query,
  on_child_changed,
  on_child_value_no_query,
  create_user_auth_record,
  get_download_url,
  get_timestamp,
  verify_user_email,
  get_multiple_keys,
  multipath_update
};
