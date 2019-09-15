const log = require('../controllers/log.controller');

module.exports = {
    endpoints: [
        {
            method: 'POST',
            allowCORS: true,
            handler: function (req, callback) {
                const info = req.body;
                info.origin = req.headers.origin;
                log.log(info, callback);
            }
        }
    ]
};
