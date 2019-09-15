// ************************************ //
// **       Check Controller         ** //
// ************************************ //
const checkemail = require('../services/checkemail.service.js');

module.exports = function(app, route){

    /* Post */
    app.post(route,function(req, res){
        const mailinfo = req.body;
        checkemail(mailinfo.email, res);
    });

    // Return Middleware
    return function(req, res, next){
        next();
    }
};
