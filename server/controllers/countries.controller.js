// ************************************ //
// **       Countries Controller     ** //
// ************************************ //

const countries = require('../models/static/countries.json');

module.exports = function(app, route){

    // Get
    app.get(route,function(req, res){
      res.send(countries.countries)
    });

    // Return Middleware
    return function(req, res, next){
        next();
    }
};
