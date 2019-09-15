const countries = require('../models/static/countries.json');

module.exports = {
    endpoints: [
        {
            method: 'GET',
            allowCORS:true,
            handler: function (req, callback) {
                callback(null, countries);
            }
        }
    ]
};
