const download = require('../controllers/download.controller');

module.exports = {
    endpoints: [
        {
            method: 'GET',
            allowCORS: true,
            filters: {
                'from': 'Download destination',
                'as': 'Rename downloading file to',
                'type': 'Override '
            },
            handler: function (req, callback) {
                download.downloadWithCustomName(req.filters, callback);
            }
        }
    ]
};
