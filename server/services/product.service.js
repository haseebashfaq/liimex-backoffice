"use strict";

/* Constants */
const {
  ENV,
  LOG_ERROR,
  LOG_WARNING,
  LOG_NAME_PRODUCT_SERVICE
} = require('../consts');

const {
  PROCESS_ID_NOT_FOUND,
  PRODUCT_ID_NOT_FOUND,
  COUNT_NOT_UPDATE_PRODUCT_REQUEST
} = require('../errors')

/* Requirement */
const appvars = require('../config/appvars.json')[ENV];
const firebase = require('./firebase.service');
const sendlog = require('./logger.service.js');
const pricing_service = require('./pricing.service');
const pages_suffix = 'pages';
const path = require('path');

/* Get Instant Prouct Process */
this.getInstantProductProcess = (request_uid, page_number, callback) => {
  let call_path ="";
  call_path = path.join(appvars.firebase.instant_product_request,request_uid)
  
  firebase.get_data_once(call_path, result => {
    
    if(!result){
      sendlog(LOG_WARNING, LOG_NAME_PRODUCT_SERVICE, PROCESS_ID_NOT_FOUND);
      return callback({error: PROCESS_ID_NOT_FOUND});
    }
    else if(result.pages[page_number] && (result.pages[page_number].checkout || result.pages[page_number].thankyou)){
      let productRequestObj ={};
      productRequestObj = result;
      productRequestObj["page_type"] = result.pages[page_number].page_type;
      /* return all the pages for the checkout page */
      callback(null, {instant_product_request: productRequestObj,
        current_page: result.current_page,
        uid: result.uid,
        process_status: result.process_status
      });
    }
    else{
      callback(null, {instant_product_request: result.pages[page_number],
        current_page: result.current_page,
        uid:result.uid,
        process_status: result.process_status
      });
    }
  }, error => {
    sendlog(LOG_ERROR, LOG_NAME_PRODUCT_SERVICE, error);
    return callback({error: PROCESS_ID_NOT_FOUND});
  });
}

/* Execute On Save Function */
function executeOnSave(process_id, page_data, callback){
  if(page_data && page_data.on_save){
    pricing_service.executeOnSaveFunction(process_id, page_data.on_save, () => {
      return callback(null);
    }, () => {
      return callback({error: COUNT_NOT_UPDATE_PRODUCT_REQUEST});
    });
  } else {
    return callback(null);
  }
}

/* Update Instant Product Process */
this.updateInstantProductProcess = (process_id, page_number, page_data, callback) => {
  if(!(page_number && process_id && page_data)){
    return callback({error: COUNT_NOT_UPDATE_PRODUCT_REQUEST});
  }
  
  firebase.get_data_once(appvars.firebase.instant_product_request+process_id,productRequestObj=>{
    if(page_number > productRequestObj.current_page){
      return callback({error:COUNT_NOT_UPDATE_PRODUCT_REQUEST});
    }
    return firebase.update_data(path.join(appvars.firebase.instant_product_request+process_id, pages_suffix, page_number), page_data, () => {
        pricing_service.updateCurrentPageNumber(process_id, page_number,
          ()=>executeOnSave(process_id,page_data, callback),
          error=>callback({"error":error}));
        }, error => {
          sendlog(LOG_ERROR, LOG_NAME_PRODUCT_SERVICE, {error: error});
          return callback({error: COUNT_NOT_UPDATE_PRODUCT_REQUEST});
        });
    },error=>callback("error",error));
  }
  
  /* Get Product With ID */
  function getProductWithID(product_uid, callback, err_call){
    firebase.get_data_once(appvars.firebase.products+product_uid, result => {
      if(!result){
        return err_call();
      }
      return callback(result);
    }, err_call);
  }
  
  /* Create Instant Produt Process */
  this.createInstantProductProcess = (product_uid, callback) => {
    getProductWithID(product_uid, product => {
      const product_controller = pricing_service.getProductEngine(product.instant_template);
      const product_template = product_controller.getTemplate();
      product_template.product_id = product_uid;
      product_template.instant_template = product.instant_template;
      firebase.push_data(appvars.firebase.instant_product_request, product_template, result => {
        return callback(null, {instant_product_request_id: result});
      }, error => {
        sendlog(LOG_ERROR, LOG_NAME_PRODUCT_SERVICE, {error: error});
        return callback({error: PRODUCT_ID_NOT_FOUND});
      });
    }, () => {
      sendlog(LOG_ERROR, LOG_NAME_PRODUCT_SERVICE, {error: PRODUCT_ID_NOT_FOUND});
      return callback({error: PRODUCT_ID_NOT_FOUND});
    })
  }
  
  
  /* Module Exports */
  module.exports = this;
  