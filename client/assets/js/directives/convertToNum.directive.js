/*
* This Directive is called using convert-to-number
* and is used to conver string to int type
*/
angular.module('application').directive("convertToNumber", function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attr, modelCtrl) {
            modelCtrl.$formatters.push(function(modelValue) {
                modelCtrl.$parsers.push(function(val) {
                    return parseInt(val, 10);
                });
                modelCtrl.$formatters.push(function(val) {
                    return String(val);
                });
            });
        }
    };
});
