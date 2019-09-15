const async = require('async');
const path = require('path');

const {update_company} = require('../services/companyorganizer.service');
const {create_new_mandate} = require('../services/mandateorganizer.service');
const requestService = require('../services/firebase.service');


function init_mandate(company_uid, callback) {

    requestService.get_multiple_keys([{
        name:'mandate',
        route:['documents/mandates']
    }], mandate_key => {
        const now = requestService.get_timestamp();

        const mandate_params = {
            company: company_uid,
            timestamp: now,
            updated_at: now
        };

        const newUpdate = {
            [path.join(mandate_key.mandate.route, mandate_key.mandate.key)]: mandate_params,
            [path.join('companies', company_uid, 'mandate')]: mandate_key.mandate.key,
            [path.join('companies', company_uid, 'mandate_created')]: true
        };

        requestService.multipath_update(newUpdate, () => {
            callback(null, {mandate_uid: mandate_key.mandate.key})
        }, error => {
            callback(error);
        });
    });

    // async.waterfall([
    //     next => {
    //         create_new_mandate(company_uid, next);
    //     }, (mandate_uid, next) => {
    //         update_company(company_uid, {
    //             mandate: mandate_uid,
    //             mandate_created: true
    //         }, next);
    //     }
    // ], callback);
}

module.exports = {
    init_mandate
};
