const {generate_mandate, generate_sepa} = require('../services/filegenerator.service');
const {init_mandate} = require('../controllers/company.controller');

module.exports = {
    endpoints: [
        {
            /**
            * @api {get} /company/:company_uid Get Company
            * @apiName Get Company
            * @apiGroup Company
            * @apiParam {String} company_uid The ID of the Company
            * @apiSuccess {String} name Name of Company
            * @apiSuccess {String} liimex_id Company's Liimex ID
            * @apiSuccess {String} type Company type. I.e. GmbH, AG etc.
            * @apiSuccess {String} phone Phone Number of Company
            * @apiSuccess {String} mandate Reference to the Companys mandate Object Uid
            * @apiSuccess {Bool} mandate_created Tells whether a mandate has been generated and is in file storage
            * @apiSuccess {Bool} could_not_find_industry: Wheter a Company landed on the "Could not find Industry" Page
            * @apiSuccess {Object} users Object with User IDs as keys set to true
            * @apiSuccess {Object} policies Object with Policy IDs as keys set to true
            * @apiSuccess {Object} offers Object with Offer IDs as keys set to true
            * @apiSuccess {Object} recommendations Object with Recommendation IDs set as true, refers to recommendation objects
            * @apiSuccess {Object} addresses Object with References to Address Objects
            * @apiSuccess {Object} insurance_questionnaire Object with References and Answers to Insurance Questions
            * @apiSuccess {Array} industry_codes List of Industry Codes. I.e. 4.2.10
            * @apiSuccess {Array} activities Object with References to Activity Objects
            * @apiError (Error: 404) {404} company_not_found The <code>company_id</code> did not correspond to any Company.
            * @apiError (Error: 403) {403} access_denied Access denied for the company with <code>company_id</code>.
            * @apiSuccessExample {json} Success-Response:
            * HTTP/1.1 200 OK
            * company {
            *  activities : ["-Ke4Mi8h17JUx_rWcuIp","-Ke5VdSAkN5eX6duksCy"],
            *  addresses : {
            *    -Kssas9QIdT8zLM_U4Gs : true
            *  },
            * created_at : 1504188269361,
            * industry_codes: ["7.4.1", "5.8"],
            * insurance_questionnaire: {
            *   -Kn06Ho3zs4zzsR1y5fz: {
            *     answer: true
            *    }
            *  },
            * liimex_id: "HED-6186-0612",
            * mandate: "-Kssasg7xpef-3z_D4iG",
            * mandate_created: true,
            * name: "Heart Industries",
            * offers: {
            *   -KsscMnUSX2Ee2x0pJM9: true,
            *   -KsscMnUSX2Ee2x0pJMA: true
            *  },
            * phone: "+375298153871",
            * policies: {
            *   -KuJwmds9x6bcRlIjQLA: true
            *  },
            * recommendations: {
            *   -KssbNawFoqg7Juna5rG: true
            *  },
            * type: "KG",
            * updated_at: 1504188402261,
            * users: {
            *   QmXKiWPRcXayXIa2WnppXXKDWeR2: true
            *  }
            *}

            */
            method: 'GET',
            uri: ':company_id',
            allowCORS:true,
            handler: function (req, callback) {
                callback(null, {'company': `Company ${req.params.company_id}`});
            }
        },

        {
            /**
             *  @api {post} /company/:company_uid/mandate
             *  @apiName GenerateMandate
             *  @apiGroup Company
             *  @apiParam (URI) {String} company_uid        Company unique identifier
             *  @apiParam (Body) {String} user_uid          User unique identifier
             *  @apiParam (Body) {String} signature_path    URL of an image used as signature. It is automatically generated in platform, but any other valid url of any image resource can be used in debugging purposes
             *  @apiSuccess (200) {json} document_path      Returns the mandate document name
             *  @apiSuccessExample {json} Success-Response:
             *     HTTP/1.1 200 OK
             *     {
             *          "data": "997aefac-6c10-4e27-8008-49b6b0104dd9.pdf"
             *     }
             */
            method: 'POST',
            uri: ':company_id/mandate',
            allowCORS: true,
            handler: function (req, callback) {
                generate_mandate(req.params.company_id, req.body, callback);
            }
        },

        {
            /**
             *  @api {post} /company/:company_uid/mandate/init
             *  @apiName InitMandate
             *  @apiDescription Pre-init mandate for the company, and mutually link company and it's mandate
             *  @apiGroup Company
             *  @apiParam (URI) {String} company_uid        Company unique identifier
             *  @apiSuccess (200) {json}                    Default OK response
             *  @apiSuccessExample {json} Success-Response:
             *     HTTP/1.1 200 OK
             *     {
             *          "brest": "ok"
             *     }
             */
            method: 'POST',
            uri: ':company_id/mandate/init',
            allowCORS: true,
            handler: function (req, callback) {
                init_mandate(req.params.company_id, callback);
            }
        },

        {
            /**
             *  @api {post} /company/:company_uid/mandate
             *  @apiName GenerateSEPAMandate
             *  @apiDescription Generate SEPA mandate for the company and put it into firebase storage
             *  @apiGroup Company
             *  @apiParam (URI) {String} company_uid        Company unique identifier
             *  @apiParam (Body) {String} user_uid          User unique identifier
             *  @apiParam (Body) {String} signature_path    URL of an image used as signature. It is automatically generated in platform, but any other valid url of any image resource can be used in debugging purposes
             *  @apiSuccess (200) {json} document_path      Returns the SEPA mandate document name
             *  @apiSuccessExample {json} Success-Response:
             *     HTTP/1.1 200 OK
             *     {
             *          "data": "997aefac-6c10-4e27-8008-49b6b0104dd9.pdf"
             *     }
             */
            method: 'POST',
            uri: ':company_id/sepa',
            allowCORS: true,
            handler: function (req, callback) {
                generate_sepa(req.params.company_id, req.body, callback);
            }
        }
    ]
};
