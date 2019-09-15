module.exports = {
    endpoints: [
        {
            method: 'GET',
            uri: 'company/:company_id',
            handler: function (req, callback) {
                callback(null, {'mandate': `Mandate for company ${req.params.company_id}`});
            }
        },

        {
            method: 'POST',
            uri: 'company/:company_id',
            handler: function (req, callback) {
                callback();
            }
        }
    ]
};