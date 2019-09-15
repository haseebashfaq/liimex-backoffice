angular.module('application').filter('euro', function() {
  return function(input = 0) {
    const amount = Number(input).toFixed(2);
    if (isNaN(amount)) return input;
    let split_input = amount.toString().split('.');
    let whole = split_input[0];
    let decimal = split_input[1] || '00';
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let to_return = whole + ',' + decimal;
    return '€' + to_return;
  };
});
