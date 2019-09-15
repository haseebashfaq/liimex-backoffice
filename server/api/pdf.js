const {generate_pdf} = require('../services/filegenerator.service');

module.exports = {
    endpoints: [
        {
            method: 'POST',
            handler: function (req, callback) {
                generate_pdf(req.body, callback);
            }
        }
    ]
};