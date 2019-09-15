console.log('RUNNING PRESTART');
var fs = require('fs');
var readline = require('readline');

var start_string = '//start-replace-by-prestart//';
var end_string = '//end-replace-by-prestart//'

var file_path = 'client/assets/js/constants/config.constant.js'
var reader = readline.createInterface({
  input: require('fs').createReadStream(file_path)
});

var required_envs =[
  process.env.apiKey,
  process.env.authDomain,
  process.env.databaseURL,
  process.env.storageBucket,
  process.env.messagingSenderId,
  process.env.backofficeUrl
]

for(var i in required_envs){
  if(!required_envs[i]){
    console.error('PRESTART ERROR: Not all required process variables present');
    return;
  }
}

var to_insert = [
    '      apiKey: "'+process.env.apiKey+'",',
    '      authDomain: "'+process.env.authDomain+'",',
    '      databaseURL: "'+process.env.databaseURL+'",',
    '      storageBucket: "'+process.env.storageBucket+'",',
    '      messagingSenderId: "'+process.env.messagingSenderId+'"',
    '      backoffice_url : "'+process.env.backofficeUrl+'"'
]

var should_replace = false;
var output = ""
var count = 0;
function regenerate(){
  reader.on('line', function (line) {
    if(line.match(end_string)){
      should_replace = false;
    }
    if(should_replace === false){
      output = output.concat(line,'\n');
    } else if(should_replace === true){
      output = output.concat(to_insert[count],'\n');
      count++;
    }
    if(line.match(start_string)){
      should_replace = true;
    }
  });
}

regenerate();
setTimeout(function() {
  output.split('\n').slice(1).join('\n')
  fs.writeFile(file_path, output)
  console.log('PRESTART STATUS: Finished');
}, 500);



//fs.writeFile('client/assets/js/app.js', output)

//
// function read_app_js() {
//   var data = fs.readFileSync('', 'utf-8');
//   //var newValue = data.replace(/^\./gim, 'myString');
//   //fs.writeFileSync('filelistSync.txt', newValue, 'utf-8');
//
//   data = data.toString();
//   for(var line in data){
//     console.log(data[line]);
//   }
//   console.log('readFileSync complete');
// }
//
//
// read_app_js();
