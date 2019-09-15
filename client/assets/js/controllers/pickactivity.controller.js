// Angular Module
angular.module('application').controller('PickActivityController', PickActivityController);

// Injections
PickActivityController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','companyService'];

// Function
function PickActivityController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    let userid = $stateParams.userid;
    let companyid = $stateParams.company_id;
    $scope.company_id = $stateParams.company_id;
    let industry_codes = [];

    $scope.current_question_group = 1;
    $scope.picked_activities = new Set();

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
    };

    /* Get My Activities */
    function getActivityQuestions(){
      $rootScope.local_load = true;
      $scope.questions_to_display = [];
      metaService.getActivityQuestions( questions => {
          $scope.activities = questions;
          companyService.getCompanyInformation($stateParams.company_id, company => {
              $scope.company = company;
              let activity_set = new Set($scope.company.activities);
              industry_codes = company.industry_codes;
              var num_set = new Set();
              question_loop:
              for(var key in questions){
                  var question = questions[key];
                  if(question.disabled === true) {continue};
                  if(question.exclude_codes) {
                      let exclusion_set = new Set(question.exclude_codes);
                      for(var index in company.industry_codes){
                          let codestring =  company.industry_codes[index];
                          let codes = codestring.split('.');
                          let codeStringBuilder = codes[0];
                          for (var i=1; i<=codes.length ; i++){
                              if(exclusion_set.has(codeStringBuilder)){
                                  continue question_loop;
                              }
                              codeStringBuilder = codeStringBuilder + '.'+ codes[i];
                          }
                      }
                  }
                  // Check if group is disabled before pushing would be better
                  if(activity_set.has(key)){
                    $scope.questions_to_display.push({key:key, activity:question, isPicked:true});
                  } else {
                    $scope.questions_to_display.push({key:key, activity:question});
                  }
                  num_set.add(question.group);
              }
              $scope.num_questions = $scope.maxsize;
              for(var i=1; i<=5; i++){
                  if(!num_set.has(i)){
                      $scope.num_questions -= 1;
                  }
              }
              $scope.safeApply(fn => fn);
              $rootScope.local_load = null;
          }, error => {
              console.error(error);
          });
      }, error => {
          console.error(error);
          $rootScope.local_load = null;
          $rootScope.genService.showDefaultErrorMsg(error.code);
      });
    }

    /* Get Groups */
    function getGroups(){
        metaService.getGroups( groups => {
            $scope.groups = {};
            for(var key in groups){
                if (groups[key].disabled === true){
                    continue
                }
                $scope.groups[groups[key].group] = groups[key];
            }
            $scope.safeApply(fn => fn);
        }, error => {
            console.error(error);
        });
    }

    $scope.saveActivities = function(){
        $rootScope.local_load = true;
        let pickedActivities =  $scope.questions_to_display.filter(activityObj =>activityObj.isPicked);
        let activity_array = pickedActivities.map(activityObj => activityObj.key);
        userrequestService.updateActivityAndRecommendation($stateParams.company_id, activity_array, $scope.company.industry_codes, (data) => {
            $rootScope.genService.showDefaultSuccessMsg('New Recommendations Generated');
            $rootScope.local_load = null;
            $state.reload();
        }, (error) =>{
          $rootScope.genService.showDefaultErrorMsg('Something Went Wrong, Ask Tech!');
          $rootScope.local_load = null;
          console.error(error);
        });
    }

    getActivityQuestions();
    getGroups();
}
