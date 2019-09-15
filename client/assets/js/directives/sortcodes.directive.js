
angular.module('application').filter('sortcodes', function() {
 return function(collection, input) {
  var output = [];

  angular.forEach(collection, function(item) {
    if(item.code.level == input.key){
      if(input.parent && input.parent.split('.').length === 1){
        if(input.parent === item.code.code.split('.')[0]){
          output.push(item);
        }
      }
      else if(input.parent && input.parent.split('.').length === 2){
        if(input.parent.split('.')[0] === item.code.code.split('.')[0] && input.parent.split('.')[1] === item.code.code.split('.')[1]){
          output.push(item);
        }
      }
      else if(input.parent && input.parent.split('.').length === 3){
        if(input.parent.split('.')[0] === item.code.code.split('.')[0] && input.parent.split('.')[1] === item.code.code.split('.')[1] && input.parent.split('.')[2] === item.code.code.split('.')[2]){
          output.push(item);
        }
      }
      else {
        output.push(item);
      }
    }          
  });
  return output;
};
});
