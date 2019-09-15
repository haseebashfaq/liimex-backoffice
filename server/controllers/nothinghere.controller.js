// ************************************ //
// **       Nothign Here             ** //
// ************************************ //

module.exports = function(app, route){

    // Get
    app.get(route,function(req, res){
      return res.render('static/nothing_here.html');
    });

    // Return Middleware
    return function(req, res, next){
        next();
    }
};
