(function() {

    'use strict';

    angular.module('application').
    service('genService', genService);

    genService.$inject = ['$rootScope', 'FoundationApi'];

    function genService($rootScope, FoundationApi) {


        /*******************************/
        /**      Screen Messages      **/
        /*******************************/

        /* Show Success Message */
        function showDefaultSuccessMsg(msg){
            FoundationApi.publish('success-notification', {
                content: '   ' + msg,
                color:"success",
                autoclose:3000
            });
            $rootScope.local_load = null;
            try{
              $rootScope.$apply();
            }
            catch(e){
              console.log('Apply Caught!');
            }
        }

        /* Show Error Message */
        function showDefaultErrorMsg(msg){
            FoundationApi.publish('main-notification', {
                content: '   ' + msg,
                color:"default",
                autoclose:3000
            });
            $rootScope.local_load = null;
            try{
              $rootScope.$apply();
            }
            catch(e){
              console.log('Apply Caught!');
            }
        }

        /****************************************/
        /**Convert time stamp to formatted date**/
        /****************************************/

        function convertStampToDate(stamp)
          {
            var rawDate = new Date(stamp);
            if ( rawDate != "Invalid Date" ) {
              return  rawDate.toDateString() + " " + rawDate.toTimeString();
            }
            return "undefined"
          }



        /*******************************/
        /**      DOM (custom inputs)  **/
        /*******************************/

        /* Save Dates From HTML to model */
        function saveDOMValueToVariable(model, value_bind_array){
          for(var key in value_bind_array){
            model[value_bind_array[key]] = document.getElementById(value_bind_array[key]).value;
          }
        }

        /*******************************/
        /**           Numbers         **/
        /*******************************/

        /* Get Number With Thousand Seperator */
        function getSepThousands(number){
            if(number === undefined)
                return

            var seperated = Number(number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
            return seperated;
        }

        /* Capitalize */
        function capitalize(string){
            if(string === undefined)
                return

            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        /* Generate Company IDs */
        function generateCompanyId(company,address){
            var lower_code = company.name[0] + address.street[0] + address.country[0];
            var upper_code = lower_code.toUpperCase();
            var date = new Date(),
                milistamp = date.getTime().toString().slice(-4),
                random_num = Math.floor((Math.random() * 9999));
            random_num = '0'.repeat(4-random_num.toString().length).concat(random_num);
            var final_code = upper_code+'-'+random_num+'-'+milistamp;
            return final_code;
        }

        /*******************************/
        /**       Convinience         **/
        /*******************************/

        /* JS Download */
        function downloadWithLink(url_for_download){
          console.log('downloadWithLink', url_for_download);
          var a = document.createElement('a');
          a.href = url_for_download;
          a.download = 'document_name';
          // a.target = '_self';
          console.log(a);
          a.click();
        }

        /* Set Confirm Action */
        function setConfirmAction(action, param){
          if (action) {
            $rootScope.confirm_action = action;
            $rootScope.confirm_param = param;
          } else {
            console.log('No Confirm Action!');
          }
        }

        /* Execute Confirm Action */
        function executeConfirmAction(){
          if ($rootScope.confirm_action && $rootScope.confirm_param) {
            $rootScope.confirm_action($rootScope.confirm_param);
          }
          else if($rootScope.confirm_action){
            $rootScope.confirm_action()
          } else {
            console.log('No Confirm Action!');
          }
        }

        /*******************************/
        /**         Formatting        **/
        /*******************************/

        // Generate Variable Name
        function generateVariableName(str){
          return str.replace(/ /g, "_").toLowerCase();
        }

        /*******************************/
        /**           Time           **/
        /*******************************/

        /* Get Timestamp */
        function getTimestamp(){
            var date = new Date();
            return date.toString();
        }

        /* Get Timestamp Mili */
        function getTimestampMili(){
            var date = new Date();
            return date.getTime().toString();
        }

        /* Prettify String */
        function prettify(input){
          var no_score = input.replace('_', ' ');
          return capitalize(no_score);
        }

        /* Get Date Object */
        function getDateObj (dateStr){
          return new Date(dateStr);
        }

        /* Return Stuff */
        return {
            getSepThousands: getSepThousands,
            capitalize: capitalize,
            getTimestamp: getTimestamp,
            getTimestampMili: getTimestampMili,
            generateCompanyId: generateCompanyId,
            showDefaultSuccessMsg: showDefaultSuccessMsg,
            showDefaultErrorMsg: showDefaultErrorMsg,
            prettify : prettify,
            saveDOMValueToVariable : saveDOMValueToVariable,
            generateVariableName : generateVariableName,
            downloadWithLink : downloadWithLink,
            setConfirmAction : setConfirmAction,
            executeConfirmAction : executeConfirmAction,
            convertStampToDate : convertStampToDate,
            getDateObj : getDateObj
        }
    }
})();
