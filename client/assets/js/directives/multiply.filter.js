angular.module('application').filter('multiply', function() {
    return function(input = 0) {
        const amount = Number(input);
        if (isNaN(amount)) return input;
        return '×' + amount;
    };
});
