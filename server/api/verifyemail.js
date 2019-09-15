const verify = require('../controllers/verify.controller');

module.exports = {
    endpoints: [
        {
            method: 'GET',
            allowCORS:true,
            filters: {
                'verification_code': 'Email verification code',
                'user_uid': 'User id'
            },
            handler: function (req, callback) {
                verify.code(req.filters, callback);
            }
        }
    ]
};
