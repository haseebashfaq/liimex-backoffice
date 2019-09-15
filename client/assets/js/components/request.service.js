(function() {

    'use strict';

    angular.module('application').
    service('requestService', requestService);

    requestService.$inject = ['$resource','$rootScope', 'firebase', '$firebaseObject', 'authService', 'modelsService'];

    /* Get Dynamic Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getEndpoint(routeList, route_only){
      var route = "";
        for(var i in routeList){
          route = route.concat(routeList[i],'/');
        }
        console.log('Requested Route:',route);
        if(route_only === true){
          return {route:route}
        } else {
          return {ref:firebase.database().ref().child(route), route:route};
        }
    }

    /* Get Time */
    function getTimestamp(){
      return firebase.database.ServerValue.TIMESTAMP
    }

    /* Service Function */
    function requestService($resource, $rootScope, firebase, $firebaseObject) {

      /* Hold Data Tempeorarily */
        var temp_hold_data = null;

        /* Add Timestamps */
        function addTimestamps(data){
            data.created_at       = firebase.database.ServerValue.TIMESTAMP;
            data.updated_at       = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }

        /* Update Timestamps */
        function updateTimestamps(data){
            data.updated_at       = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }

        /* Push Data */
        function pushData(route, data, callback, err_call){
          data = addTimestamps(data);
          var dataRef = getEndpoint(route).ref;
          dataRef.push(data).then(function(response){
              if(callback){
                callback(response);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Update Data */
        function updateData(route, data, callback, err_call, add_timesamps){
          data = add_timesamps === true ? updateTimestamps(data) : data;
          var dataRef = getEndpoint(route).ref;
          dataRef.update(data).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Set Data */
        // Requires manual UID
        function setData(route, data, callback, err_call, add_timesamps){
          data = add_timesamps === true ? addTimestamps(data) : data;
          var dataRef = getEndpoint(route).ref;
          dataRef.set(data).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Delete Data */
        function deleteData(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.remove().then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Data Once */
        function getDataOnce(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.once('value').then(function(snapshot) {
              var data = snapshot.val()
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Data On Value */
        function getDataOnValue(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.on('value', function(snapshot, prevChildKey) {
              var data = snapshot.val()
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }


        /* Get Data Once And Cache */
        function getDataOnceAndCache(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          if(temp_hold_data !== null && temp_hold_data !== undefined){
            callback(temp_hold_data)
          }else {
            dataRef.once('value').then(function(snapshot) {
                var data = snapshot.val();
                temp_hold_data = data;
                if(callback){
                  callback(data);
                }
            }, function(error){
                console.error(error);
                if(err_call){
                  err_call(error);
                }
            });
          }
        }

        /* Get Data Once With Filter */
        function getDataOnceEqualTo(route, sort_param, sort_value, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          if(!sort_value) { return }

          dataRef.orderByChild(sort_param).equalTo(sort_value).once('value').then(function(snapshot) {
              var data = snapshot.val();
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        // Get Multiple Keys
        function getMultipleKeys(route_list, callback){
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

        // Multu Path update
        function multiPathUpdate(newUpdate, callback, err_call){
          firebase.database().ref().update(newUpdate).then(function(result){
            if(callback){
              callback(newUpdate);
            }
          }, function(error){
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Liimex API Request With Params */
        function getLiimexResourceWithParams(endpoint, params, callback, err_call){
            $resource(endpoint).get(params, function(response) {
                callback(response.data);
            }, function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Post to  Liimex API Request With Params */
        function postLiimexResourceWithParams(endpoint, params, callback, err_call){
            $resource(endpoint).save(params, function(response) {
                callback(response);
            }, function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Attach and Update */
        function attachAndUpdate(route_list, callback, err_call){
          var newUpdate = {};
          var attach_for = {};
          var attach_to = {};

          for(var key in route_list){
            var item = route_list[key];
            var endpoint = getEndpoint(item.route);
            var dataRef = endpoint.ref.push();
            var dataKey = dataRef.key;
            if(item.attach_to === true || item.no_new_key){ dataKey='' }
            endpoint.route = endpoint.route + dataKey;
            newUpdate[endpoint.route] = item.data;
            if(item.attach_to){
              attach_to[endpoint.route] = item;
            }
            if(item.attach_for){
              attach_for[endpoint.route] = {item:item, dataKey:dataKey};
            }
          }

          for(var to_key in attach_to){
            for(var for_key in attach_for){
              if(attach_to[to_key].name === attach_for[for_key].item.attach_on){
                delete newUpdate[to_key];
                if(attach_for[for_key].item.overwrite_existing){
                  var new_key = to_key+attach_for[for_key].item.under;
                  newUpdate[new_key] = {};
                  newUpdate[new_key][attach_for[for_key].dataKey] = true;
                } else {
                  var new_key = to_key+attach_for[for_key].item.under+'/'+attach_for[for_key].dataKey;
                  newUpdate[new_key] = true;
                }
              }
            }
          }

          // Do a deep-path update
          firebase.database().ref().update(newUpdate).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              if(err_call){
                err_call(error);
              }
          });
        }


        /* Return Stuff */
        return {
          pushData : pushData,
          updateData : updateData,
          getDataOnce : getDataOnce,
          deleteData : deleteData,
          setData : setData,
          getDataOnceEqualTo : getDataOnceEqualTo,
          getDataOnceAndCache : getDataOnceAndCache,
          getLiimexResourceWithParams : getLiimexResourceWithParams,
          getMultipleKeys : getMultipleKeys,
          multiPathUpdate : multiPathUpdate,
          getTimestamp : getTimestamp,
          postLiimexResourceWithParams : postLiimexResourceWithParams,
          getDataOnValue : getDataOnValue,
          attachAndUpdate: attachAndUpdate
        }
    }
})();
