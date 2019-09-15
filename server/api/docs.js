module.exports = {
    endpoints: [
        {
            method: 'GET',
            allowCORS:false,
            handler: function (req, callback) {
                callback(null, {hey:'hey'})
            }
        }
    ]
};
