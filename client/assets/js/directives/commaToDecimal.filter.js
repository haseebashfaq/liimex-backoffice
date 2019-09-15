angular.module('application').filter('commaToDecimal', [
function() {
    return function(input) {
    var ret=(input)?input.toString().trim().replace(",","."):null;
        return parseFloat(ret);
    };
}]);
