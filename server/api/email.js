const checkemail = require('../services/checkemail.service.js');

module.exports = {
    endpoints: [
        {
            method: 'POST',
            allowCORS: true,
            handler: function (req, callback) {
               checkemail(req.body.email, callback);
            }
        }
    ]
};