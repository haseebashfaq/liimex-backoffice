// Angular Module
angular.module('application').controller('QuestionsController', QuestionsController);

// Injections
QuestionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','genService', 'companyService'];

// Function
function QuestionsController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService,genService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    var selectedinsurances = $stateParams.selectedinsurances.split(',');
    var companyid = $stateParams.companyid;
    $scope.generalInsuranceQuestions =[];
    $scope.specificInsuranceQuestions =[];
    $scope.confirmatoryInsuranceQuestions =[];
    $scope.insuranceTypesGroups = {};
    $scope.weighted_insurance_types = {};
    $scope.insurance_types = {};

    $scope.dates = {};
    $scope.dates.year = {};
    $scope.dates.month = {};
    $scope.dates.day = {};

    /* Safe Apply */
    $scope.safeApply = function(fn) {
        if(!this.$root){
            return;
        }
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    }

    /* Get Company Information */
    $scope.GetCompanyInformation = function() {
      companyService.getCompanyInformation($stateParams.companyid, function(company){
        $rootScope.local_load = null;
        $scope.company = company;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'getoffer','error',()=>{},()=>{})
      });
    }

    /*function to update all insurance questions, based on the insrance types selected*/
    function getQsForSelectedInsurances(){
        userrequestService.getQsForSelectedInsurances(selectedinsurances,companyid,(allInsuranceQuestions)=>{
            $scope.generalInsuranceQuestions = allInsuranceQuestions.generalInsuranceQuestions;
            $scope.confirmatoryInsuranceQuestions = allInsuranceQuestions.confirmatoryInsuranceQuestions;
            $scope.insuranceTypesGroups = allInsuranceQuestions.specificInsuranceTypesGroups;
            $scope.safeApply(e=>e);
        });
    }

    $scope.getTriggerMarchingSubQs = function(mainQuestion){
        var triggerMarchingSubQs = [];
        if(mainQuestion.subQuestions)
            triggerMarchingSubQs = mainQuestion.subQuestions.filter((subQ)=>{
            var _return = false;
            switch(subQ.trigger.condition){
                case '>' :
                if( mainQuestion.answer > subQ.trigger.on)
                    _return=true;
                break;
                case '<' :
                if(mainQuestion.answer < subQ.trigger.on)
                    _return=true;
                break;
                case '<=' :
                if(mainQuestion.answer <= subQ.trigger.on)
                    _return=true;
                break;
                case '>=' :
                if(mainQuestion.answer >=  subQ.trigger.on)
                    _return=true;
                break;
                case '!=' :
                if(mainQuestion.answer  != subQ.trigger.on)
                    _return=true;
                break;
                case '==' :
                if(mainQuestion.answer == subQ.trigger.on)
                    _return=true;
                break;
            }
            return _return;
        });
        mainQuestion.triggerMarchingSubQs = triggerMarchingSubQs;
        return triggerMarchingSubQs;
        $scope.safeApply(e=>e);
    }

    $scope.dateChange = function(questionObj) {
        var unixSecondsTime,previousSelectedYear, previousSelectedMonth, previousSelectedDate;
        if(questionObj.answer){
          unixSecondsTime = new Date(questionObj.answer * 1000);
          previousSelectedYear = unixSecondsTime.getFullYear();
          previousSelectedMonth = unixSecondsTime.getMonth() + 1; // bcos js months are 0 indexed.
          previousSelectedDate = unixSecondsTime.getDate();
        }
        var uid = questionObj.key;
        var getMonth = $scope.dates.month[uid] ? $scope.dates.month[uid]: previousSelectedMonth;
        var getDay = $scope.dates.day[uid] ? $scope.dates.day[uid]: previousSelectedDate;
        var getYear = $scope.dates.year[uid] ? $scope.dates.year[uid]:  previousSelectedYear;
        if(!isNaN(getMonth) && !isNaN(getDay) && !isNaN(getYear)) {
          var fullDate = getYear+'-'+getMonth+'-'+getDay;
          fullDate = fullDate.replace(/-/g,'/');
          var dateObject = new Date(fullDate);
          var unixDate = dateObject.getTime()/1000;
          questionObj.answer = unixDate;
        }
    }

    $scope.unixSecondsToDate = function(unixValue){
        var unixSecondsTime = new Date(unixValue * 1000);
        var year = unixSecondsTime.getFullYear();
        var month = unixSecondsTime.getMonth();
        var date = unixSecondsTime.getDate();

        switch (month)
        {
            case 0:
            month = 'January';
            break;
            case 1:
            month = 'February';
            break;
            case 2:
            month = 'March';
            break;
            case 3:
            month = 'April';
            break;
            case 4:
            month = 'May';
            break;
            case 5:
            month = 'June';
            break;
            case 6:
            month = 'July';
            break;
            case 7:
            month = 'August';
            break;
            case 8:
            month = 'September';
            break;
            case 9:
            month = 'October';
            break;
            case 10:
            month = 'November';
            break;
            case 11:
            month = 'December';
            break;
        }

        if(unixValue>0) {
            $scope.unixToDate = {};
            $scope.unixToDate.year = year;
            $scope.unixToDate.month = month;
            $scope.unixToDate.date = date;

            return $scope.unixToDate;
        }
    }

    function getAllInsuraceTypes(){
        metaService.getInsuranceTypes(allInsuraceTypes=> {
            $scope.insurance_types = allInsuraceTypes;
            $scope.safeApply(e=>e);
        },error=>{
            console.log("error loading  getting all insurance types ",error)
        });
    }

    $scope.saveAllInsuranceQandAs = function(form){
        if(!form.$valid){
            genService.showDefaultErrorMsg("Please fill all the required fileds in the form");
            return;
        }
        saveQAndAs($scope.generalInsuranceQuestions);
        saveQAndAs($scope.confirmatoryInsuranceQuestions);
        for (var insuranceType in $scope.insuranceTypesGroups) {
            saveQAndAs($scope.insuranceTypesGroups[insuranceType]);
        }
        requestMultipleOffers();
    }

    function saveQAndAs(_insuranceQuestions){
        _insuranceQuestions.forEach((_mainQuestion)=>{
            if(_mainQuestion.key && _mainQuestion.answer !== undefined){
                var answerObj = {'answer': _mainQuestion.answer};
                userrequestService.updateInsuraceAnswer(companyid,_mainQuestion.key, answerObj,f=>f,error=>{
                    console.log("error while updating a QandA for main question type",error);
                });
            }
            if(_mainQuestion.triggerMarchingSubQs){
                _mainQuestion.triggerMarchingSubQs.forEach((_subQuestion)=>{
                    if(_subQuestion.key && _subQuestion.answer!== undefined){
                        var answerObj = {'answer': _subQuestion.answer};
                        userrequestService.updateInsuraceAnswer(companyid,_subQuestion.key, answerObj,f=>f,error=>{
                            console.log("error while updating a QandA for main question type",error);
                        });
                    }
                });
            }
        });
    }

    function requestMultipleOffers(){
        userrequestService.requestMultipleOffers(selectedinsurances, companyid,()=>{
          genService.showDefaultSuccessMsg("Offers sent off");
          $state.go('company',{'company':companyid});
        },error=>{
          genService.showDefaultErrorMsg("Error while making offer");
          console.log("error while updating offers",error);
        });
    }

    function getDate(){
        // For Days
        $scope.get_day = 'Select Day';
        $scope.days= 31;
        $scope.getDayNumber = function(num_day) {
            return new Array(num_day);   
        };
        // For Year
        var current_year = new Date().getFullYear();
        var year_limit = 72;
        var range = [];
        range.push(current_year+5);
        for (var i = 1; i <= year_limit; i++) {
            range.push(current_year+5 - i);
        }
        $scope.years = range;
        // For Month
        $scope.months = {01:'January', 02:'February', 03:'March', 04:'April', 05:'May', 06:'June', 07:'July', 08:'August', 09:'September', 10:'October', 11:'November', 12:'December'};
    }

    getQsForSelectedInsurances();
    getAllInsuraceTypes();
    $scope.GetCompanyInformation();
    getDate();
}
