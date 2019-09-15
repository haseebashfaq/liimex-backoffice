angular.module('application').filter('meta', function($interpolate) {
    return function(item, filter_name){
        if (!filter_name) {
            return item;
        }
        const result = $interpolate('{{value | ' + filter_name + '}}');
        return result({value: item});
    };
});
