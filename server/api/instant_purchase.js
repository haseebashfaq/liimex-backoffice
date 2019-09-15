const {
  PROCESS_ID_NOT_FOUND,
  PRODUCT_ID_NOT_FOUND
 } = require('../errors')

const pricingService = require('../services/pricing.service.js');
const product_service = require('../services/product.service');

module.exports = {
    endpoints: [
        {

            /**
            * @api {post} /instant_purchase/process Create New Process
            * @apiName Create New Process
            * @apiGroup Instant Purchase
            **/
            method: 'POST',
            uri: 'instant_product_request',
            allowCORS: true,
            handler: function (req, callback) {
                if(req && req.body && req.body.product_id){
                    product_service.createInstantProductProcess(req.body.product_id, callback);
                }
                else{
                    callback({error: PRODUCT_ID_NOT_FOUND});
                }
            }
        },

        {

            /**
            * @api {put} /instant_purchase/:process_id Create New Process
            * @apiName Create New Process
            * @apiGroup Instant Purchase
            **/
            method: 'PUT',
            uri: 'instant_product_request',
            allowCORS: true,
            handler: function (req, callback) {
                if(req &&
                  req.query &&
                  req.query.instant_product_request_id &&
                  req.query.page_number
                ){
                    product_service.updateInstantProductProcess(req.query.instant_product_request_id, req.query.page_number, req.body.page_data, callback);
                }
                else{
                    callback({error: PROCESS_ID_NOT_FOUND});
                }
            }
        },

        {

            /**
            * @api {get} /instant_purchase/:process_id/:page_number Get Process Object
            * @apiName Get Process Object
            * @apiGroup Instant Purchase
            **/

            method: 'GET',
            uri: 'instant_product_request',
            allowCORS: true,
            handler: function (req, callback) {
                if(req && req.query && req.query.instant_product_request_id){
                    product_service.getInstantProductProcess(req.query.instant_product_request_id, req.query.page_number, callback);
                }
                else{
                    callback({error: PROCESS_ID_NOT_FOUND});
                }
            }
        },

        {

            /**
            * @api {post} /instant_purchase/user_information Create User
            * @apiName Create User
            * @apiGroup Instant Purchase
            **/
            method: "POST",
            uri: "user_information",
            allowCORS: true,
            handler: function (req, callback) {
                if(req && req.body && req.body.instant_product_request_id && req.body.user && req.body.type){
                    pricingService.updateUserData(req.body.instant_product_request_id,req.body.user,req.body.type, req.body.page_number,callback)
                }
                else{
                    callback({error:"instant_product_request_id and/or user_data not found"})
                }
            }
        },
        {

            /**
            * @api {post} /instant_purchase/chekout Create checkout
            * @apiName Create Chekout
            * @apiGroup Instant Purchase
            **/
            method: "POST",
            uri: "checkout",
            allowCORS: true,
            handler: function (req, callback) {
                if(req && req.body && req.body.instant_product_request_id && req.body.checkout){
                    pricingService.updateCheckout(req.body.instant_product_request_id,req.body.checkout,req.body.page_number,callback)
                }
                else{
                    callback({error:"instant_product_request_id and/or checkout not found"})
                }
            }
        },
        {

            /**
            * @api {post} /instant_purchase/process_complete Process complete
            * @apiName Process Complete
            * @apiGroup Instant Purchase
            **/
            method: "POST",
            uri: "process_complete",
            allowCORS: true,
            handler: function (req, callback) {
                if(req && req.body && req.body.instant_product_request_id && req.body.process_status){
                    pricingService.processComplete(req.body.instant_product_request_id,req.body.process_status,callback)
                }
                else{
                    callback({error:"instant_product_request_id and/or process status not found"})
                }
            }
        }
    ]
};
