(function() {
  'use strict';

  angular.module('application', [
      'angularMoment',
      'ui.router',
      'ngAnimate',
      'foundation',
      'ngResource',
      'foundation.dynamicRouting',
      'foundation.dynamicRouting.animations',
      'firebase',
      'angularFileUpload',
      'dynamicNumber',
      'infinite-scroll',
      'xeditable',
      'angularUUID2',
      'ngFileUpload',
      'textAngular'
	]).config(config).run(run);

  moment.tz.add("Europe/Berlin|CET CEST CEMT|-10 -20 -30|01010101010101210101210101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 1cM0 1cM0 kL0 Nc0 m10 WM0 1ao0 1cp0 dX0 jz0 Dd0 1io0 17c0 1fA0 1a00 1ehA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|41e5");


  // App Constants
  const land_at = "search";
  var backoffice_url;

  // Inject Providers
	config.$inject = ['$urlRouterProvider', '$locationProvider', '$stateProvider', '$resourceProvider', 'dynamicConfig'];

	// Provider Configurations
  function config($urlProvider, $locationProvider, $stateProvider, $resourceProvider, dynamicConfig) {



    // App Init
// eslint-disable-next-line no-undef
    firebase.initializeApp(dynamicConfig.firebase_config);
    backoffice_url = dynamicConfig.backoffice_url;

    $urlProvider.otherwise('/dashboard/'+land_at);
    $locationProvider.html5Mode({
        enabled:false,
        requireBase: false
    });
    $locationProvider.hashPrefix('!');
    $resourceProvider.defaults.stripTrailingSlashes = false;
  }

    // Ensure Company and User Loaded
    function getInitialInformation(currentUser, success, err_call, userService, companyService, modelsService, $rootScope){
      console.log('..');
      userService.getUserInformation(currentUser,function(user){
          console.log('...');
          $rootScope.user = user;
          success();
      }, function(error){
          err_call(error);
      });
    }

  	// App run( -> )
  	function run($rootScope, $state, authService, companyService, userService, $firebaseAuth, genService, modelsService, accessService, backofficeService) {

      $rootScope.backoffice_url = backoffice_url;

 		  FastClick.attach(document.body);

      // Getting Init Information
      //$rootScope.authenticating = false;

   		// Make auth Service Available from RootScope
   		$rootScope.authService = authService;

   		// Make General Service Available from RootScope
   		$rootScope.genService = genService;

 		  // Watch for StateChanges
	  	$rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {

      // On Logout, keep checking status of login
      $rootScope.authService.getCurrentUser(function(firebaseUser){
  	     if(!firebaseUser){
           $rootScope.currentUser = undefined;
         }
  	  });


      if(toState.data && toState.data.vars.securityLevel  && $rootScope.user){
        if(toState.data.vars.securityLevel > $rootScope.user.rights){
          backofficeService.logpost('Employee attempted to access ristricted area: '+toState.name ,$rootScope.user.email,'security','info',()=>{},()=>{});
          $state.go(fromState.name);
        }
      }

	    var loginRequired = toState.data.vars.loginRequired;

      $rootScope.currentState = toState.name;
      $rootScope.currentStateTitle = toState.data.vars.title;

	    console.log('Current State:',toState.name);
      console.log('Current Admin:', $rootScope.currentUser);

    	if (loginRequired && typeof $rootScope.currentUser === 'undefined') {
          $rootScope.authenticating = true;
          console.log('.');
          $firebaseAuth().$waitForSignIn().then(function(status){
            console.log('Auth Resolved');
      			if(!status){
      				$state.go('login');
              $rootScope.authenticating = false;
      			}
      			else{
              $rootScope.currentUser = status.uid;
              getInitialInformation(status.uid, function(){
                $rootScope.authenticating = false;
                accessService.setAccessRights($rootScope.user.rights);
                console.log('Current Admin:', $rootScope.currentUser);
                $state.go(toState.name);
                $rootScope.$apply();
              }, function(error){
                console.error(error);
                $state.go('login');
                authService.logout(function(){}, function(){});
                $rootScope.authenticating = false;
              }, userService, companyService, modelsService, $rootScope);
      			}
      		});
        }

       });

      // Make a green header bar above everything #563
      var url = window.location.href;
      $rootScope.developmentEnvironment = !/^https?:\/\/internal.liimex.com/.test(url) &&
        !/^https?:\/\/backoffice-production.herokuapp.com/.test(url);
    }
})();

/*  jQuery  */

// Angular Module
angular.module('application').controller('AccessController', AccessController);

// Injections
AccessController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'userService'];

// Function
function AccessController($rootScope, $scope, $stateParams, $state, $controller, userService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    // Scope Models
    $scope.users = [];
    $scope.new = {};
    $scope.delete_email =null;

    /* Get All Users */
    $scope.GetAllUsers = function(){

      $scope.new = {};
      $scope.users = [];

      userService.getAllUsers(function(result){
        for(var key in result){
          $scope.users.push({user:result[key], key:key});
        }
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Select User */
    $scope.SelectUser = function(key, user){
      $scope.selected_key = key;
      $scope.selected_user = user;
      $scope.new.rights = user.rights;
      $scope.delete_email = null;
    }

    /* Update User */
    $scope.UpdateUser = function(key){
        console.log('Updating user to:', $scope.new);

        if (key===$rootScope.currentUser) {
          $rootScope.genService.showDefaultErrorMsg('You cannot edit your own access level');
          return;
        }

        userService.updateAdminRights(key, $scope.new.rights, function(response){
          $rootScope.genService.showDefaultSuccessMsg('Employee account updated!');
          document.getElementById('close_admin').click();
          $scope.selected_key = null;
          $scope.selected_user = null;
          $state.reload();
        }, function(){
          $rootScope.genService.showDefaultErrorMsg('Someting went wrong, please try again later');
        });
    }

    /* Delete User */
    $scope.DeleteUser = function(key){
      if (key===$rootScope.currentUser) {
        $rootScope.genService.showDefaultErrorMsg('You cannot delete yourself');
        return;
      }

      userService.deleteUser(key, function(){
        $rootScope.genService.showDefaultSuccessMsg('User deleted');
        document.getElementById('close_admin').click();
        $scope.GetAllUsers();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Call On Controller Load */
    $scope.GetAllUsers();
}

// Angular Module
angular.module('application').controller('AccountController', AccountController);

// Injections
AccountController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'companyService', 'userService', 'authService','FoundationApi'];

// Function
function AccountController($rootScope, $scope, $stateParams, $state, $controller, firebase, companyService, userService, authService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // User and Address models
    $scope.address = {};
    $scope.user = {};
    $scope.company = {};

    // Update Models
    $scope.update = {};
    $scope.update.company = {};
    $scope.update.user = {};
    $scope.update.address = {};

    /* Update Update Variables */
    UpdateUpdateVariables = function(){
        Object.assign($scope.update.company, $scope.company);
        Object.assign($scope.update.user, $scope.user);
        Object.assign($scope.update.address, $scope.address);
        $scope.$apply();
    }

    /* Get Address Information */
    $scope.GetAddressInformation = function(){
        var address_list = [];
        companyService.getCompanyAddress($rootScope.user.company, function(addresses){
            for(var key in addresses){
                address_list.push(addresses[key]);
            }

            // Adding the first index address (FIND A SOLUTION)
            $scope.address = address_list[0];
            UpdateUpdateVariables();
        }, function(error){

        });
    }

    /* Get Address Information */
    $scope.GetCompanyInformation = function(){
      companyService.getCompanyInformation($rootScope.user.company, function(company){
        $scope.company = company;
        UpdateUpdateVariables();
      },function(error){
        console.log(error);
      });
    }

    /* Get Users Information */
    $scope.GetUserInformation = function(){
        userService.getUserInformation($rootScope.currentUser, function(user){
            $scope.user = user;
            UpdateUpdateVariables();
        }, function(error){

        });
    }

    /* Update Information */
    $scope.UpdateInformation = function(){
        console.log('Updating Information')
        userService.updateUserInformation($rootScope.currentUser, $scope.user, $scope.update.user, function(){
            companyService.updateCompanyInformation($rootScope.user.company, $scope.update.company, function(){
                companyService.updateAddress($rootScope.user.company, $scope.update.address, function(){
                    $rootScope.genService.showDefaultSuccessMsg('Information Updated');
                    $scope.GetUserInformation();
                    $scope.GetAddressInformation();
                    $scope.GetCompanyInformation();
                    $scope.$apply();
                    document.getElementById('close_button').click();
                }, function(error){
                    $rootScope.genService.showDefaultErrorMsg(error.message);
                });
            }, function(error){
                $rootScope.genService.showDefaultErrorMsg(error.message);
            });
        }, function(){
            // Reauthenticate
            document.getElementById('account_reauth').click();
        }, function(error){
            // Error
            $rootScope.genService.showDefaultErrorMsg(error.message);
            UpdateUpdateVariables();
        });
    }

    /* Confirm Reauthentication */
    $scope.Reauthenticate = function(password){
        console.log('Reauthenticating');
        authService.login({email: $scope.user.email, password: password}, function(){
            $scope.UpdateInformation();
            var reauth = document.getElementById('close_reauth').click();
        }, function(error){
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Call when controller is loading */
    $scope.GetAddressInformation();
    $scope.GetUserInformation();
    $scope.GetCompanyInformation();

}

// Angular Module
angular.module('application').controller('ActivityController', ActivityController);

// Injections
ActivityController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ActivityController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

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
  	$scope.GetActivities = function(forms){
      $rootScope.local_load = true;
  		metaService.getAllActivities(activities => {
        $scope.activities = [];
        for(var key in activities){
          $scope.activities.push({key:key, activity:activities[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
  	}

    /* Get Groups */
    $scope.GetGroups = function(){
      $rootScope.local_load = true;
      metaService.getGroups(groups => {
        $scope.groups = [];
        for(var key in groups){
          $scope.groups.push({key:key, group:groups[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Activity */
    $scope.AddActivity = function(){
      metaService.addActivity({}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Activity added');
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Group */
    $scope.AddGroup = function(){
      metaService.addGroup({}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Group added');
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

  	/* Call these functions on controller load */
    $scope.GetActivities();
    $scope.GetGroups();
}

// Angular Module
angular.module('application').controller('ActivityGroupController', ActivityGroupController);

// Injections
ActivityGroupController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function ActivityGroupController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  	/* Get Group */
  	$scope.GetGroup = function(){
      $rootScope.local_load = true;
  		metaService.getSingleGroup($stateParams.group, group => {
        $scope.group = group;
        $rootScope.local_load = null;
        $scope.$apply();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})

      });
  	}

    /* Save Group */
    $scope.SaveGroup = function(){
      $rootScope.local_load = true;
      metaService.saveGroup($scope.group, $stateParams.group,  () => {
        backofficeService.logpost({msg:'group saved',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
    }

    /* Enable ActivityGroup */
    $scope.EnableGroup = function(){
      $rootScope.local_load = true;
      metaService.enableActivityGroup($stateParams.group,()=>{
        backofficeService.logpost({msg:'group enabled',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
      }

    /*Disable ActivityGroup*/
    $scope.DisableGroup = function(){
      $rootScope.local_load = true;
      metaService.disableActivityGroup($stateParams.group,()=>{
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'group disabled',group:$stateParams.group},$rootScope.user.email,'activitygroup','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activitygroup','error',()=>{},()=>{})
      });
      }


  	/* Call these functions on controller load */
    $scope.GetGroup();
}

// Angular Module
angular.module('application').controller('ActivityQuestionController', ActivityQuestionController);

// Injections
ActivityQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function ActivityQuestionController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


  /* Scope Variables*/
  $scope.activity_score = 0;

  /* local Variables*/
  var recommendationMappings = [];
  var previousInsuraceType;
  var activityquestion = $stateParams.activityquestion;


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

  /* Get Activity */
  $scope.GetActivity = function(forms){
    $rootScope.local_load = true;
    metaService.getSingleActivity($stateParams.activityquestion, activity => {
      $scope.activity = activity;
      previousInsuraceType = activity.insurance_type;
      $scope.activity.exclude_codes = $scope.activity.exclude_codes || [];
      $scope.exclude_code_set = new Set(activity.exclude_codes)
      if(activity.exclude_codes){
        $scope.exclude_codes = activity.exclude_codes.join();
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})

    });
  }

  /* Get Insurance Types */
  $scope.GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Remove Exclude Code*/
  $scope.RemoveExcludeCode = function(key){
    $scope.unsaved_changes = true;
    $scope.exclude_code_set.delete($scope.activity.exclude_codes[key])
    $scope.activity.exclude_codes.splice(key, 1);
    $scope.safeApply(fn => fn);
  }

  /* Push Exclude Code */
  $scope.PushExcludeCode = function(code){
    if(!code || $scope.exclude_code_set.has(code)){ return }
    $scope.unsaved_changes = true;
    $scope.activity.exclude_codes.push(code);
    $scope.exclude_code_set.add(code)
    code_to_push = null;
    code = null;
    $scope.safeApply(fn => fn);
  }

  /* Get Groups */
  $scope.GetGroups = function(){
    $rootScope.local_load = true;
    $scope.groups = {};
    metaService.getGroups(function(groups){
      for(var key in groups){
        $scope.groups[groups[key].group] = groups[key];
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Save Activity */
  $scope.SaveActivity = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    metaService.saveActivity($stateParams.activityquestion, $scope.activity, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      backofficeService.logpost({msg:'activity saved',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /* Enable Activity */
  $scope.EnableActivity = function(){
    $rootScope.local_load = true;
    metaService.enableActivity($stateParams.activityquestion,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      backofficeService.logpost({msg:'activity enabled',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /*Disable Activity*/
  $scope.DisableActivity = function(){
    $rootScope.local_load = true;
    metaService.disableActivity($stateParams.activityquestion,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      backofficeService.logpost({msg:'activity disabled',activity:$stateParams.activityquestion},$rootScope.user.email,'activityquestion','info',()=>{},()=>{})
      $rootScope.local_load = null;
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
    });
  }

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = {};
      for(var key in codes){
        $scope.codes_dict[codes[key].code] = codes[key];
        $scope.codes.push({key:key, code:codes[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* trigger when the insurance type changed */
  $scope.insuraceTypeChange = function(){
    console.log("insurance type changed",$scope.activity.insurance_type);
    /* delete the activity id from the other insurance id */
  }

  /* gets the insurance recommendation_mapping table*/
  function getRecommendationMapping(callback, err_call){
    $rootScope.local_load = true;
    metaService.getAllRecommendationMapping(_recommendationMapping =>{
      for(var index in _recommendationMapping.insurance_types){
        recommendationMappings.push({insurance_type: index,
          activity_weights : _recommendationMapping.insurance_types[index].activity_weights});
        }
        if(callback) callback();
      }, error => {
        console.error("error while fetching recommendation", error);
        if(err_call) err_call();
      });
    }
    /* Check if all recommendations objs are fetched and set the activity score on the ui once fetched */
    function getRecommendationMappingAndSetActvityScore(){
      if(!recommendationMappings || recommendationMappings.length == 0){
        getRecommendationMapping(()=>{
          setActivityScore();
        });
      }
      else{
        setActivityScore();
      }
    }

    /* Set activity score on the UI */
    function setActivityScore(){
      let currentInsuraceType = $scope.activity.insurance_type;
      let recommendationMapping = recommendationMappings.find(recommendationMapping=>recommendationMapping.insurance_type == currentInsuraceType);
      if(!recommendationMapping){
        return;
      }
      if(recommendationMapping.activity_weights && recommendationMapping.activity_weights[activityquestion])
        $scope.activity_score = parseInt(recommendationMapping.activity_weights[activityquestion].score,10);
      $scope.safeApply(fn => fn);
    }

    /* Save the activity score */
    function saveRecommendationScore(){
      let currentInsuraceType = $scope.activity.insurance_type;
      let data = {score: $scope.activity_score};
      /*delete the activity and it's score from the previous insurancetype before saving the activity
      to a new insurace type */
      if(previousInsuraceType &&
      currentInsuraceType &&
      previousInsuraceType != currentInsuraceType){
        metaService.deleteActivityRecommendationScore(previousInsuraceType, activityquestion, null, ()=>{
          console.log("successfully deleted the activity for previous insurance type")
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
        });
      }
      metaService.saveActivityRecommendationScore( currentInsuraceType,activityquestion, data, () =>{
        console.log("successfully saved activity weight")
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Recommendation Mapping For Insurance Type */
    const getRecommendationWeightForInsuraceType = insuraceType =>
    recommendationMappings.find(recommendationMapping =>
    recommendationMapping.insurance_type == insuraceType);


    /* Call these functions on controller load */
    $scope.GetActivity();
    $scope.GetInsuranceTypes();
    $scope.GetGroups();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetActvityScore();
  }

// Angular Module
angular.module('application').controller('AdditionalModulesOfferController', AdditionalModulesOfferController);

// Injections
AdditionalModulesOfferController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService'];

// Function
function AdditionalModulesOfferController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.offer_uid = $stateParams.offer_uid;
    $scope.comparison_uid = $stateParams.comparison_uid;
    $scope.selected_insurance_types = {};
    $scope.num_selected = 0;

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

    /* Get Single Offer */
    $scope.GetSingleOffer = function(){
      $rootScope.local_load = true;
      offerService.getSingleOffer($stateParams.offer_uid, function(offer){
        $scope.offer = offer;
        if(!$scope.offer.comparisons[$stateParams.comparison_uid]){
          $rootScope.genService.showDefaultErrorMsg('Could not load');
          $rootScope.local_load = null;
          return
        }
        $scope.comparison = $scope.offer.comparisons[$stateParams.comparison_uid];
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMapping(comparison_criteria_mapping => {
        $scope.comparison_criteria_mapping = comparison_criteria_mapping.insurance_types;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Get All Insurance Types */
    $scope.GetAllInsuranceTypes = function(){
      $rootScope.local_load = true;
      $scope.insurance_types = [];
      metaService.getInsuranceTypes(function(insurance_types){
        for(var key in insurance_types){
          if(insurance_types[key].disabled){
            continue;
          }
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add or Remove Selected Insurance Type */
    $scope.AddOrRemoveInsuranceType = function(key){
      if($scope.selected_insurance_types[key]){
        delete $scope.selected_insurance_types[key]
      } else {
        $scope.selected_insurance_types[key] = {specific : false};
      }
      $scope.num_selected = Object.keys($scope.selected_insurance_types).length
      $scope.safeApply(fn => fn);
    }

    /* Save Modules */
    $scope.SaveModules = function() {
      Object.assign($scope.comparison.insurance_types, $scope.selected_insurance_types);
      offerService.saveComparison($stateParams.offer_uid, $stateParams.comparison_uid, $scope.comparison, () => {
        $rootScope.genService.showDefaultSuccessMsg($scope.num_selected + ' Modules Added');
        $state.go('comparisonpreview',{offer:$stateParams.offer_uid})
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetSingleOffer();
    $scope.GetAllInsuranceTypes();
    $scope.GetComparisonCriteriaMapping();

}

// Angular Module
angular.module('application').controller('AllOffersController', AllOffersController);

// Injections
AllOffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService'];

// Function
function AllOffersController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Setting Offer Status */
    $scope.offer_status = $stateParams.status;
    $rootScope.offer_status = $scope.offer_status;

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

    /* Get All Requested Offers */
    $scope.GetAllOffers = function(){
      $scope.offers = [];
      $rootScope.local_load = true;
      offerService.getAllOffers(function(offers){
        for(var key in offers){
          if(offers[key].status !== $scope.offer_status){
            continue;
          }
          $scope.offers.push({key:key, offer:offers[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    }

    /* Get All Companies */
    $scope.GetAllCompanies = function(){
      companyService.getAllCompanies(function(companies){
        $scope.companies = companies;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    }

  $scope.openOffer = function(offerObj) {
    if (offerObj.offer.display_version == 2) {
      $state.go("comparisonpreview", {"offer":offerObj.key});
    }
    else{
      $state.go("offer",{"offer":offerObj.key});
    }
  };

    /* On Controller Load */
    $scope.GetAllOffers();
    $scope.GetAllCompanies();

}

// Angular Module
angular.module('application').controller('BundlesController', BundlesController);

// Injections
BundlesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function BundlesController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Add Blank Bundle */
    $scope.AddBlankBundle = function(){
      metaService.addInsuranceProduct(function(){
        $rootScope.genService.showDefaultSuccessMsg('Product Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Bundles */
    $scope.GetAllBundles = function(){
      $rootScope.local_load = true;
      $scope.products = [];
      metaService.getInsuranceProducts(function(products){
        for(var key in products){
          $scope.products.push({key:key, product:products[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllBundles();

}

// Angular Module
angular.module('application').controller('CarrierController', CarrierController);

// Injections
CarrierController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'FileUploader', 'backofficeService'];

// Function
function CarrierController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /* Get Carrier */
    $scope.GetCarrier = function(){
      $rootScope.local_load = true;
      console.log('Getting Carrier..');
      metaService.getSingleCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $scope.carrier = carrier;
        $scope.GetDownloadURL();
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})

      });
    }

    /* Save Carrier */
    $scope.SaveCarrier = function(){
      console.log('Saving Carrier..');
      $rootScope.local_load = true;
      metaService.saveCarrier($stateParams.carrier, $scope.carrier, function(){
        backofficeService.logpost({msg:'carrier saved',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadCarrierPhoto($scope.current_file, function(file_url){
        metaService.addPhotoToCarrier(file_url, $stateParams.carrier, function(carrier){
          $rootScope.local_load = null;
          backofficeService.logpost({msg:'file uploaded',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          $state.reload();
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
        });
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    /* Download Carrier Photo */
  	$scope.DownloadPhoto = function(){
  		metaService.downloadCarrier($scope.carrier.file, function(url_for_download){
  			$rootScope.genService.downloadWithLink(url_for_download);
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
  		});
  	}

    /* Get Download Url */
  	$scope.GetDownloadURL = function(){
      if(!$scope.carrier.file) return;
  		metaService.downloadCarrier($scope.carrier.file, function(url_for_download){
  			$scope.carrier_photo = url_for_download;
        console.log('Photo:',url_for_download);
        $scope.$apply();
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
  		});
  	}

    // Disable
    $scope.DisableCarrier = function(){
      $rootScope.local_load = true;
      metaService.disableCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'carrier disabled',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }

    // Enable
    $scope.EnableCarrier = function(){
      $rootScope.local_load = true;
      metaService.enableCarrier($stateParams.carrier, function(carrier){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'carrier enabled',carrier:$stateParams.carrier},$rootScope.user.email,'carrier','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'carrier','error',()=>{},()=>{})
      });
    }


    /* On Controller Load */
    $scope.GetCarrier();

    /**********************************/
    /**  	  Uploader Listeners       **/
    /**********************************/

    /* Uploader Instance */
    var uploader = $scope.uploader = new FileUploader({});
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            return this.queue.length < 10;
        }
    });

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };

    // File Added
    uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
        console.info('Added file with name', fileItem.file.name);
        $scope.can_upload = true;
        $scope.current_file = fileItem;
    };

    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
    };

}

// Angular Module
angular.module('application').controller('CarriersController', CarriersController);

// Injections
CarriersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function CarriersController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.carriers = [];

    $scope.AddBlankCarrier = function(){
      metaService.addCarrier(function(){
        $rootScope.genService.showDefaultSuccessMsg('Carrier Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Types */
    $scope.GetAllCarriers = function(){
      $rootScope.local_load = true;
      console.log('Getting Carrier(s)..');
      $scope.carriers = [];

      metaService.getCarriers(function(carriers){
        for(var key in carriers){
          $scope.carriers.push({key:key, carrier:carriers[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }


    /* On Controller Load */
    $scope.GetAllCarriers();

}

// Angular Module
angular.module('application').controller('ClaimController', ClaimController);

// Injections
ClaimController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'FileUploader', 'fileService', 'claimService', 'FoundationApi'];

// Function
function ClaimController($rootScope, $scope, $stateParams, $state, $controller, firebase, FileUploader, fileService, claimService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
  	$scope.new_claim = {};
    $scope.selected_claim = {};
    $scope.claims = {};

    /* Get My Claims */
    $scope.GetMyClaims = function(){
      console.log('Getting Claims..');
      var active  = [];
      var pending = [];
      claimService.getClaims(function(claimSet){
        for(var key in claimSet){
          var tmpClaim = claimSet[key];
          var status = tmpClaim.status.toLowerCase();
          if(status === 'active'){
            active.push(tmpClaim);
          } else if(status === 'pending'){
            pending.push(tmpClaim);
          } else {
            pending.push(tmpClaim);
          }
        }
        $scope.claims.active = active;
        $scope.claims.pending = pending;
        $scope.notempty = (pending.length+active.length > 0);
        $scope.selected_claim = {};
        $scope.$apply();
      },function(){

      });
    }

    /* Select Claim */
    $scope.SelectClaim = function(claim){
      $scope.selected_claim = claim;
    }

  	/**********************************/
  	/**  	    Claim  -  Modal        **/
  	/**********************************/


  	/* Perform upload */
  	$scope.MakeAClaim = function(form){
      console.log("Making Claim...");
      if(!form.$valid) { return }
  		claimService.makeNewClaim($scope.new_claim, function(){
        $scope.new_claim = {};
        FoundationApi.publish('main-notification', { 
          content: 'Claim Registered!',
          color:"success", 
          autoclose:3000
        });
      }, function(error){

      });
  	}

    /* Call Before Anything Else */
    $scope.GetMyClaims();  

} 

// Angular Module
angular.module('application').controller('CodeController', CodeController);

// Injections
CodeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function CodeController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

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

    /* Get Code */
    $scope.GetCode = function(){
      $rootScope.local_load = true;
      metaService.getSingleIndustryCode($stateParams.code, function(code){
        $rootScope.local_load = null;
        $scope.code = code;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Save Code */
    $scope.SaveCode = function(){
      $rootScope.local_load = true;
      metaService.saveIndustryCode($stateParams.code, $scope.code, function(){
        backofficeService.logpost({msg:'code saved',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Disable */
    $scope.DisableCode = function(){
      $rootScope.local_load = true;
      metaService.disableIndustryCode($stateParams.code, function(){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'code disabled',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }

    /* Enable */
    $scope.EnableCode = function(){
      $rootScope.local_load = true;
      metaService.enableIndustryCode($stateParams.code, function(){
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'code enabled',code:$stateParams.code},$rootScope.user.email,'code','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }


    /* On Controller Load */
    $scope.GetCode();

}

// Angular Module
angular.module('application').controller('CodesController', CodesController);

// Injections
CodesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function CodesController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

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

    /* Add Blank Code */
    $scope.AddBlankCode = function(){
      metaService.addIndustryCode(function(){
        $rootScope.genService.showDefaultSuccessMsg('Code Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Codes */
    $scope.GetAllCodes = function(){
      $rootScope.local_load = true;
      metaService.getIndustryCodes(function(codes){
        const codesArr = [];
        for(let key in codes) {
          if (codes.hasOwnProperty(key)) {
            codesArr.push({key: key, code: codes[key]});
          }
        }

        $scope.codes = codesArr.sort((code1, code2) => {
          const val1 = (code1.code.code || '0') + ''; //We sometimes get "undefined" here, so default to zero
          const val2 = (code2.code.code || '0') + '';
          const split1 = val1.split('.');
          const split2 = val2.split('.');

          let res = 0, pos = -1;
          while(res === 0) {
            pos++;
            if (pos > split1.length - 1 && pos > split2.length - 1) break; //For some reason, the codes are equal
            const num1 = Number(split1[pos]) || 0; //Force typecast and default with zero, if this level is missing
            const num2 = Number(split2[pos]) || 0;
            if (num1 === num2) continue; //On this level the codes are equal, we need to go deeper
            res = (num1 < num2) ? -1 : 1; //Found the difference.
          }
          return res;
        });
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    };

    /* On Controller Load */
    $scope.GetAllCodes();

}

// Angular Module
angular.module('application').controller('CompanyViewController', CompanyViewController);

// Injections
CompanyViewController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService' ,'claimService', 'FileUploader', 'userService', 'mandateService', 'metaService', 'backofficeService', 'offerService','authService'];

// Function
function CompanyViewController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, claimService, FileUploader, userService, mandateService, metaService, backofficeService, offerService,authService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  // Scope Models
  $scope.company = {};
  $scope.addresses = [];
  $scope.policies = [];
  $scope.users = [];
  $scope.answers = [];
  $scope.claims = [];
  $scope.this_company = $stateParams.company;

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

  /* Get All Companies */
  $scope.GetSingleCompanyInformation = function(){
    $scope.company = {};
    $scope.addresses = [];
    $scope.policies = [];
    $scope.claims = [];

    $rootScope.local_load = true;
    companyService.getCompanyInformation($stateParams.company, function(company){
      $scope.company = company;
      companyService.getCompanyAddress($stateParams.company, function(addresses){
        for(var key in addresses){
          $scope.addresses.push(addresses[key]);
        }
        $scope.GetCodesForCompany();
        $scope.GetAnswersToInsuranceQuestions();
        $scope.GetAllOffers();
        policyService.getPolicies($stateParams.company, function(policies){
          for(var key in policies){
            $scope.policies.push({policy:policies[key], key:key});
          }
          claimService.getClaims($stateParams.company, function(claims){
            for(var key in claims){
              $scope.claims.push(claims[key]);
            }
            $rootScope.local_load = null;
            $scope.safeApply( fn => fn);
          }, function(error){
            $rootScope.genService.showDefaultErrorMsg('claim error: '+error.message);
            backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
          });
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('policy error: '+error.message);
          backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('address error: '+error.message);
        backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      });
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg('company error: '+error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /**
   * Download policy. Rename according to alias if possible
   * @param policy
   */
  $scope.DownloadPolicy = function(policy){
    if(!policy) {return}
    const from = "policies/" + $scope.offer.company + "/" + policy.file;
    const rename_to = policy.alias ? (policy.alias + '.pdf') : policy.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* Get Users */
  $scope.GetUsersOfCompany = function(){
    $scope.users = [];
    userService.getUsersOfCompany($stateParams.company, function(users){
      for(var key in users){
        userService.returnUserInfo(key,user=>{
          $scope.users.push({key:key, user:user});
          $scope.safeApply( fn => fn);
        },function(error){
          console.error(error)
        })
      }
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  }



  /* Register New Policy */
  $scope.RegisterNewPolicy = function(){
    policyService.registerExistingPolicy($stateParams.company, null ,function(result){
      let policy_key = Object.keys(result)[1].split('/')[1];
      backofficeService.logpost({msg:'New Policy Added by Liimex',company:$stateParams.company},$rootScope.user.email,'company','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('New Policy Added');
      $state.go('extractionpreview', {policy: policy_key});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  }

  /* Select Policy */
  $scope.SelectPolicy = function(policy){
    $scope.selected_policy = policy;
    $scope.selected_policy.created_at = $rootScope.genService.convertStampToDate(policy.created_at);
    $scope.selected_policy.start_date = $rootScope.genService.convertStampToDate(policy.start_date);
    $scope.selected_policy.end_date = $rootScope.genService.convertStampToDate(policy.end_date);
    $scope.selected_policy.updated_at = $rootScope.genService.convertStampToDate(policy.updated_at);
  }

  /* Select Claim */
  $scope.SelectClaim = function(claim){
    $scope.selected_claim = claim;
  }

  /* Block Company */
  $scope.BlockCompany = function(){
    companyService.blockCompany($stateParams.company, function(){
      $rootScope.genService.showDefaultSuccessMsg('Company Blocked');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /* Unblock Company */
  $scope.UnblockCompany = function(){
    companyService.unblockCompany($stateParams.company, function(){
      $rootScope.genService.showDefaultSuccessMsg('Company Unblocked');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
    });
  };

  /**
   * Download signed mandate
   * @param {Object} mandate Mandate data
   */
  $scope.downloadMandate = function(mandate){
    if(!mandate) {return}
    const from = "mandates/" + $stateParams.company + "/" + mandate.signed_document_url;
    const rename_to = "Mandate for " + $scope.company.name + " signed at " + moment(mandate.timestamp).format("D MMMM YYYY HH.mm") + ".pdf";
    fileService.downloadWithName(from, rename_to);
  };

  $scope.newgetMandateInformation = function(){
    companyService.getCompanyInformation($stateParams.company, function(company){
      mandateService.getMandateById(company.mandate, mandate=>{
        $scope.mandate = mandate
      },function(error){
        console.error(error);
      })
    },function(error){
      console.error(error);
    })
  };

  /* Get Extraction Help */
  $scope.GetExtractionHelp = function(){
    $rootScope.local_load = true;
    metaService.getInsuranceTypes(function(insurance_types){
      $scope.insurance_types = insurance_types;
      $rootScope.local_load = null;
      $scope.safeApply( fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      console.error(error);
    });
  };

  /* Carrier info*/
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'company','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Codes For Company */
  $scope.GetCodesForCompany = function(){
    $rootScope.local_load = true;
    if(!$scope.company.industry_codes) { return }
    let codes_to_get = [];
    for(var code in $scope.company.industry_codes){
      let combined = "", temp_code = $scope.company.industry_codes[code].split('.');
      for(var place in temp_code){
        combined = combined === "" ? combined.concat(temp_code[place]) : combined.concat('.',temp_code[place])
        codes_to_get.push(combined);
      }
    }
    $scope.codes_to_show = [];
    for(var index in codes_to_get){
      let search_code = !codes_to_get[index].includes('.')  ? Number(codes_to_get[index]) : codes_to_get[index]
      metaService.getCodeDataFromCode(search_code, function(code){
        $rootScope.local_load = null;
        if(!code) {return}
        $scope.codes_to_show.push(code[Object.keys(code)[0]]);
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }
  }

  /*Get Mandate Information*/
  $scope.getMandateInformation = function(){
    mandateService.getSingleMandate($stateParams.company,function(mandates){
      //start pushing the mandates
      $scope.mandates = []
      for (var key in mandates){
        $scope.mandates.push({mandate:mandates[key], key:key});
      }
    },function(error){
      console.error(error);
    })
  }

  /* Get All Offers */
  $scope.GetAllOffers = function(){
    offerService.getOffersForCompany($stateParams.company, offers => {
      $scope.offers = [];
      for(var key in offers){
        $scope.offers.push({offer:offers[key], key:key});
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
    });
  }

  /* Get Answers */
  $scope.GetAnswersToInsuranceQuestions = function() {
    $scope.questions = {};
    metaService.getAllInsuranceQuestions(questions => {
      $scope.questions = questions;
    }, error => {
      console.error(error);
    });
  };

  /* Get Activities */
  $scope.GetActivities = function(forms){
    metaService.getAllActivities(activities => {
      $scope.activities = activities;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /* redirect to edit company industries  */
  $scope.EditIndustries = function(){
    $state.go('selectindustry',{'companyid': $scope.this_company});
  };


  /* redirect to getoffers page  */
  $scope.GetOffers = function(){
    $state.go('getoffer',{'companyid': $scope.this_company});
  };


  /* redirect to edit activities  */
  $scope.EditActivities = function(){
    $state.go('pickactivity',{'companyid': $scope.this_company});
  };

  /* reset user password */
  $scope.ResetUserPassword = function(email){
    authService.resetPassword({'email':email},()=>{
      console.log("reset password for user successfully");
      $rootScope.genService.showDefaultSuccessMsg('reset password for user successfully');
    },error=>{
      console.log("error while resetting the password",error);
      $rootScope.genService.showDefaultErrorMsg("error while resetting the password"+error.message);
    });
  };

  /* Perform upload on file change */
  $scope.MandateFileChanged = function(file){
    if(!file){return}

    mandateService.uploadMandate(file, $stateParams.company, $scope.company.mandate, () => {
      $rootScope.genService.showDefaultSuccessMsg('Mandate uploaded successfully');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser, 'company', 'error', ()=>{}, ()=>{});
    });
  };

  /* Go To Extraction View */
  $scope.GoToExtractionView = function(policy, policy_uid){
    if(policy.display_version === 2){
      $state.go('extractionpreview', {policy:policy_uid})
    } else {
      $state.go('extraction', {policy:policy_uid, company:$stateParams.company})
    }
  }

  /* Go To Offer View */
  $scope.GoToOfferView = function(offer, offer_uid){
    console.log(offer);
    if(offer.display_version === 2){
      $state.go('comparisonpreview', {offer:offer_uid})
      console.log('YO');
    } else {
      console.log('ELSE');
      $state.go('offer', {offer:offer_uid, company:$stateParams.company})
    }
  }


  /******************/
  /* Call On Controller Load */
  $scope.newgetMandateInformation();
  $scope.GetSingleCompanyInformation();
  $scope.GetUsersOfCompany();
  $scope.GetExtractionHelp();
  $scope.GetCarriers();
  $scope.GetActivities();

  /* Uploader Instance */
  // Uploader
  var uploader = $scope.uploader = new FileUploader({});
  uploader.filters.push({
    name: 'customFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      return this.queue.length < 10;
    }
  });

  /**********************************/
  /**  	  Uploader Listeners     **/
  /**********************************/

  uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
    console.info('onWhenAddingFileFailed', item, filter, options);
  };

  // File Added
  uploader.onAfterAddingFile = function(fileItem) {
    console.info('onAfterAddingFile', fileItem);
    console.info('Added file with name', fileItem.file.name);
    $scope.can_upload = true;
    $scope.current_file = fileItem;
  };

  uploader.onAfterAddingAll = function(addedFileItems) {
    console.info('onAfterAddingAll', addedFileItems);
  };
  uploader.onBeforeUploadItem = function(item) {
    console.info('onBeforeUploadItem', item);
  };
  uploader.onProgressItem = function(fileItem, progress) {
    console.info('onProgressItem', fileItem, progress);
  };
  uploader.onProgressAll = function(progress) {
    console.info('onProgressAll', progress);
  };
  uploader.onSuccessItem = function(fileItem, response, status, headers) {
    console.info('onSuccessItem', fileItem, response, status, headers);
  };
  uploader.onErrorItem = function(fileItem, response, status, headers) {
    console.info('onErrorItem', fileItem, response, status, headers);
  };
  uploader.onCancelItem = function(fileItem, response, status, headers) {
    console.info('onCancelItem', fileItem, response, status, headers);
  };
  uploader.onCompleteItem = function(fileItem, response, status, headers) {
    console.info('onCompleteItem', fileItem, response, status, headers);
  };
  uploader.onCompleteAll = function() {
    console.info('onCompleteAll');
  };


}

// Angular Module
angular.module('application').controller('ComparisonCriteriaController', ComparisonCriteriaController);

// Injections
ComparisonCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriaController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
    
    let comparisoncriteria_id = $stateParams.comparisoncriteria_id;
    $scope.criteria = {};
    $scope.showWarningMessage = false;
    
    /* Get All Policy Types */
    $scope.GetComparisonCriteria = function(){
        $rootScope.local_load = true;
        if(comparisoncriteria_id)
            metaService.getSinglecomparisonCriteria(comparisoncriteria_id,(comparisonCriteria)=>{
            $scope.criteria = comparisonCriteria;
            $rootScope.local_load = null;
            $scope.$apply();
        },function(error){
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }
    
    $scope.saveCriteria = function(){
        if(!$scope.criteria.explanation_text_de || !$scope.criteria.explanation_text_en || !$scope.criteria.name_de||!$scope.criteria.name_en){
            $scope.showWarningMessage = true;
            return;
        }
        $scope.showWarningMessage = false;
        if(comparisoncriteria_id){
            metaService.saveComparisonCriteria(comparisoncriteria_id,$scope.criteria,()=>{
                $rootScope.genService.showDefaultSuccessMsg('criteria details updated');
            },(error)=>{
                $rootScope.genService.showDefaultErrorMsg('error while criteria update');
                console.log("error while criteria update",error);
            });
        }
        else{
            metaService.addComparisonCriteria($scope.criteria,()=>{
                $rootScope.genService.showDefaultSuccessMsg('new criteria added');
            },(error)=>{
                $rootScope.genService.showDefaultErrorMsg('error while adding new criteria');
                console.log("error while adding new criteria",error);
            });
        }
    }
    
    $scope.back = function(){
        $state.go("comparisoncriterias",{},{reload:true});
    }
    
    /* On Controller Load */
    $scope.GetComparisonCriteria();
    
}

// Angular Module
angular.module('application').controller('ComparisonCriteriaPicker', ComparisonCriteriaPicker);

// Injections
ComparisonCriteriaPicker.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriaPicker($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.selected_criteria = {};
    $scope.num_selected = 0;
    $scope.insurance_type = $stateParams.insurance_type;

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

    /* Get Comparison Criteria */
    $scope.GetAllComparisonCriteria = function(){
      $rootScope.local_load = true;
      metaService.getAllComparisonCriteria(comparison_criteria => {
        $scope.comparison_criteria = comparison_criteria;
        $scope.comparison_criteria_list = [];
        for(let key in comparison_criteria){
          $scope.comparison_criteria_list.push({key:key, criteria:comparison_criteria[key]})
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      })
    }

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMapping(comparison_criteria_mapping => {
        $scope.comparison_criteria_mapping = comparison_criteria_mapping;
        $scope.no_mapping = !$scope.comparison_criteria_mapping;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Add or Remove Criteria */
    $scope.AddOrRemoveSelectedCriteria = function(criteria_key){
      if($scope.selected_criteria[criteria_key]) {
        delete $scope.selected_criteria[criteria_key];
      } else {
        $scope.selected_criteria[criteria_key] = true;
      }
      $scope.num_selected = Object.keys($scope.selected_criteria).length
      $scope.safeApply(fn => fn);
    }

    /* Add Comparison Criteria */
    $scope.AddComparisonCriteria = function(){
      metaService.addComparisonCriteriaToMapping($stateParams.insurance_type, $scope.selected_criteria, () => {
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.go('insurancetype', {insurancetype:$stateParams.insurance_type})
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* On Controller Load */
    $scope.GetAllComparisonCriteria();
    $scope.GetComparisonCriteriaMapping();

}

// Angular Module
angular.module('application').controller('ComparisonCriteriasController', ComparisonCriteriasController);

// Injections
ComparisonCriteriasController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ComparisonCriteriasController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.comparisonCriterias = [];

    $scope.addcomparisoncriteria = function(){
      $state.go('comparisoncriteria');
    }

    /* Get All Policy Types */
    $scope.GetAllComparisonCriterias = function(){
      $rootScope.local_load = true;
      console.log('Getting comparison criteria(s)..');
      $scope.comparisonCriterias = [];

      metaService.getcomparisonCriterias(function(comparisonCriterias){
        for(var key in comparisonCriterias){
          $scope.comparisonCriterias.push({key:key, criteria:comparisonCriterias[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }


    /* On Controller Load */
    $scope.GetAllComparisonCriterias();

}

// Angular Module
angular.module('application').controller('ComparisonPreviewController', ComparisonPreviewController);

// Injections
ComparisonPreviewController.$inject = ['$rootScope', '$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'extractionService', 'metaService', 'FoundationApi', 'backofficeService', 'fileService', 'documentService', '$sce'];

// Function
function ComparisonPreviewController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, extractionService, metaService, FoundationApi, backofficeService, fileService, documentService, $sce) {

  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  /* Scope Variables */
  $scope.offer_uid = $stateParams.offer;
  const REPORT_GENERATION_TIMEOUT = 4000;
  $scope.Math = window.Math;
  $scope.file_limit = 5;
  $scope.files_to_upload = {};
  $scope.files_uploaded = {};

  /* WD50 */
  $scope.safeApply = function (fn = fn => fn) {
    if (!this.$root) {
      return;
    }
    const phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  $scope.max_offer_count = 3;

  $scope.generic_keys = {
    'general': 'General',
    'specific': 'Specific',
    'additional': 'Additional Insurance Modules'
  };

    /**
     * Prepare html string to be displayed as part of the DOM
     * @param {String} html Raw html data
     * @return {String} Trusted html string
     */
  $scope.transformToHtml = function(html){
    return $sce.trustAsHtml(html);
  };

  /**
   * Retrieve offer section caption by text key
   * @param {String} key Section text key or industry type
   * @return {String} Section text caption
   */
  $scope.getSectionName = function (key) {
    if (!key) {
        return '';
    }
    if ($scope.comparisons && $scope.comparisons[key]) {
        return $scope.comparisons[key].name_de;
    }
    return $scope.generic_keys[key] || key;
  };

  $scope.includeCriteria = function(comparison_uid, insurance_type_uid, criteria_uid, callback) {
      $scope.onInlineChange({
          comparison_uid,
          insurance_type_uid,
          criteria_uid,
          value_type: 'specific',
          key: 'included'}, true, callback);
  };

  $scope.excludeCriteria = function(comparison_uid, insurance_type_uid, criteria_uid, callback) {
      $scope.onInlineChange({
          comparison_uid,
          insurance_type_uid,
          criteria_uid,
          value_type: 'specific',
          key: 'included'}, false, callback);
  };

  $scope.switchToPercents = function(identity, callback) {
      const params = Object.assign({}, identity, {key: 'deductible_is_percent'});
      $scope.onInlineChange(params, true, callback);
  };

  $scope.switchToAbsolute = function(identity, callback) {
      const params = Object.assign({}, identity, {key: 'deductible_is_percent'});
      $scope.onInlineChange(params, false, callback);
  };

    $scope.switchToUnlimited = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'unlimited_sum_insured'});
        $scope.onInlineChange(params, true, callback);
    };

    $scope.switchToLimited = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'unlimited_sum_insured'});
        $scope.onInlineChange(params, false, callback);
    };

    $scope.switchMaxToPercents = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'deductible_max_is_percent'});
        $scope.onInlineChange(params, true, callback);
    };

    $scope.switchMaxToAbsolute = function(identity, callback) {
        const params = Object.assign({}, identity, {key: 'deductible_max_is_percent'});
        $scope.onInlineChange(params, false, callback);
    };

  $scope.onInlineChange = function(identity, value, callback) {
      const params = Object.assign({offer_uid: $scope.offer_uid, value}, identity);
      console.log(identity, value);
      offerService.updateSingleValue(params, () => {
          loadOffer();
          if (typeof callback === 'function') {
              callback();
          }
      }, err => {
          if (typeof callback === 'function') {
              callback(err);
          }
          console.log(err);
      });
  };

  $scope.onRightIcon = function(identity, value, action, callback) {
      if (action === 'exclude') {
          $scope.excludeCriteria(identity.comparison_uid, identity.insurance_type_uid, identity.criteria_uid, callback);
      }
      if (action === 'to_unlimited') {
          $scope.switchToUnlimited(identity, callback);
      }
      if (action === 'to_limited') {
          $scope.switchToLimited(identity, callback);
      }
      if (action === 'to_percent') {
          $scope.switchToPercents(identity, callback);
      }
      if (action === 'to_absolute') {
          $scope.switchToAbsolute(identity, callback);
      }
      if (action === 'max_to_percent') {
          $scope.switchMaxToPercents(identity, callback);
      }
      if (action === 'max_to_absolute') {
          $scope.switchMaxToAbsolute(identity, callback);
      }
  };

  $scope.includedDefined = function(included) {
      return typeof included === 'boolean';
  };

  /**
   * Apply class for the comparison criteria
   * @param {Object | false} comparison Offer comparison object
   * @return {String} Class name
   */
  $scope.checkCoverage = function (comparison, comparison_uid, insurance_type_uid) {
    if (typeof $scope.offer.comparisons[comparison_uid].insurance_types[insurance_type_uid] === 'undefined') {
        return "not-used";
    }
    if (!comparison || typeof comparison.included !== 'boolean') {
        return "not-applicable";
    }
    if (!comparison.included) {
        return "not-included";
    }
    if (comparison.included && comparison.sublimit == null) {
        return 'is-empty';
    }
    return '';
  };

  $scope.checkEmptyCell = function(value) {
        if (value == null) return 'is-empty';
        return '';
  };

  /* Check Basic */
  $scope.checkBasic = function(basic_criteria){
    if (typeof basic_criteria === 'undefined') return "not-applicable";
    return '';
  };

  $scope.filterNullHandling = function(branch_key) {
    return Boolean($scope.comparisons || branch_key === 'general');
  };

  /**
   * Apply class for the empty insurance type header
   * @param {Object | false} insurance_type
   * @return {string}
   */
  $scope.checkEmpty = function (insurance_type) {
    return insurance_type ? '' : 'empty';
  };

  $scope.checkObsolete = function (insurance_type_key, criterion_key) {
    if (!$scope.obsolete_criteria[insurance_type_key]) return '';
    return $scope.obsolete_criteria[insurance_type_key][criterion_key] ? 'obsolete' : '';
  };

  $scope.isEditEnabled = function() {
      return $scope.offer.status === 'requested' && $scope.offer.advisor === $scope.user.email;
  };

  /**
   * Retrieve comparisons for the single insurance type
   * @param {String} insurance_type_key
   * @param {Object} company
   * @return {Promise}
   */
  function getInsuranceIndustryComparisons(insurance_type_key, company) {
    return new Promise((resolve, reject) => {
      extractionService.getSpecificCriteriaForIndustryCodes(insurance_type_key, company.industry_codes, (res) => {
        resolve(res.specificCriterias || []);
      }, reject);
    });
  }

  /**
   * Get all possible comparison criteria for the given offer and company
   * @param {Object} offer
   * @param {Object} company
   * @param {Function} callback
   */
  function prepareMappedComparisons(offer, company, callback) {
    const insurance_types = new Set();
    Object.keys(offer.comparisons || {}).forEach(comparison_key => {
      Object.keys(offer.comparisons[comparison_key].insurance_types || {}).forEach(insurance_type_key => insurance_types.add(insurance_type_key));
    });

    const insurance_type_keys = [...insurance_types];

    function mapType(insurance_type_key) {
      return getInsuranceIndustryComparisons(insurance_type_key, company);
    }

    Promise.all(insurance_type_keys.map(mapType))
      .then(comparisons => {
        const cache = {};
        insurance_type_keys.forEach((insurance_type_key, i) => {
          cache[insurance_type_key] = comparisons[i];
        });
        callback(null, cache);
      })
      .catch(callback);
  }

  /**
   * Retrieve current offer from the database and prepare the data for the template
   */
  function loadOffer() {
    $rootScope.local_load = true;

    $scope.offer_id = $stateParams.offer;

    offerService.getSingleOffer($stateParams.offer, function (offer) {
      companyService.getCompanyInformation(offer.company, function (company) {
        prepareMappedComparisons(offer, company, function (err, criteria) {
          $scope.criteria = criteria;
          if (err) return console.log(err);

          $scope.offer = offer;
          $scope.company = company;
          $scope.offer_count = 0;

          $scope.getProductsForThisInsuranceType();
          $scope.number_of_eligible_products = $scope.offer.products ? Object.keys($scope.offer.products).length : 0;

          $scope.tree = {};

          if (offer.comparisons) {

            $scope.comparison_keys = Object.keys($scope.offer.comparisons);
            $scope.offer_count = $scope.comparison_keys.length;

            $scope.compare_insurance_types = [];
            $scope.general={};

            $scope.tree = {
              specific: {},
              additional: {}
            };

            $scope.branch_keys = Object.keys($scope.tree);
            $scope.obsolete_criteria = {};

            //iterate offer comparisons
            $scope.comparison_keys.forEach(comparison_key => {
              const comparison = offer.comparisons[comparison_key];

              //iterate comparison insurance types
              for (let insurance_type_key in comparison.insurance_types) {
                if (comparison.insurance_types.hasOwnProperty(insurance_type_key)) {
                  const insurance_type = comparison.insurance_types[insurance_type_key];

                  if (typeof insurance_type === 'object') { //Dev.purposes mostly: we don't expect this to be false in real life

                    /**
                     * Additional & Specific
                     */

                    const comparison_type = insurance_type_key === offer.subject ? 'specific' : 'additional';

                    //Combining criteria from comparison object with industry/insurance criteria mapping
                    const related_criteria = [...new Set((criteria[insurance_type_key] || []).concat(Object.keys(insurance_type.specific || {})))];

                    if (related_criteria.length) { //There're applicable criteria for this insurance/industry
                      if (!$scope.tree[comparison_type][insurance_type_key]) $scope.tree[comparison_type][insurance_type_key] = {};

                      related_criteria.forEach(criterion_key => {
                        if (!$scope.tree[comparison_type][insurance_type_key][criterion_key]) $scope.tree[comparison_type][insurance_type_key][criterion_key] = {};
                        $scope.tree[comparison_type][insurance_type_key][criterion_key][comparison_key] = insurance_type.specific ? insurance_type.specific[criterion_key] : false;

                        // Checking for the "obsolete" criteria. I.e. the criteria that exist in the offer, but have been removed from the mapping
                        if (criteria[insurance_type_key].indexOf(criterion_key) === -1) {
                          if (!$scope.obsolete_criteria[insurance_type_key]) $scope.obsolete_criteria[insurance_type_key] = {};
                          $scope.obsolete_criteria[insurance_type_key][criterion_key] = true;
                        }
                      });
                    } else { //Empty insurance type has no applicable criteria
                      $scope.tree[comparison_type][insurance_type_key] = false;
                    } //if (related_criteria.length)
                  } //if (typeof insurance_type === 'object')
                } //if (comparison.insurance_types.hasOwnProperty(insurance_type_key))
              }

            });
          }
          $rootScope.local_load = null;
          $scope.adding_comparison = false;
          $scope.copying_comparison = false;
          $scope.CheckModel();
            console.log($scope.tree);
            console.log($scope.offer.comparisons);
          $scope.safeApply();
        }); //prepareMappedComparisons(offer, company, function (err, criteria)
      }); //companyService.getCompanyInformation(offer.company, function (company)
    }); //offerService.getSingleOffer($stateParams.offer, function (offer)
  }

  $scope.addSingleComparison = function(comparison_uid, insurance_type_id) {
    // $rootScope.local_load = true;
    Object.assign($scope.offer.comparisons[comparison_uid].insurance_types, {[insurance_type_id]: {specific : false}});
    offerService.saveComparison($stateParams.offer, comparison_uid, $scope.offer.comparisons[comparison_uid], () => {
      $rootScope.genService.showDefaultSuccessMsg('Insurance Type added');
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /* Make Preferred */
  $scope.MakePreferred = function(comparison_key){
    $rootScope.local_load = true;
    $scope.offer.preferred = comparison_key;
    offerService.saveOffer($stateParams.offer, $scope.offer, () => {
      $rootScope.genService.showDefaultSuccessMsg('Marked Preferred');
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /**
   * Remove comparison from the current offer
   * @param comparison_uid
   */
  $scope.deleteComparison = function (comparison_uid) {
    $rootScope.local_load = true;
    offerService.deleteComparison($stateParams.offer, comparison_uid, () => {
      loadOffer();
      FoundationApi.publish('comparison-deletion-modal', 'hide');
      $rootScope.genService.showDefaultSuccessMsg('Comparison deleted');
    }, (err) => {
      console.log(err);
    })
  };

  /**
   * Remove insurance type from the offer
   * NB! Not applicable to the offer subject
   * @param insurance_type_key
   */
  $scope.deleteInsuranceType = function (insurance_type_key, comparison_key) {
    $rootScope.local_load = true;
    if (insurance_type_key === $scope.offer.subject) { return; }
    const comparison_keys = comparison_key ? [comparison_key] : $scope.comparison_keys;
    Promise.all(comparison_keys.map(comparison_key => {
      return new Promise((resolve, reject) => {
        offerService.deleteOfferInsuranceType($stateParams.offer, comparison_key, insurance_type_key, resolve, reject);
      });
    }))
    .then(() => {
      loadOffer();
      FoundationApi.publish('insurance-type-deletion-modal', 'hide');
    })
    .catch(console.log);
  };

  /**
   * Remove criterion data from the offer.
   * NB! It will not remove criterion from the insurance type or industry
   * @param insurance_type_key
   * @param criterion_key
   */
  $scope.purgeCriterion = function (insurance_type_key, criterion_key) {
    Promise.all($scope.comparison_keys.map(comparison_key => {
      return new Promise((resolve, reject) => {
        offerService.deleteOfferCriteria($stateParams.offer, comparison_key, insurance_type_key, criterion_key, resolve, reject);
      });
    }))
      .then(() => {
        loadOffer();
        FoundationApi.publish('criterion-deletion-modal', 'hide');
      })
      .catch(console.log);
  };

  const criteria_dummy = {
    sum_insured: 0,
    deductible_absolute_max: 0,
    deductible_absolute_min: 0,
    deductible_is_percent: false,
    deductible_percent_max: 0,
    included: false,
    maximisation: 1
  };

  /* Remove From Offer */
  $scope.RemoveFromOffer = function(key){
    offerService.removeDocument($stateParams.offer, $scope.selected_comparison, key, () => {
      delete $scope.files_uploaded[key];
      loadOffer();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
    })
  };

  /**
   * Create a new blank comparison in the current offer
   * @return {undefined}
   */
  $scope.createNewComparison = function () {
    if ($scope.offer_count < $scope.max_offer_count) {
      $scope.adding_comparison = true;

      const comparison = {
        basic : {insurance_tax : 19},
        insurance_types: {
          [$scope.offer.subject]: {
            general: Object.assign({}, criteria_dummy),
            specific: {}
          }
        }
      };

      offerService.addComparison($stateParams.offer, comparison, () => {
        loadOffer();
      }, err => {
        console.log(err);
      });
    }
  };

  /**
   * Duplicate Comparison
   */
  $scope.DuplicateComparison = function (old_comparison, comparison_key) {
    if ($scope.offer_count < $scope.max_offer_count) {
      $scope.copying_comparison = {}
      $scope.copying_comparison[comparison_key] = true;
      const comparison = old_comparison
      offerService.addComparison($stateParams.offer, comparison, () => {
        loadOffer();
      }, (err) => {
        console.log(err);
      });
    }
  };

    $scope.DownloadReport = function(){
        const from = "documents/" + $scope.offer.company + "/" + $scope.offer.report;
        const rename_to = "Report for " + $scope.company.name + " for the offer of " + $scope.insurance_types[$scope.offer.subject].name_de + " " + moment($scope.offer.created_at).format("D MMMM YYYY HH.mm") + ".pdf";
        $scope.offer_in_progress = true;
        fileService.downloadWithName(from, rename_to)
            .then(() => {
                $scope.offer_in_progress = false;
                $scope.safeApply();
            })
            .catch(error => {
                $rootScope.genService.showDefaultErrorMsg('Q&A document link is broken');
                backofficeService.logpost(error, $scope.currentUser, 'offer_v2', 'error', () => {
                }, () => {});
                $scope.offer_in_progress = false;
                $scope.offer_broken = true;
                $scope.safeApply();
            })
    };

  /* File Changed */
  $scope.FileChanged = function(file){
    if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
      return;
    }
    $scope.files_to_upload[file.name] = file;
    $scope.PerformUpload(file)
  };

  /* Remove From Uploads */
  $scope.RemoveFromUploads = function(key, files){
    if(!$scope.files_to_upload[key]){
      return;
    }
    delete $scope.files_to_upload[key];
    if(Object.keys($scope.files_to_upload).length === 0){
      // Nothing Yet
    }
    $scope.safeApply(fn => fn);
  };

  /* Edit Alias */
  $scope.EditAlias = function(key){
    $scope.selected_document = $scope.files_uploaded[key];
    $scope.selected_document_key = key;
  };

  /* Perform upload */
  $scope.PerformUpload = function(file){
    if(!file){ return }
    $rootScope.local_load = true;
    $scope.disableUploadBtn= true;
    documentService.uploadFile(file, $scope.offer.company, file_urls => {
      documentService.createGenericDocument(file_urls, $scope.offer.company, (newUpdateDocuments, document_list) => {
        offerService.addDocumentToOffer(newUpdateDocuments, document_list.document, $stateParams.offer, $scope.selected_comparison, () => {
          $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
          delete $scope.files_to_upload[file.name];
          $rootScope.local_load = null;
          loadOffer();
        }, error => {
          $scope.disableUploadBtn= false;
          $rootScope.local_load = null;
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.code);
          backofficeService.logpost(error,$scope.currentUser,'offer_v2','error',()=>{},()=>{});
        });
      });
    }, error => {
      console.error(error);
      $scope.disableUploadBtn= false;
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Save Document */
  $scope.SaveDocument = function(selected_document) {
    let route = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].route;
    let key = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].key;
    documentService.saveDocument(route, key, selected_document, () => {
      $scope.GetDocuments();
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      document.getElementById('close_alias').click();
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'could not update document','error',()=>{},()=>{})
    })
  };

  /* Download Policy */
  $scope.DownloadFile = function(object){
    if(!object) { return }
    const from = "documents/" + $scope.offer.company + "/" + object.file;
    const rename_to = object.alias ? (object.alias + '.pdf') : object.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* Mark as Offered */
  $scope.MarkAsOffered = function(){
    $rootScope.local_load = true;
    let offer_display_version = 2;
    offerService.markOfferAsOffered(offer_display_version, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
      backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };


  $scope.note_editor = {};

  /**
   * Edit Note
   */
  $scope.EditNote = function(comparison_uid){
    if (!$scope.isEditEnabled()) return;
    $scope.note_editor.comparison_uid = comparison_uid;
    $scope.note_editor.html = $scope.offer.comparisons[comparison_uid].basic.note || '';
    FoundationApi.publish('edit_note_modal', 'show');    
    $scope.safeApply(fn => fn);
  };

  $scope.SaveNote = function(note_html){

      const params = {
          offer_uid: $stateParams.offer,
          comparison_uid: $scope.note_editor.comparison_uid,
          value_type: 'basic',
          key: 'note',
          value: note_html
      };
      offerService.updateSingleValue(params, () => {
          $scope.key_note_edit = null;
          $rootScope.genService.showDefaultSuccessMsg('Saved');
          FoundationApi.publish('edit_note_modal', 'close');
          loadOffer();
      }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
      });
  };

  /* Mark as Offered Dont Notify */
  $scope.MarkAsOfferedDontNotify = function(){
    $rootScope.local_load = true;
    let offer_display_version = 2;
    offerService.markOfferAsOfferedDontNotify(offer_display_version, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
      backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{})
    });
  };

  /* Generate New Report */
  $scope.GenerateNewReport = function() {
    $scope.offer_in_progress = true;
    offerService.generateReport($stateParams.offer, function(){
      setTimeout(()=>{
        $scope.offer_in_progress = false;
        loadOffer();
      }, REPORT_GENERATION_TIMEOUT);
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error, $rootScope.user.email, 'offer_v2', 'error', ()=>{}, ()=>{});
    });
  };

  /* Get Products for Offers Insurance Type */
  $scope.getProductsForThisInsuranceType = function(){
    metaService.getProductsWithInsuranceType($scope.offer.subject, products => {
      $scope.products = products;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultErrorMsg(error.code);
    });
  };

  /* Revoke Offer */
  $scope.RevokeOffer = function(){
    $rootScope.local_load = true;
    offerService.revokeOffer($stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Mark as Requested');
      backofficeService.logpost({msg:'Offer revoked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      loadOffer();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Lock */
  $scope.Lock = function(){
    $rootScope.local_load = true;
    offerService.lockToAdvisor($rootScope.user.email, $stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('You have been marked as Advisor');
      backofficeService.logpost({msg:'Offer Locked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      $rootScope.local_load = null;
      loadOffer();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  /* Unlock */
  $scope.Unlock = function(){
    $rootScope.local_load = true;
    offerService.unlockForAdvisor($stateParams.offer, function(){
      $rootScope.genService.showDefaultSuccessMsg('Unlocked');
      backofficeService.logpost({msg:'Offer unlocked',offer:$stateParams.offer},$rootScope.user.email,'offer_v2','info',()=>{},()=>{});
      $rootScope.local_load = null;
      loadOffer();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{});
    });
  };

  $scope.requestDeleteComparison = function(comparison_key) {
    $scope.delete_comparison = {
      key: comparison_key,
      comparison: $scope.offer.comparisons[comparison_key]
    };
    FoundationApi.publish('comparison-deletion-modal', 'show');
  };

  $scope.requestDeleteInsuranceType = function(insurance_type_key, comparison_key) {
    $scope.delete_insurance_type = {
      key: insurance_type_key,
      insurance_type: $scope.insurance_types[insurance_type_key]
    };
    if (comparison_key) {
      $scope.delete_insurance_type['comparison_key'] = comparison_key;
      $scope.delete_insurance_type['comparison'] = $scope.offer.comparisons[comparison_key];
    }
    FoundationApi.publish('insurance-type-deletion-modal', 'show');
  };

  $scope.requestPurgeCriterion = function(insurance_type_key, criteria_key) {
    $scope.delete_criterion = {
      key: criteria_key,
      insurance_type_key: insurance_type_key,
      insurance_type: $scope.insurance_types[insurance_type_key]
    };
    FoundationApi.publish('criterion-deletion-modal', 'show');
  };

  metaService.getInsuranceTypes(function (insurance_types) {
    $scope.insurance_types = insurance_types;
  });
  metaService.getCarriers(function (carriers) {
    $scope.carriers = carriers;
  });
  metaService.getAllComparisonCriteria(function (comparisons) {
    $scope.comparisons = comparisons;
  });

  /* Get Documents */
  $scope.GetDocuments = function(){
    $scope.documents_viewable = false;
    if(!$scope.offer) {
      return
    }
    if($scope.files_uploaded){
      $scope.files_uploaded = {};
    }
    const comparison_documents = $scope.offer.comparisons[$scope.selected_comparison].documents;
    for (let key in comparison_documents){
      if (comparison_documents.hasOwnProperty(key)) {
        let doc = comparison_documents[key];
        documentService.getDocument(doc.route, doc.key, document => {
          $scope.files_uploaded[doc.key] = null;
          $scope.files_uploaded[doc.key] = document;
          $scope.documents_viewable = true;
          $scope.safeApply(fn => fn);
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error, $rootScope.user.email, 'offer_v2', 'error', () => {
          }, () => {
          })
        });
      }
    }
  };

  /* Finalize Offer */
  $scope.FinalizeOffer = function(chosen_comparison){
    $scope.offer.comparisons[chosen_comparison].display_version = 2;
    offerService.finalizeOffer($scope.offer.company, $scope.offer.comparisons[chosen_comparison], $stateParams.offer, $scope.offer.subject, result => {
      $rootScope.genService.showDefaultSuccessMsg('New Extraction Created from Offer');
      $state.go('extractionpreview',{policy: result.policy_uid});
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer_v2','error',()=>{},()=>{})
      console.error(error);
    })
  };

  /* Length Of Object */
  $scope.LengthOfObject = function(object){
    if(!object){
      return '0';
    }
    let length = Object.keys(object).length;
    return length || '0';
  };

  $scope.SelectComparison = function(key){
    $scope.selected_comparison = key;
    $scope.GetDocuments();
  };

  /* Check Model */
  // Returns true for a Disabled Button and False for an Enabled
  $scope.CheckModel = function(){
    $scope.isModelValid = true;
    for (var key in $scope.offer.comparisons){
      const comparison = $scope.offer.comparisons[key];
      const is_basic_valid = Boolean(comparison.basic.carrier && comparison.basic.start_date && comparison.basic.premium != null && comparison.basic.insurance_tax != null);
      if(!is_basic_valid){
        $scope.isModelValid = false;
        break;
      }
      for (var type_key in comparison.insurance_types){
        const general = comparison.insurance_types[type_key].general;
        if (!general) {
            $scope.isModelValid = false;
            break;
        }
        const is_general_valid = Boolean(
                (general.sum_insured != null || general.unlimited_sum_insured) &&
                 general.maximisation != null &&
                (general.deductible_is_percent ? general.deductible_percent != null : general.deductible_absolute != null)
        );
        if (!is_general_valid){
            $scope.isModelValid = false;
            break;
        }

        for (let criteria_key in comparison.insurance_types[type_key].specific) {
            const criteria = comparison.insurance_types[type_key].specific[criteria_key];
            const is_criteria_valid = criteria.included === false || (criteria.included && criteria.sublimit != null);
            if (!is_criteria_valid){
                $scope.isModelValid = false;
                break;
            }

        }

      }
    }
  };
  loadOffer();

}

// Angular Module
angular.module('application').controller('CreateCompanyController', CreateCompanyController);

// Injections
CreateCompanyController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','requestService', 'companyService'];

// Function
function CreateCompanyController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,requestService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    let userid = $stateParams.userid;
    let userrequestid = $stateParams.userrequestid;

    let compId;
    let addressId;
    let userRequestObj = {};
    let existingUser = false;
    let userObj = {};
    $scope.company = {}
    $scope.address = {}
    $scope.new_user = {};

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

    $scope.saveCompany = function(user_form, company_form){
      if($rootScope.local_load || $scope.preexisting) {return}
      console.log('Saving Company..');
      $rootScope.local_load = true;
        if(!user_form.$valid || !company_form.$valid || $scope.preexisting) {return}
        userrequestService.updateUserAndCompany(userrequestid, userid, $scope.new_user, $scope.company, $scope.address, (data, company_uid, address_uid) =>{
          $rootScope.genService.showDefaultSuccessMsg('User and Company Added');
          $scope.company_uid = company_uid;
          $scope.address_uid = address_uid;
          $scope.selectIndustry(true);
          $rootScope.local_load = null;
        }, error => {
          console.error(error);
          $rootScope.local_load = null;
        }, compId, addressId);
    }

    $scope.selectIndustry = function(overwrite){
        if(!$scope.preexisting && !overwrite) {return}
        compId = compId || $scope.company_uid;
        if(!compId){
          $rootScope.genService.showDefaultErrorMsg('Could not find company id');
          return;
        }
        console.log('Going to Industry Selector..');
        $state.go("selectindustry",{"company_id" : compId});
    }

    function getUserObj(){
      $rootScope.local_load = true;
      userrequestService.getUserObj(userid,data=>{
          /* user already exists get also the company information */
          $rootScope.local_load = null;
          if(data){
              getCompanyObj(data);
              $scope.new_user = data;
          }
          else{
              userrequestService.getUserRequest(userrequestid,data =>{
                  $scope.user_request = data;
                  $scope.new_user.email = data.email;
                  $scope.safeApply(fn => fn);
              }, err=>err);
          }
      },error=>{
          Console.log("error",error);
          $rootScope.local_load = null;
      });
    }

    function getCompanyObj(){
        let company ={};
        $rootScope.local_load = true;
        userrequestService.getCompanyFromUserid(userid, (companyData, companyKey, addressData, addressKey ) => {
            $scope.company = companyData;
            $scope.address = addressData;
            compId = companyKey;
            addressId = addressKey;
            $rootScope.local_load = null;
            if(companyData && companyData.liimex_id){
              $scope.preexisting = true;
            }
            $scope.safeApply(fn => fn);
        }, error => {
          console.error(error)
          $rootScope.genService.showDefaultErrorMsg('Something went wrong');
          $rootScope.local_load = null;
          $scope.safeApply(fn => fn);
        });
    }

    getUserObj();
}

// Angular Module
angular.module('application').controller('CreateUserController', CreateUserController);

// Injections
CreateUserController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService'];

// Function
function CreateUserController($rootScope, $scope, $stateParams, $state, $controller, userrequestService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.user = {};
		let userrequestid = "";
		let userid = "";

	  /* save User in Auth */
	  $scope.saveUser = function(){
  		$rootScope.local_load = true;
      // if($scope.user.email.includes('liimex')){
      //   $rootScope.genService.showDefaultErrorMsg("Please don't create @liimex emails this way!");
      //   return;
      // }

  		userrequestService.saveUserRequest({
        email : $scope.user.email
      }, (uid, requestid) => {
  			userid = uid;
  			userrequestid = requestid;
        $scope.openCompany();
  			$rootScope.local_load = null;
  			$rootScope.genService.showDefaultSuccessMsg("User successfully fetched / created");
  		},(user_request)=>{
  			$rootScope.local_load = null;
        if(user_request){
          $rootScope.genService.showDefaultErrorMsg(user_request.error_message);
        }
  		});
		}

	  /* Goto Company Page*/
	  $scope.openCompany = function(){
			$state.go('createcompany',{"userid":userid,"userrequestid": userrequestid});
	  }
}

// Angular Module
angular.module('application').controller('DashboardController', DashboardController);

// Injections
DashboardController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'authService', 'userService', 'FoundationApi', 'companyService', 'APIService'];

// Function
function DashboardController($rootScope, $scope, $stateParams, $state, $controller, authService, userService, FoundationApi, companyService, APIService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  	/* Signout */
  	$scope.Signout = function(){
      authService.logout(function(){
        $rootScope.genService.showDefaultSuccessMsg('You have successfully logged out');
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Could not log you out');
      });
    }

    // Performing Requests to update models

}

// Angular Module
angular.module('application').controller('ExtractionViewController', ExtractionViewController);

// Injections
ExtractionViewController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService', 'Upload', 'metaService', 'backofficeService', 'documentService','extractionService','$window', '$sce'];

// Function
function ExtractionViewController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, Upload, metaService, backofficeService, documentService, extractionService, $window, $sce) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  // Scope Models
  $scope.company = {};
  $scope.types = {};
  $scope.insurance_types = [];
  $scope.file_limit = 5;
  $scope.carriers = [];
  $scope.deductibleType = "number";
  $scope.files_to_upload = {};
  $scope.files_uploaded = {};
  $scope.company_uid = $stateParams.company;
  $scope.selectedInsuranceType = $stateParams.insurance_uid;
  $scope.specificCriterias = {};
  $scope.options = extractionService.get_options();
  $scope.isCriteriasFormValid = true;
  $scope.isSpecificCriteriasEmpty = false;
  const policyId = $stateParams.policy;
  $scope.maximisation_limit = 15;

  $scope.applicabilityOptions =[
    {text:'Included', value: true},
    {text:'Not Included', value: false},
  ];

  var previousSubject;
  $scope.specificCriteriasWithIndustryCodes=[];

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

  /* Get Single Policy Information */
  $scope.GetSinglePolicyInformation = function(){
    $rootScope.local_load = true;
    console.log('Getting information for policy:', $stateParams.policy);
    var company_uid = $stateParams.company;
    if(!company_uid){
      company_uid = $scope.policy.company;
    }
    policyService.getSinglePolicy($stateParams.policy, function(policy){
      $scope.policy = policy;
      getdeductibleType();
      companyService.getCompanyInformation(company_uid, function(company){
        $scope.company = company;
        $scope.GetPolicySpecificCriteria();
        $scope.GetIndustrySpecificCriteria();
        $scope.GetCodesForCompany();
        $rootScope.local_load = null;
        $scope.GetDocuments();
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{});
      });
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{});
    });
  }

  /* Get Extraction Help */
  $scope.GetExtractionHelp = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Specific Criteria */
  $scope.GetSpecificCriteria = function(insurance_uid){
    extractionService.getSpecificCriteriaForIndustryCodes(insurance_uid, $scope.company.industry_codes, criteria =>{
      $scope.specific_preview_criteria = {};
      criteria.specificCriterias.forEach(key => {$scope.specific_preview_criteria[key] = true})
      loadExtrationsPreview();
      $scope.num_specific_preview_criteria = Object.keys($scope.specific_preview_criteria).length
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Company Information */
  $scope.GetCompanyInformation = function(){
    companyService.getCompanyInformation($scope.policy.company, company => {
      $scope.company = company
      $scope.GetSpecificCriteria($scope.policy.subject);
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Carriers */
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    $scope.carriers = [];
    metaService.getCarriers(function(carriers){
      for(var key in carriers){
        $scope.carriers.push({key:key, carrier:carriers[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Get Custom Fields */
  $scope.GetCustomFields = function(type){
    $scope.customFields = type.fields;
    custom_fields = [];
    for(var key in type.fields){
      custom_fields.push(type.fields[key].variable_name);
    }
    console.log('custom fields==> ',custom_fields);
  }

  /* Download Policy */
  $scope.DownloadPolicy = function(policy, old){
    if(!policy) {return}
    const from = (old ? "policies" : "documents") + "/" + $scope.policy.company + "/" + policy.file;
    const rename_to = policy.alias ? (policy.alias + '.pdf') : policy.file;
    fileService.downloadWithName(from, rename_to);
  };

  /* File Changed */
  $scope.FileChanged = function(file){
    if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
      return;
    }
    $scope.files_to_upload[file.name] = file;
    $scope.PerformUpload(file)
  };

  /* Remove From Uploads */
  $scope.RemoveFromUploads = function(key, files){
    if(!$scope.files_to_upload[key]){
      return;
    }
    delete $scope.files_to_upload[key];
    if(Object.keys($scope.files_to_upload).length === 0){
      // Nothing Yet
    }
    $scope.safeApply(fn => fn);
  }

  /* Perform upload */
  $scope.PerformUpload = function(file){
    if(!file){return}
    $rootScope.local_load = true;
    $scope.disableUploadBtn= true;
    var company_uid = $stateParams.company;
    if(!company_uid){
      company_uid = $scope.policy.company;
    }
    documentService.uploadPolicies(file, company_uid, file_urls => {
      documentService.createDocuments(file_urls, company_uid, (newUpdateDocuments, document_list) => {
        policyService.addDocumentToPolicy(newUpdateDocuments, document_list.document, $stateParams.policy, () => {
          $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
          delete $scope.files_to_upload[file.name]
          $rootScope.local_load = null;
          $scope.safeApply(fn => fn);
          $scope.GetSinglePolicyInformation();
        }, error => {
          $scope.disableUploadBtn= false;
          $rootScope.local_load = null;
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.code);
          backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
        });
      });
    }, error => {
      console.error(error);
      $scope.disableUploadBtn= false;
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultErrorMsg(error.code);
      backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
    });
  }

  /* Remove From Policy */
  $scope.RemoveFromPolicy = function(key){
    policyService.removeDocument($stateParams.policy, key, () => {
      delete $scope.files_uploaded[key];
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
    })
  }

  /* Get Documents */
  $scope.GetDocuments = function(){
    $scope.number_of_documents = 0;
    if($scope.policy.file){
      $scope.number_of_documents += 1;
    }

    if(!$scope.policy.documents) {
      return
    }
    if($scope.files_uploaded){
      $scope.files_uploaded = {};
    }

    for(var key in $scope.policy.documents){
      let doc = $scope.policy.documents[key];
      documentService.getDocument(doc.route, doc.key, document => {
        $scope.files_uploaded[doc.key] = null;
        $scope.files_uploaded[doc.key] = document;
        $scope.number_of_documents++;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email, 'extraction', 'error',()=>{},()=>{})
      });
    }
  }

  /* Length Of Object */
  $scope.LengthOfObject = function(object){
    if(!object){
      return '0';
    }
    let length = Object.keys(object).length;
    return length.toString() || '0';
  }

  /* Edit Alias */
  $scope.EditAlias = function(key){
    $scope.selected_document = $scope.files_uploaded[key];
    $scope.selected_document_key = key;
    $scope.GetSinglePolicyInformation();
  }

  /* Delete Policy */
  $scope.DeletePolicy = function(){
    $scope.ConfirmAction = null;
    policyService.deletePolicy($stateParams.policy, function(){
      backofficeService.logpost({msg:'policy removed',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Marked as Deleted');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Pending */
  $scope.MakePending = function(){
    $scope.ConfirmAction = null;
    policyService.makePending($stateParams.policy, function(){
      backofficeService.logpost({msg:'extraction Marked as pending',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Marked as Pending');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Lock to Employee */
  $scope.LockToEmployee = function(){
    $rootScope.local_load = true;
    $scope.ConfirmAction = null;
    policyService.lockToExtractor($rootScope.user.email, $stateParams.policy, function(){
      //logme
      backofficeService.logpost({msg:'extraction locked',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('You have been marked as Extractor');
      $rootScope.local_load = null;
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Unlock */
  $scope.Unlock = function(){
    $rootScope.local_load = true;
    $scope.ConfirmAction = null;
    policyService.unlockForExtractors($stateParams.policy, function(){
      backofficeService.logpost({msg:'extraction unlocked',policy:$stateParams.policy},$rootScope.user.email,'extraction','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Extraction is now open for others');
      $rootScope.local_load = null;
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Policy Specific Criteria */
  $scope.GetPolicySpecificCriteria = function(){
    if(!$scope.policy || !$scope.policy.subject) return;
    metaService.getPolicySpecificCriteriaFromSubjectTrigger($scope.policy.subject, function(policy_specific_criteria){
      $scope.custom_fields = [];
      for(var key in policy_specific_criteria){
        if(policy_specific_criteria[key].disabled)
          continue;

        for(var field_key in policy_specific_criteria[key].fields){
          $scope.custom_fields.push({key: field_key, field: policy_specific_criteria[key].fields[field_key]});
        }
      }
      $scope.$apply();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Get Industry Specific Criteria */
  $scope.GetIndustrySpecificCriteria = function(){
    $scope.industry_fields = [];
    if(!$scope.policy || !$scope.policy.subject) return;
    metaService.getIndustrySpecificCriteriaFromPolicyTrigger($scope.policy.subject, function(industry_criteria){
      var included_criteria = [];
      for(var key in industry_criteria){
        triggers = industry_criteria[key].industry_trigger;
        criteria_loop:
        for(var trigger in triggers){
          for(var code in $scope.company.industry_codes){
            var should_include = $scope.company.industry_codes[code].includes(triggers[trigger]);
            if(should_include === true){
              if(industry_criteria[key].disabled)
                continue;

              included_criteria.push(industry_criteria[key]);

              console.log('Criteria triggered for industry code',triggers[trigger],'and business code',$scope.company.industry_codes[code]);
              break criteria_loop;
            }
          }
        }
      }
      for(in_key in included_criteria){
        var fields = included_criteria[in_key].fields;
        for(var field_key in fields){
          $scope.industry_fields.push({key : field_key, field : fields[field_key]});
        }
      }
      $scope.$apply();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Active */
  $scope.MakeActive = function(){
    $scope.ConfirmAction = null;
    let display_version = $state.current.name == 'extractionpreview' ? 2 : null
    policyService.activatePolicy($stateParams.policy, display_version, function(){
      $rootScope.genService.showDefaultSuccessMsg('Activated');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Make Active No Email */
  $scope.MakeActiveNoEmail = function(){
    $scope.ConfirmAction = null;
    let display_version = $state.current.name == 'extractionpreview' ? 2 : null    
    policyService.activatePolicyNoEmail($stateParams.policy, display_version, function(){
      $rootScope.genService.showDefaultSuccessMsg('Activated');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Save Unfinished Extraction */
  $scope.SaveUnfinishedExtraction = function(){

    // Nullify undefined
    for(var key in $scope.policy.custom_fields){
      if($scope.policy.custom_fields[key]===null || $scope.policy.custom_fields[key]===undefined){
        $scope.policy.custom_fields[key] = null;
      }
    }
    //check if deductible is entered in % or number
    setdeductibleType();
    policyService.savePolicy($stateParams.policy, $scope.policy, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Save Document */
  $scope.SaveDocument = function(selected_document) {
    let route = $scope.policy.documents[$scope.selected_document_key].route
    let key = $scope.policy.documents[$scope.selected_document_key].key
    documentService.saveDocument(route, key, selected_document, () => {
      $scope.GetDocuments();
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      document.getElementById('close_alias').click();
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'could not update document','error',()=>{},()=>{})
    })
  }

  /*set deductible type before saving*/
  setdeductibleType = function(){
    if($scope.policy && $scope.policy.deductible){
      if($scope.deductibleType == "percent"){
        //append % if the radio is selected for percent.
        $scope.policy.deductible += "%";
      }
    }
  }

  /*get the deductible type based on the suffix added (% for percent)*/
  getdeductibleType = function(){
    if ($scope.policy && $scope.policy.deductible){
      var suffix = $scope.policy.deductible.toString().slice(-1);
      if (suffix == "%"){
        //trim the % suffix and set the radio button
        $scope.policy.deductible = $scope.policy.deductible.slice(0, -1);
        $scope.deductibleType = "percent";
      }
    }
  }

  /* Get Codes For Company */
  $scope.GetCodesForCompany = function(){
    $rootScope.local_load = true;
    if(!$scope.company || !$scope.company.industry_codes) { return };
    let codes_to_get = [];
    for(var code in $scope.company.industry_codes){
      let combined = "", temp_code = $scope.company.industry_codes[code].split('.');
      for(var place in temp_code){
        combined = combined === "" ? combined.concat(temp_code[place]) : combined.concat('.',temp_code[place])
        codes_to_get.push(combined);
      }
    }
    $scope.codes_to_show = [];
    for(var index in codes_to_get){
      let search_code = !codes_to_get[index].includes('.')  ? Number(codes_to_get[index]) : codes_to_get[index]
      metaService.getCodeDataFromCode(search_code, function(code){
        $rootScope.local_load = null;
        if(!code) {return}
        $scope.codes_to_show.push(code[Object.keys(code)[0]]);
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'code','error',()=>{},()=>{})
      });
    }
  }


  /* edit the basic information */
  $scope.editBasicInfo = function(){
    $scope.gotoExtractionBasic();
  }

  /* saves the basic information for the extractions */
  $scope.SaveBasicInformation = function(){
    if(previousSubject != undefined && previousSubject != $scope.policy.subject){
      if($scope.policy.insurance_types &&  $scope.policy.insurance_types[previousSubject]){
        delete $scope.policy.insurance_types[previousSubject];
      }
    }
    policyService.savePolicy(policyId, $scope.policy, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.go('extractionpreview', {policy:$stateParams.policy});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* redirect to the extractions preview */
  $scope.gotoExtractionPreview = function(){
    $state.go("extractionpreview",{"policy":policyId});
  }

  $scope.gotoExtractionBasic = function(){
    $state.go("extractionbasic",{"policy":policyId});
  }

  $scope.gotoGeneralComparisonCriteria = function(insurance_type){
    $state.go("extractiongereralcriteria",{"policy":policyId})
  }

  $scope.gotoSpecificComparisonCriteria = function(insuranceId){
    $state.go("extractionspecificcriteria",{"policy":policyId,"insurance_uid":insuranceId})
  }

  $scope.gotoChooseAdditionalModule = function(){
    $state.go("extractionchooseadditionalmodule",{policy:policyId});
  }

  $scope.deleteAdditionalModule = function(insuranceType){
    policyService.deleteAdditionalModule(policyId,insuranceType,()=>{
      $rootScope.genService.showDefaultSuccessMsg('Additional Module deleted successfully');
      $state.reload();
    },error=>{
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  function getSpecificCriteria (insuranceId){
    $rootScope.local_load = true;
    companyService.getCompanyInformation($scope.policy.company,company=>{
      $scope.company = company;
      extractionService.getSpecificCriteriaForIndustryCodes(insuranceId,$scope.company.industry_codes,(data)=>{
        $rootScope.local_load = null;
        let specificCriterias = data.specificCriterias;
        $scope.specificCriteriasWithIndustryCodes = data.specificCriteriasWithIndustryCodes;
        if(!specificCriterias || specificCriterias.length ==0)
          $scope.isSpecificCriteriasEmpty = true;

        specificCriterias.forEach(criteriaId=>{
          $scope.specificCriterias[criteriaId] = getExisitingCriteria(insuranceId,criteriaId);
        });
        converNativeTypesToStrings($scope.specificCriterias);
        $scope.safeApply(fn => fn);
      });
    });
  }

  function getExisitingCriteria(insuranceId,criteriaId){
    let specificCriteriaData = {};
    if($scope.policy.insurance_types && $scope.policy.insurance_types[insuranceId] && $scope.policy.insurance_types[insuranceId].specific  && $scope.policy.insurance_types[insuranceId].specific[criteriaId]){
      specificCriteriaData = $scope.policy.insurance_types[insuranceId].specific[criteriaId]
    }
    return specificCriteriaData
  }

  $scope.getCriteriaName = function(criteriaId){
    return extractionService.getCriteriaName(criteriaId)
  }

  $scope.isIndustrySpecifComparisonCriteria = function(criteriaId){
    if($scope.specificCriteriasWithIndustryCodes){
      if($scope.specificCriteriasWithIndustryCodes.indexOf(criteriaId) > -1){
        return true;
      }
    }
    return false;
  }

  function converSelectOptionsToNativeTypes(criterias){
    for(let criteriaKey in criterias){
      if(criterias[criteriaKey].included != undefined && criterias[criteriaKey].included == 'true')
        criterias[criteriaKey].included = true;
      else
        criterias[criteriaKey].included = false;
    }
  }

  function converNativeTypesToStrings(criterias){
    for(let criteriaKey in criterias){
      if(criterias[criteriaKey].included !== undefined && criterias[criteriaKey].included !== null)
        {
        criterias[criteriaKey].included = criterias[criteriaKey].included.toString();
      }
    }
  }

  $scope.MakeSumInsuredUnlimited = function(insurance_type){
    $scope.policy.insurance_types[insurance_type] = $scope.policy.insurance_types[insurance_type] || { general: {} };
    if($scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured === true){
      $scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured = false;
    } else {
      $scope.policy.insurance_types[insurance_type].general.unlimited_sum_insured = true;
    }
  }

  /* Save the general criteria */
  $scope.SaveGeneralCriteria = function(insurance_type = $scope.policy.subject){
    policyService.saveGeneralCriteria($stateParams.policy, insurance_type, $scope.policy.insurance_types[insurance_type].general, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.go('extractionpreview', {policy:$stateParams.policy});
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  $scope.goBack = function(){
    $window.history.back();
  }


  /* saves the additional modules specific criteria added */
  $scope.saveSpecifCriteriaForInsuranceType = function(insuranceId){
    converSelectOptionsToNativeTypes($scope.specificCriterias);
    policyService.saveSpecificCriteria(policyId,insuranceId,$scope.specificCriterias,()=> {
      converNativeTypesToStrings($scope.specificCriterias);
      $scope.SaveGeneralCriteria(insuranceId);
    }, error=>{
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'extraction','error',()=>{},()=>{})
    });
  }

  /* Update Annual Premium */
  $scope.UpdateAnnualPremium = function(){
    if(!$scope.policy.basic || !$scope.policy.basic) { return }
    $scope.annual_gross_premium = $scope.policy.basic.premium*(($scope.policy.basic.insurance_tax*0.01)+1);
  }

  function loadExtrationsPreview(){
    $scope.extrationsPreview_generalCriteria = {};
    $scope.extrationsPreview_specificCriteria = {};
    $scope.extrationsPreview_additionalModules = {};
    let subject = $scope.policy.subject;

    if($scope.policy.insurance_types){
      if($scope.policy.insurance_types[subject]){
        if($scope.policy.insurance_types[subject].general){
          $scope.extrationsPreview_generalCriteria  = $scope.policy.insurance_types[subject].general;
        }
      }
      /* add all inusrance types except for the 'subject', insurance type to the additional modules list */
      for(let insuranceType in $scope.policy.insurance_types){
        if(insuranceType != subject){
          $scope.extrationsPreview_additionalModules[insuranceType] = $scope.policy.insurance_types[insuranceType].specific;
        }
      }
      $scope.safeApply(fn => fn);
    }
    isBasicInformationValid();
    isGeneralCriteriaValid();
    isSpecificCriteriaValid();
    $scope.GetDocuments();
  }

  /* Nullcheck General Criteria */
  $scope.NullCheckGeneralCriteria = function(){
    for(var key in $scope.options.general_keys){
      $scope.policy.insurance_types = $scope.policy.insurance_types || {};
      $scope.policy.insurance_types[$scope.policy.subject] = $scope.policy.insurance_types[$scope.policy.subject] || {general: {}}
      $scope.policy.insurance_types[$scope.policy.subject].general[key] = $scope.policy.insurance_types[$scope.policy.subject].general[key] || {};
    }
  }


  $scope.getCarrierName = function(carrierKey){
    if(!carrierKey) return;
    let carrierObj = $scope.carriers.find(carrierObj=>carrierObj.key == carrierKey);
    if(carrierObj && carrierObj.carrier && carrierObj.carrier.name)
      return carrierObj.carrier.name;
  }

  $scope.getInsuranceName = function(insuranceKey){
    if(!insuranceKey) return;
    let insuranceObj = $scope.insurance_types.find(insuranceObj=>insuranceObj.key == insuranceKey);
    if(insuranceObj && insuranceObj.insurance_type && insuranceObj.insurance_type.name_de)
      return insuranceObj.insurance_type.name_de;
  }

  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(insurance_type){
    if(!$scope.policy.insurance_types[insurance_type].general.deductible_is_percent){
      $scope.policy.insurance_types[insurance_type].general.deductible_is_percent = true
    } else {
      $scope.policy.insurance_types[insurance_type].general.deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }

   /* Make deductible Max Percent */
   $scope.MakedeductibleMaxPercent = function(insurance_type){
    if(!$scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent){
      $scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent = true
    } else {
      $scope.policy.insurance_types[insurance_type].general.deductible_max_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }

  /* Make deductible Percent */
  $scope.MakeSpecificdeductiblePercent = function(criteriaObject){
    if(!criteriaObject.deductible_is_percent){
      criteriaObject.deductible_is_percent = true;
    } else {
      criteriaObject.deductible_is_percent = false;
    }
    $scope.safeApply(fn => fn);
  }

  $scope.isInsuranceIncluded = function(insuranceKey){
    if(insuranceKey == $scope.policy.subject){
      return true;
    }
    for(let insuranceId in $scope.policy.insurance_types){
      if(insuranceKey == insuranceId){
        return true;
      }
    }
    return false;
  }
  /* returns true if atleast one of the general criterias is included else it returns false */
  function isGeneralCriteriaValid(){
    if(!$scope.policy.insurance_types || !$scope.policy.insurance_types[$scope.policy.subject] || !$scope.policy.insurance_types[$scope.policy.subject].general){
      $scope.isGeneralCriteriaValid = false;
    }
    else if(!$scope.policy.insurance_types[$scope.policy.subject].general.sum_insured || !$scope.policy.insurance_types[$scope.policy.subject].general.maximisation){
      $scope.isGeneralCriteriaValid = false;
    } else {
      $scope.isGeneralCriteriaValid = true;
    }
  }

  /**
   * Is Extraction Valid
   * This is the ONLY Model Validation function avtively
   * used in ExtractionPreview.html
   */
  $scope.isExtractionValid = function(){
    if($scope.policy.basic && $scope.policy.insurance_types){
      if(!($scope.policy.basic.carrier && $scope.policy.basic.policy_number && $scope.policy.basic.start_date && $scope.policy.basic.notice_period && $scope.policy.basic.main_renewal_date && $scope.policy.basic.prolongation && $scope.policy.basic.premium && $scope.policy.basic.insurance_tax)){
        return false;
      }
      for(let type in $scope.policy.insurance_types){
        if(!$scope.policy.insurance_types[type].general){
          return false;
        }
        if($scope.specific_preview_criteria){
          for(let criteria in $scope.specific_preview_criteria){
            if($scope.policy.insurance_types[type].specific){
              if(!$scope.policy.insurance_types[type].specific[criteria]){
                return false;
              }
            } else {
              return false;
            }
          }
        } 
      }
      return true;
    }
   return false;
  }

  function isSpecificCriteriaValid(){
    $scope.isSpecificCriteriaValid = false;
    if($scope.specific_preview_criteria && Object.keys($scope.specific_preview_criteria).length >0){
      for(let specific_id in $scope.specific_preview_criteria){
        if($scope.policy.insurance_types 
          && $scope.policy.insurance_types[$scope.policy.subject] 
          && $scope.policy.insurance_types[$scope.policy.subject].specific 
          && $scope.policy.insurance_types[$scope.policy.subject].specific[specific_id]){
          $scope.isSpecificCriteriaValid = true;
        }
        else{
          $scope.isSpecificCriteriaValid = false;
          break;
        }
      }
    }
    else{
      /* if there are no specific criteria in the policy */
      $scope.isSpecificCriteriaValid = true;
    }
  }

  /* isBasicInformationValid is set to true if all the basic information is entered else it's set to false */
  function isBasicInformationValid(){
    $scope.isBasicInformationValid = false;
    if($scope.policy.basic){
      let basicInfo = $scope.policy.basic;
      if(basicInfo.carrier && basicInfo.policy_number && basicInfo.start_date && basicInfo.notice_period && basicInfo.main_renewal_date && basicInfo.prolongation && basicInfo.premium && basicInfo.insurance_tax){
        $scope.isBasicInformationValid = true;
      }
    }
  }

  function processStateParamsAndViews(){
    /* TODO: conver below if conditiona to switch-case  */
    if($state.current.name == 'extractionspecificcriteria' && $stateParams.insurance_uid){
      getSpecificCriteria($stateParams.insurance_uid)
    }
    if($state.current.name == 'extractionpreview'){
      $scope.GetCompanyInformation();
      $scope.GetCarriers();
    }
    if($state.current.name == 'extractionbasic'){
      previousSubject = $scope.policy.subject;
      $scope.GetCarriers();
    }
    if($state.current.name == 'extractiongereralcriteria'){
      let subject = $scope.policy.subject;
      if($scope.policy && $scope.policy.insurance_types && $scope.policy.insurance_types[subject] && $scope.policy.insurance_types[subject].general){
        $scope.gereralCritteria = $scope.policy.insurance_types[subject].general;
        converNativeTypesToStrings($scope.gereralCritteria);
        $scope.safeApply(fn => fn);
      }

    }
  }

  /* self executing function for every controller load,
  do all sorts of initialization for the controller here.
  */
  (()=>{ policyService.getSinglePolicy($stateParams.policy,policy=>{
    $scope.policy = policy;
    $scope.UpdateAnnualPremium();
    if( $scope.policy && ($state.current.name == 'extractionpreview' || $state.current.name == 'extractionspecificcriteria')){
      processStateParamsAndViews();
    }
    /* previous version of initializing the controller */
    else{
      /* Call On Controller Load */
      $scope.GetSinglePolicyInformation();
      $scope.GetCarriers();
    }
  });
})()

/* Change Display Version */
$scope.ChangeDisplayVersion = function(version){
  // policyService.changeDisplayVersion($scope.policy, $stateParams.policy, () => {
  //   $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
    $state.go("extractionpreview",{"policy": $stateParams.policy});
  // }, error => {
  //   console.error(error);
  //   $rootScope.local_load = null;
  //   $rootScope.genService.showDefaultErrorMsg(error.code);
  // });
}

/* Transform into Html */
$scope.transformToHtml = function(html){
  return $sce.trustAsHtml(html);
}

/* On Controller Load */
$scope.GetExtractionHelp();
$scope.GetCarriers();

}

// Angular Module
angular.module('application').controller('ExtractionsController', ExtractionsController);

// Injections
ExtractionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'policyService', 'companyService', 'fileService', 'mandateService'];

// Function
function ExtractionsController($rootScope, $scope, $stateParams, $state, $controller, policyService, companyService, fileService, mandateService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.policies = [];
    $scope.companies = {};

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

    /* Get All Extractions */
    $scope.GetAllPolicies = function(){
      $scope.policies = [];
      $scope.companies = {};
      $rootScope.local_load = true;
      mandateService.getAllMandates(function(mandates){
        companyService.getAllCompanies(function(all_companies){
          policyService.getPoliciesWithFilter('status', 'pending', function(policies){
            $scope.companies = all_companies;
            for(var key in policies){
              if(!all_companies[policies[key].company]){
                continue;
              }
              if(all_companies[policies[key].company].policies && all_companies[policies[key].company].policies[key] !== true){
                continue
              }
              $scope.policies.push({key : key, policy : policies[key], owner: policies[key].company, owner_name:all_companies[policies[key].company].name});
            }
            $rootScope.local_load = null;
            $scope.safeApply(fn => fn);
          }, function(error){
            $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
            console.log(error.message);
          });
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
          console.log(error.message);
        });
      },function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Get Single Policy Information */
    $scope.GetSinglePolicyInformation = function(){
      console.log('Getting information for policy:',$scope.selected_policy_key);
      policyService.getSinglePolicy($scope.selected_company, $scope.selected_policy_key, function(policy){
        $scope.selected_policy = policy;
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Single Company Information */
    $scope.GetSingleCompanyInformation = function(company){
      console.log("Company:",company);
      $scope.company = company;
    }

    /* Download Policy */
  	$scope.DownloadPolicy = function(policy){
  		console.info('Downloading Policy: ',policy);
  		fileService.downloadSinglePolicy(policy.file, function(url_for_download){
  			var a = document.createElement('a');
        		a.href = url_for_download;
        		a.download = 'document_name';
        		a.target = '_self';
        		a.click();
  		}).catch(function(error){
  			// Do Something with the error
  		});
  	}

    /* Init Extract */
    $scope.InitExtract = function(){
      $scope.extracting = true;
    }

    /* open the selected extraction */
    $scope.openExtraction = function(policyObj){
      /* if the policy version is 2 , then redirect to the extraction preview page */
      if(policyObj.policy.display_version && policyObj.policy.display_version == 2){
        $state.go("extractionpreview",{"policy": policyObj.key});
      }
      else{
        $state.go("extraction",{"policy":policyObj.key, "company":policyObj.owner});
      }
    }

    /* Go Back */
    $scope.GoBack = function(){
      $scope.selected_policy = null;
      $scope.selected_policy_key = null;
      $scope.selected_company = null;
      $scope.extracting = null;

    }

    /* Call On Controller Load */
    $scope.GetAllPolicies();
}

// Angular Module
angular.module('application').controller('FinfoController', FinfoController);

// Injections
FinfoController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'finfoService', 'FoundationApi'];

// Function
function FinfoController($rootScope, $scope, $stateParams, $state, $controller, firebase, finfoService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
    $scope.info_blocks = {}
    $scope.just_updated = false;
    $scope.selected_info_block;

    /* Get My Required Information */
    $scope.GetMyRequiredInformation = function(forms){
        console.info('Getting Company Info');
        var filled = [];
        var not_filled = [];
        finfoService.getCompanyInfoBlocks(function(blocks){
            block_loop: // Loop is ID'd for contunie purposes
            for(var block_key in blocks){
                var tmp_block = blocks[block_key];
                var data_points = tmp_block.data;
                tmp_parent = {block:tmp_block, name: block_key};
                for(var key in data_points){
                    if(!data_points[key].value){
                        tmp_parent.status = 'not_filled';
                        not_filled.push(tmp_parent);
                        continue block_loop;
                        break;
                    }
                }
                tmp_parent.status = 'filled';
                filled.push(tmp_parent);
            }
            $scope.info_blocks.filled = filled;
            $scope.info_blocks.not_filled = not_filled;
            try{
              $scope.$apply();
            } catch(e){

            }
        },function(){

        });
    }

    /* Select Info Block */
    $scope.SelectInfoBlock = function(parent){
        $scope.selected_info_block = parent;
        $scope.just_updated = false;
    }

    /* Call these functions on controller load */
    $scope.GetMyRequiredInformation();

    /******************************/
    /**     Modal Functions      **/
    /******************************/

    /* Save information */
    $scope.SaveInformation = function(parent, form){
        if(!form.$valid){ return; }
        finfoService.updateInformationForCompany(parent.name, parent.block, function(){
            $scope.GetMyRequiredInformation();
            $scope.just_updated = true;
            document.getElementById('close_info').click();
            $rootScope.genService.showDefaultSuccessMsg('Information Updated');
        });
    }

}

// Angular Module
angular.module('application').controller('GetOffersController', GetOffersController);

// Injections
GetOffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','companyService','recommendationService','genService'];

// Function
function GetOffersController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService,companyService,recommendationService, genService ) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    var companyid = $stateParams.companyid;
    var weighted_recommendedInsurance = {};

    $scope.weighted_insurance_types = {};
    $scope.weighted_insurance_types.essential = [];
    $scope.weighted_insurance_types.additional = [];
    $scope.weighted_insurance_types.others = [];
    $scope.insurance_types = {};

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
        $scope.company = company;
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'getoffer','error',()=>{},()=>{})
      });
    }

    /* set weights for recommended insurances */
    function setWeightsForRecommendedInsurance(){
      weighted_recommendedInsurance.essential = [];
      weighted_recommendedInsurance.additional = [];
      let seventyfiveAboveScores =[] , fiftyScores = [], twentyFiveScores=[], fiftyScoreslength = 0, seventyfiveAboveScoresLength =0;
      for(var index in $scope.recommendation){
        let score = $scope.recommendation[index].score;
        switch (score) {
          case 100:
          case 75:
            seventyfiveAboveScores.push(index);
            break;
          case 50:
            fiftyScores.push(index);
            break;
          case 25:
            twentyFiveScores.push(index);
            break;
          default:
            break;
        }
      }
      weighted_recommendedInsurance.essential.push(...seventyfiveAboveScores);
      weighted_recommendedInsurance.additional.push(...twentyFiveScores);

      fiftyScoreslength = fiftyScores.length;
      seventyfiveAboveScoresLength = seventyfiveAboveScores.length;

      if(seventyfiveAboveScoresLength + fiftyScoreslength <= 3)
        weighted_recommendedInsurance.essential.push(...fiftyScores);
      else
        weighted_recommendedInsurance.additional.push(...fiftyScores);
    }

    function getAllInsuranceTypes(){
      $rootScope.local_load = true;
      metaService.getInsuranceTypes(types => {
        $scope.insurance_types = types;
        $scope.weighted_insurance_types.essential = [];
        $scope.weighted_insurance_types.additional = [];
        $scope.weighted_insurance_types.others = [];
        for(var key in types){
          if(!$scope.recommendation[key]){
            continue;
          }
          if(weighted_recommendedInsurance.essential.indexOf(key) !== -1)
            $scope.weighted_insurance_types.essential.push({key:key, type:types[key], score:$scope.recommendation[key].score});
          else if(weighted_recommendedInsurance.additional.indexOf(key) !== -1)
            $scope.weighted_insurance_types.additional.push({key:key, type:types[key], score:$scope.recommendation[key].score});
          else
            $scope.weighted_insurance_types.others.push({key:key, type:types[key], score:$scope.recommendation[key].score});
        }
        $rootScope.local_load = null;
        $scope.safeApply(f => f);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.code);
        $rootScope.local_load = null;
        backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
      });
    }

    /* Get Recommendations */
    function GetRecommendations(){
      $rootScope.local_load = true;
      const index_of_recommended = 0;
      recommendationService.getRecommendationsForCompId(companyid,recommendation => {
        $scope.recommendation = recommendation.recommended;
        setWeightsForRecommendedInsurance();
        getAllInsuranceTypes();
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        backofficeService.logpost(error,$scope.currentUser,'overview','error',()=>{},()=>{});
      })
    }

    $scope.gotoQuestionaire =  function(){
        let selectedinsurances = [];
        for(key in $scope.insurance_types){
          if($scope.insurance_types[key].selected){
            selectedinsurances.push(key);
          }
        }

        if(selectedinsurances.length > 0){
          $state.go('questions',{'selectedinsurances': selectedinsurances,'companyid':companyid });
        }
        else {
          genService.showDefaultErrorMsg("Please select one or more insurance types");
        }
    }

    /* On Controller Load */
    GetRecommendations();
    $scope.GetCompanyInformation();
}

// Angular Module
angular.module('application').controller('IndustryCriteriaController', IndustryCriteriaController);

// Injections
IndustryCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function IndustryCriteriaController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.criteria = null;

    /* Get Single Policy Criteria */
    $scope.GetSingleIndustryCriteria = function(){
      $rootScope.local_load = true;
      metaService.getSingleIndustryCriteria($stateParams.criteria, function(criteria){
        $scope.criteria = criteria;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = [];
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Save Criteria */
    $scope.SaveCriteria = function(){
      $rootScope.local_load = true;
      metaService.saveIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        backofficeService.logpost({msg:'criteria saved',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $scope.codes = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Add Custom Field */
    $scope.AddCustomField = function(){
      console.log('Adding custom field..');
      $rootScope.local_load = true;
      metaService.addInudstryCustomField($stateParams.criteria, function(){
        backofficeService.logpost({msg:'custom field added',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Disable Custom Field */
    $scope.DisableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.disableIndustryCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'Custom field disabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Enable Custom Field */
    $scope.EnableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.enableIndustryCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field enabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Disable Criteria */
    $scope.DisableCriteria = function(){
      metaService.disableIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        backofficeService.logpost({msg:'criteria disabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Enable Criteria */
    $scope.EnableCriteria = function(){
      metaService.enableIndustryCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        backofficeService.logpost({msg:'criteria enabled',criteria:$stateParams.criteria},$rootScope.user.email,'industrycriteria','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* Get All Codes */
    $scope.GetAllCodes = function(){
      $rootScope.local_load = true;
      $scope.codes = [];
      metaService.getIndustryCodes(function(codes){
        for(var key in codes){
          console.log('Push');
          $scope.codes.push({key:key, code:codes[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_criteria','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetSingleIndustryCriteria();
    $scope.GetInsuranceTypes();

}

// Angular Module
angular.module('application').controller('IndustryCriteriasController', IndustryCriteriasController);

// Injections
IndustryCriteriasController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function IndustryCriteriasController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Quit if child state
    if($state.current.name !== 'industrycriterias')
      return;

    $scope.AddBlankCriteria = function(){
      $scope.criteria = [];
      metaService.addIndustryCriteria(function(){
        $rootScope.genService.showDefaultSuccessMsg('Industry Criteria - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Industry Criteria */
    $scope.GetAllIndustryCriteria = function(){
      $rootScope.local_load = true;
      console.log('Getting Industry Criteria..');
      $scope.criterias = [];
      metaService.getIndustryCriteria(function(criterias){
        for(var key in criterias){
          $scope.criterias.push({key:key, criteria:criterias[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllIndustryCriteria();
    $scope.GetInsuranceTypes();

}

// Angular Module
angular.module('application').controller('IndustryDemandController', IndustryDemandController);

// Injections
IndustryDemandController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function IndustryDemandController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Get Insurance Type */
    $scope.GetInsuranceType = function(){
      $rootScope.local_load = true;
      metaService.getSingleInsuranceType($stateParams.insurance_type, function(insurance_type){
        $rootScope.local_load = null;
        $scope.insurance_type = insurance_type;
        if(insurance_type.except){
          $scope.except = insurance_type.except.join();
        }
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_demand','error',()=>{},()=>{})
      });
    }

    /* Save Insurance Type */
    $scope.SaveInsuranceType = function(){
      $rootScope.local_load = true;
      $scope.except ? (
        $scope.insurance_type.except = $scope.except.split(',')
      ) : (
        $scope.insurance_type.except = null
      )
      metaService.saveInsuranceType($stateParams.insurance_type, $scope.insurance_type, function(){
        backofficeService.logpost({msg:'insurance_type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'industrydemand','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'industry_demand','error',()=>{},()=>{})
      });
    }

  	/* Call these functions on controller load */
    $scope.GetInsuranceType();
}

// Angular Module
angular.module('application').controller('IndustryDemandsController', IndustryDemandsController);

// Injections
IndustryDemandsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function IndustryDemandsController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Get All Policy Types */
    $scope.GetAllInsuranceTypes = function(){
      $rootScope.local_load = true;
      console.log('Getting Insurance Type(s)..');
      $scope.insurance_types = [];
      metaService.getInsuranceTypes(function(insurance_types){
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

  	/* Call these functions on controller load */
    $scope.GetAllInsuranceTypes();
}

// Angular Module
angular.module('application').controller('InsuranceQuestionsController', InsuranceQuestionsController);

// Injections
InsuranceQuestionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService', 'insuranceQuestionsService'];

// Function
function InsuranceQuestionsController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService, insuranceQuestionsService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  //TODO: What is this?
  var insuranceQuestionsList = [];


  /* Scope Variables */
  $scope.insurance_type = $stateParams.insuranceType || null;
  $rootScope.insurance_type = $scope.insurance_type;
  $scope.questions = []

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

  /* Get all Insurance Types */
  GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    $scope.insurance_types = [];
    metaService.getInsuranceTypes(function(insurance_types){
      for(var key in insurance_types){
        $scope.insurance_types.push({key:key, type:insurance_types[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
      console.error(error);
    });
  }

  /* Change Insurance Type */
  $scope.ChangeInsuranceType = function(){
    $state.go('insurancequestions',{insuranceType: $scope.insurance_type});
  }

  /* Get and Append Children */
  function GetAndAppendChildren(mainQuestion){
		var children = mainQuestion.insuranceQuestionObj.mappings[$scope.insurance_type].children;
		var childrenArray = [];
		for(childIndex in children){
			var insuranceQuestionObj = {insuranceQuestionObj: children[childIndex],key: childIndex};
			childrenArray.push(insuranceQuestionObj);
		}
		mainQuestion.insuranceQuestionObj.mappings[$scope.insurance_type].children = childrenArray;
	}

  /* Get all Insurance Types */
  GetAllQuestions = function(){
    insuranceQuestionsService.getInsurenceMainQuestionForInsuranceId($scope.insurance_type,(_mainQuestions)=>{
			$scope.mainQuestionList = _mainQuestions;
			for(index in $scope.mainQuestionList){
				$scope.mainQuestionList[index].addAsSubQuestion = false;
				GetAndAppendChildren($scope.mainQuestionList[index]);
			}
			$scope.safeApply(fn => fn);
		},(error)=> console.log("error while fetching main insurance questions",error));
  }

  /* Insurence type is changed on the dropdown */
  $scope.selectInsurenceTypeChange =  function(){
    console.log("inside the selctor change", $scope.insurance_type);
    getInsurenceQuestion(insurenceTypeId);
  }

  /* Redirect to add_new_question_to_insurence */
  $scope.addQuestionToInsurence =function(){
    $state.go('pickinsurancequestion',{insuranceType: $scope.insurance_type, order:Object.keys($scope.question_mapping).length+1});
  }

  /* Get all questions for the insurence type */
  function getInsuranceQuestion(insuranceTypeId){
    insuranceQuestionsService.getInsuranceQuestion(insuranceTypeId);
  }

  /* Redirect to map questions to subquestion page */
  $scope.mapQuestions = function(){
    $state.go('mapinsurancequestions',{insuraneType: $scope.insurance_type});
  }

  /* Get Meta Information */
  GetMetaInformation = function(){
    insuranceQuestionsService.getAllMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.input_types = meta.input_type_enum;
      $scope.meta.question_types = meta.question_type_enum;
      $scope.meta.account_page_status = meta.account_page_status;
      $scope.meta.trigger_conditions = meta.trigger_conditions;
      $scope.meta.boolean_answers = meta.boolean_answers;
    }, error => {
      console.error(error);
    });
  }

  /* Get Single Question */
  GetSingleQuestion = function(question_uid){
    metaService.getSingleInsuranceQuestion(question_uid, question => {
      if(!question.order){
        $scope.order_undefined = false;
      }
      $scope.questions_dict[question_uid] = question;
      $scope.questions.push({key: question_uid, question : question});
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestion','error',()=>{},()=>{})
    });
  }

  /* Get Question Mapping */
  GetQuestionMapping = function(){
    metaService.getQuestionMappingForInsuranceType($stateParams.insuranceType, question_mapping => {
      $scope.question_mapping = question_mapping || {};
      $scope.questions = [];
      $scope.questions_from_map = [];
      $scope.questions_dict = {}
      for(var key in question_mapping){
        $scope.questions_from_map.push({key:key, question:question_mapping[key]});
        GetSingleQuestion(key);
        for(var child_key in question_mapping[key].children){
          GetSingleQuestion(child_key);
        }
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }

  /* Decrement all question Above */
  DecrementAboveQuestions = function(deleted_question_uid)  {
    let ordered_map = {};
    let highest_order = 0;
    for(var key in $scope.question_mapping){
      if(key === deleted_question_uid) { continue }
      ordered_map[$scope.question_mapping[key].order] = {question:$scope.question_mapping[key], key:key}
      highest_order = highest_order < $scope.question_mapping[key].order ? $scope.question_mapping[key].order : highest_order;
    }
    let goal = 1;
    for(var i=1; i<=highest_order;i++){
      let question = ordered_map[i];
      if(question && goal === question.question.order){
        goal++;
        continue;
      } else if(question) {
        question.question.order = goal;
        goal++;
        metaService.editQuestionMapping($scope.insurance_type, question.key, question.question, result => {

        }, error => {
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
          console.error(error.message);
        });
      }
    }
  }

  /* Delete Question From Mapping */
  $scope.DeleteQuestionFromMapping = function(question_uid) {
    let deleted_question = $scope.question_mapping[question_uid]
    metaService.deleteQuestionFromMapping($stateParams.insuranceType, question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      DecrementAboveQuestions(question_uid)
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* Move Up */
  $scope.MoveUp = function(key) {
    let question_up = $scope.question_mapping[key]
    let question_down_index = null;
    if(question_up.order <= 1) { return }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_up.order-1){
        question_down_index = index
        break;
      }
    }
    if(!question_down_index){ return }
    metaService.swapOrderOnQuestionInMapping($scope.insurance_type, key, question_down_index, question_up.order-1, question_up.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }

  /* Move Down */
  $scope.MoveDown = function(key) {
    let question_down = $scope.question_mapping[key]
    let question_up_index = null;
    if(question_down.order >= $scope.questions_from_map.length) { return }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_down.order+1){
        question_up_index = index
        break;
      }
    }
    if(!question_up_index){ return }
    metaService.swapOrderOnQuestionInMapping($scope.insurance_type, key, question_up_index, question_down.order+1, question_down.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }

  /* Auto Order */
  $scope.AutoOrder = function() {
    for(var index in $scope.questions){
      let order = $scope.questions.order || index;
      console.log('question:',$scope.questions[index]);
    };
  }

  /* Make Subquestion of Above */
  $scope.MakeSubQuestionOfAbove = function(key) {
    let question_above_index = null;
    let question_to_subquestion = $scope.question_mapping[key];
    if(question_to_subquestion.order <= 1) {
      return
    }
    for(var index in $scope.question_mapping){
      if($scope.question_mapping[index].order === question_to_subquestion.order-1){
        question_above_index = index
        break;
      }
    }
    if(!question_above_index) {
      return
    }

    if($scope.question_mapping[key].children !== false){
      return;
    }

    if($scope.questions_dict[question_above_index].input_type === 'date') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Date');
      })
      return;
    }

    if($scope.questions_dict[question_above_index].input_type === 'text') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Free Text');
      })
      return;
    }

    metaService.deleteAndMakeSubquestionOf($scope.insurance_type, question_above_index, key, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      DecrementAboveQuestions(key);
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    })
  }

  /* Subquestion */
  $scope.SaveSubquestion = function(parent_question_uid, child_question_uid, subquestion) {
    metaService.editSubquestion($scope.insurance_type, parent_question_uid, child_question_uid, subquestion, result => {
      $rootScope.genService.showDefaultSuccessMsg('Subquestion Updated');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'updatesubquestion','error',()=>{},()=>{})
    })
  }

  $scope.SetSubquestionTriggerBool = function(parent_question_uid, child_question_uid, subquestion, new_bool){
    subquestion.trigger = {};
    subquestion.trigger.condition = "==";
    subquestion.trigger.on = new_bool;
    $scope.SaveSubquestion(parent_question_uid, child_question_uid, subquestion);
  }

  /* Detele Subquestion */
  $scope.DeleteSubQuestion = function(question_uid, subquestion_uid) {
    metaService.deleteSubquestion($scope.insurance_type, question_uid, subquestion_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Suqeustion Removed');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    });
  }

/* On Controller Load */
 GetInsuranceTypes();
 GetAllQuestions();
 GetMetaInformation();
 GetQuestionMapping();
}

// Angular Module
angular.module('application').controller('InsurancetypeController', InsurancetypeController);

// Injections
InsurancetypeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'iconService', 'FileUploader', 'backofficeService'];

// Function
function InsurancetypeController($rootScope, $scope, $stateParams, $state, $controller, metaService, iconService, FileUploader, backofficeService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


  $scope.requirement_weights = [
    {weight: '100', label: 'Required by law'},
    {weight: '75', label: 'Essential'},
    {weight: '50', label: 'Important'},
    {weight: '25', label: 'Nice-to-have'},
    {weight: '0', label: 'Not Important'}
  ];

  $scope.current_industry_pick = {};

  /* scope variables */
  $scope.industry_weights = {};
  $scope.industry_to_add = {};
  $scope.insurance_uid = $stateParams.insurancetype;
  $scope.num_criteria = 0;

  /* local variables */
  let recommendationMapping;


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


  /* Get Insurance Type */
  $scope.GetInsuranceType = function(){
    $rootScope.local_load = true;
    console.log('Getting Insurance Type..');
    metaService.getSingleInsuranceType($stateParams.insurancetype, function(insurance_type){
      $rootScope.local_load = null;
      $scope.insurance_type = insurance_type;
      $scope.safeApply(fn => fn);
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Save Insurance Type */
  $scope.SaveInsuranceType = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    saveCriteriaMapping();
    metaService.saveInsuranceType($stateParams.insurancetype, $scope.insurance_type, function(){
      backofficeService.logpost({msg:'insurance type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Mark Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
    $scope.safeApply(fn => fn);
  }

  // Disable
  $scope.DisableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.disableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      backofficeService.logpost({msg:'insurance type disabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.industry_weights[key];
    $scope.safeApply(fn => fn);
  };

  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(score, key){
    if(score === null || !key) {
      return;
    }
    $scope.industry_weights[key] = {score:score};
    $scope.safeApply(fn => fn);
  };

  // Enable
  $scope.EnableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.enableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      backofficeService.logpost({msg:'insurance type enabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  };

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = codes;
      for(var key in codes){
        $scope.codes.push({key:key, code:codes[key]});
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  };

  /* check if all recommendations objs are fetched and set the activity score on the ui once fetched*/
  function getRecommendationMappingAndSetIndustryScores(){
    if(!recommendationMapping){
      getRecommendationMapping(()=>{
        setIndustryScore();
      });
    }
    else{
      setIndustryScore();
    }
  }

  /* gets the insurance recommendation_mapping table*/
  function getRecommendationMapping(callback, err_call){
    $rootScope.local_load = true;
    let currentInsuraceType = $stateParams.insurancetype;
    metaService.getAllRecommendationMapping(_recommendationMapping =>{
      if(_recommendationMapping.insurance_types
      && _recommendationMapping.insurance_types[currentInsuraceType]
      && _recommendationMapping.insurance_types[currentInsuraceType].industry_weights){
        recommendationMapping = _recommendationMapping.insurance_types[currentInsuraceType];
      }
      if(callback) {
        callback();
      }
    }, error => {
        console.log("error while fetching recommendation", error);
        if(err_call) err_call();
      });
    }

    /* Set activity score on the ui */
    function setIndustryScore(){
      if(!recommendationMapping){
        return
      }
      for(var index in recommendationMapping.industry_weights){
        $scope.industry_weights[index] = {score:recommendationMapping.industry_weights[index].score};
      }
      $scope.safeApply(fn => fn);
    }

    /* Save the activity score */
    function saveRecommendationScore(){
      let currentInsuraceType = $stateParams.insurancetype;
      let data = {industry_weights: $scope.industry_weights};
      metaService.saveIndustryRecommendationScore(currentInsuraceType,data,()=>{
        console.log("successfully saved Industry weight")
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
      });
    }

    $scope.isIconSelected = function(icon) {
      const type_icon_url = $scope.insurance_type ? $scope.insurance_type.icon_url : false;
      const new_icon_url = icon ? icon.download_url : false;
      return ((!new_icon_url && !type_icon_url) || (new_icon_url === type_icon_url)) ? 'active-icon' : '';
    };

    $scope.selectIcon = function(icon) {
      if (icon && icon.download_url) {
        $scope.insurance_type.icon_url = icon.download_url;
      } else {
        $scope.insurance_type.icon_url = false;
      }
    };

    $scope.UpdateIcon = function() {
      $scope.updating_icon = true;
      iconService.updateInsuranceTypeIcon($stateParams.insurancetype, $scope.insurance_type.icon_url, () => {
        $scope.updating_icon = false;
        $state.reload();
      }, error => {
        $scope.updating_icon = false;
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{});
      });
    };

  $scope.FileChanged = function(file){
    if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
      return;
    }
    $scope.files_to_upload[file.name] = file;
    $scope.uploading_icon = true;
    iconService.uploadFile(file, ()=>{},
    error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{});
    });
  };

  $scope.iconsListChanged = function(icons) {
    $scope.icons = icons;
    $scope.uploading_icon = false;
    $scope.safeApply(fn => fn);
  };

  /* Save Criteria Mapping */
    function saveCriteriaMapping(){
      if(!$scope.comparison_criteria_mapping){
        return;
      }

      for(let key in $scope.comparison_criteria_mapping.comparison_criteria){
        if($scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all === 'true'){
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = true;
        } else {
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = false;
        }
      }
      metaService.updateComparisonCriteriaMapping($stateParams.insurancetype, $scope.comparison_criteria_mapping, () => {
        console.log('Criteria Saved');
      }, error => {

      });
    }

    /* Get Comparison Criteria */
    $scope.GetAllComparisonCriteria = function(){
      $rootScope.local_load = true;
      metaService.getAllComparisonCriteria(comparison_criteria => {
        $scope.comparison_criteria = comparison_criteria;
        $scope.comparison_criteria_list = [];
        for(let key in comparison_criteria){
          $scope.comparison_criteria_list.push({key:key, criteria:comparison_criteria[key]})
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      })
    }

    /* Get Comparison Criteria Mapping */
    $scope.GetComparisonCriteriaMapping = function(){
      metaService.getComparisonCriteriaMappingForInsuranceType($stateParams.insurancetype, comparison_criteria_mapping => {
        if(!comparison_criteria_mapping){
          return;
        }
        $scope.comparison_criteria_mapping = comparison_criteria_mapping;
        for(let key in $scope.comparison_criteria_mapping.comparison_criteria){
          if(!$scope.comparison_criteria_mapping.comparison_criteria[key].industry) {
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry = {}
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = false;
          }
          if(!$scope.comparison_criteria_mapping.comparison_criteria[key].industry.industry_codes){
            $scope.comparison_criteria_mapping.comparison_criteria[key].industry.industry_codes = {}
          }
          $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all = $scope.comparison_criteria_mapping.comparison_criteria[key].industry.exclude_all.toString();
        }

        if($scope.comparison_criteria_mapping){
          $scope.num_criteria = Object.keys($scope.comparison_criteria_mapping.comparison_criteria).length
        }
        $scope.safeApply(fn => fn);
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        $rootScope.local_load = null;
        console.error(error);
      });
    }

    /* Add Industry Code to Criteria Mapping */
    $scope.AddIndustryCodeToCriteriaMapping = function(criteria_key){
      $scope.comparison_criteria_mapping.comparison_criteria[criteria_key].industry.industry_codes[$scope.industry_to_add[criteria_key]] = true
      delete $scope.industry_to_add[criteria_key];
      $scope.safeApply(fn => fn);
    }

    /* Remove Industry From Criteria Mapping */
    $scope.RemoveIndustryFromCriteriaMapping = function(criteria_key, code_key){
      delete $scope.comparison_criteria_mapping.comparison_criteria[criteria_key].industry.industry_codes[code_key];
    }

    /* Remove Criteria From Critaria Mapping */
    $scope.RemoveCriteriaFromMapping = function(criteria_key){
      delete $scope.comparison_criteria_mapping.comparison_criteria[criteria_key];
      $scope.num_criteria = Object.keys($scope.comparison_criteria_mapping.comparison_criteria).length
      $scope.safeApply(fn => fn);
    }

    /* On Controller Load */
    $scope.GetInsuranceType();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetIndustryScores();
    iconService.onIconsUpdate($scope.iconsListChanged, error => {
      console.log(error);
    });

    $scope.files_to_upload = {};
    $scope.GetAllComparisonCriteria();
    $scope.GetComparisonCriteriaMapping();
  }

// Angular Module
angular.module('application').controller('InsurancetypesController', InsurancetypesController);

// Injections
InsurancetypesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function InsurancetypesController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.insurance_types = [];

    $scope.AddInsuranceType = function(){
      metaService.addInsuranceType(function(){
        $rootScope.genService.showDefaultSuccessMsg('Insurance Type Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Types */
    $scope.GetAllInsuranceTypes = function(){
      $rootScope.local_load = true;
      console.log('Getting Insurance Type(s)..');
      $scope.insurance_types = [];

      metaService.getInsuranceTypes(function(insurance_types){
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }


    /* On Controller Load */
    $scope.GetAllInsuranceTypes();

}

// Angular Module
angular.module('application').controller('LoginController', LoginController);

// Injections
LoginController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','$resource', 'authService', 'APIService','FoundationApi', 'companyService', 'userService'];

// Controller
function LoginController($rootScope, $scope, $stateParams, $state, $controller, $resource, authService, APIService, FoundationApi, companyService, userService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  	$scope.login = {};

  	/** Login Function **/
  	$scope.Login = function(form){
        var params = $scope.login;
        if(!form.$valid){ return; }
        authService.login(params, function(user){
            $state.go('search');
            $scope.login.password = null;
        }, function(error){
            $scope.login.password = null;
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
  	}

    /* Reset Password */
    $scope.ResetPassword = function(form){
        var params = $scope.login;
        if(!form.$valid){ return; }
        authService.resetPassword(params, function(){
            $rootScope.genService.showDefaultSuccessMsg('Use the email we\'ve sent you to reset your password');
        },  function(){
            $scope.login = {};
            $rootScope.genService.showDefaultErrorMsg('We didn\'t recognize that email. Contact us if you\'re sure it was correctly typed');
        });
    }

    /****************************/
    /*          Signup          */
    /****************************/

    // Signup Model
    $scope.signup = {}
    $scope.signup.user = {}

    // Login Function
    $scope.Signup = function(){

        // Set Params
        var params = $scope.signup;

        // Call Authentication Object First
        authService.createUser(params.user, function(firebase_user){
              userService.createUser(params.user, firebase_user, function(){
                  $rootScope.genService.showDefaultSuccessMsg('Registered! Pleace wait for an admin to verify you');
                  document.getElementById('signup_close').click();
              }, function(error){
                  console.error(error);
                  $rootScope.genService.showDefaultErrorMsg(error.message);
                  authService.logout(function(){},function(){});
              });
        }, function(error){
            console.error(error);
            $scope.signup.user.email = null;
            $scope.signup.user.password = null;
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    // /* Get Industry Sections */
    // $scope.GetIndustrySections = function(){
    //     APIService.getResourceWithParams(APIService.SEP.CATEGORIES,{'level':'sections'}, function(data){
    //         $scope.industry.sections = data;
    //     });
    // }

    // /* Get Industry Divisions */
    // $scope.GetIndustryDivisions = function(){
    //     var section;
    //     for(var key in $scope.industry.sections){
    //         var tmpSection = $scope.industry.sections[key];
    //         var name = tmpSection.name;
    //         if(name === $scope.signup.company.section){
    //             section = tmpSection;
    //             break;
    //         }
    //     }

    //     APIService.getResourceWithParams(APIService.SEP.CATEGORIES,{'level': 'divisions', 'keys' : section.divisions}, function(data){
    //         $scope.industry.divisions = data;
    //     });
    // }


}

// Angular Module
angular.module('application').controller('MandateController', MandateController);

// Injections
MandateController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','metaService', 'FileUploader', 'fileService', 'backofficeService'];

// Function
function MandateController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, fileService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.mandate = [];

    /* Get Single Mandate */
    $scope.GetSingleMandate = function(){
      console.log('Getting Single Mandate..');
      metaService.getSingleMandate($stateParams.mandate, function(mandate){
        $scope.mandate = mandate;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadMandate($scope.current_file, function(file_url){
        metaService.addMandate(file_url, function(mandate){
          $rootScope.local_load = null;
          document.getElementById('close_upload_file').click();
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          backofficeService.logpost({msg:'mandate uploaded',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
          $state.reload();
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Error adding mandate data');
          backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
          console.error(error);
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Error uploading file');
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
        console.error(error);
      });
    }


    /* Download Mandate */
  	$scope.DownloadMandate = function(mandate){
  		console.info('Downloading Policy: ',mandate);
  		metaService.downloadMandate(mandate.file, function(url_for_download){
  			var a = document.createElement('a');
        		a.href = url_for_download;
        		a.download = 'document_name';
        		a.target = '_self';
        		a.click();
  		}, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
  		});
  	}

    /* Make Active */
    $scope.MakeActive = function(){
      console.log('Activating mandate:',$stateParams.mandate);
      $scope.ConfirmAction = null;
      metaService.activateMandate($stateParams.mandate, function(){
        $rootScope.genService.showDefaultSuccessMsg('Activated');
        backofficeService.logpost({msg:'mandate activated',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Make Inactive */
    $scope.MakeInactive = function(){
      console.log('Activating mandate:',$stateParams.mandate);
      $scope.ConfirmAction = null;
      metaService.deactivateMandate($stateParams.mandate, function(){
        $rootScope.genService.showDefaultSuccessMsg('Deactivated');
        backofficeService.logpost({msg:'mandate deactivated',mandate:$stateParams.mandate},$rootScope.user.email,'mandate','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'mandate','error',()=>{},()=>{})
      });
    }

    /* Call On Controller Load */
    $scope.GetSingleMandate();

    /***********************************/
    /**  	    Uploader Listeners      **/
    /***********************************/

    /* Uploader Instance */
    // Uploader
    var uploader = $scope.uploader = new FileUploader({});
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            return this.queue.length < 10;
        }
    });

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };

    // File Added
    uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
        console.info('Added file with name', fileItem.file.name);
        $scope.can_upload = true;
        $scope.current_file = fileItem;
    };

    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
    };

}

// Angular Module
angular.module('application').controller('MandatesController', MandatesController);

// Injections
MandatesController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','metaService', 'FileUploader', 'fileService'];

// Function
function MandatesController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, fileService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.mandates = [];

    /* Get All Mandates */
    $scope.GetAllMandates = function(){
      $rootScope.local_load = true;
      console.log('Getting mandate(s)..');
      $scope.mandates = [];

      metaService.getMandates(function(mandates){
        console.log('Mandates:', mandates);
        for(var key in mandates){
          $scope.mandates.push({key:key, mandate:mandates[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Mandate */
    $scope.AddMandate = function(){
      console.log('Adding Mandate');

    }

    /* Perform upload */
    $scope.PerformUpload = function(){
      $rootScope.local_load = true;
      metaService.uploadMandate($scope.current_file, function(file_url){
        metaService.addMandate(file_url, function(mandate){
          $rootScope.local_load = null;
          document.getElementById('close_upload_file').click();
          $rootScope.genService.showDefaultSuccessMsg('File Uploaded');
          $state.reload();
        }, function(error){
          $rootScope.genService.showDefaultErrorMsg('Error adding mandate data');
          console.error(error);
        });
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Error uploading file');
        console.error(error);
      });
    }

    /* Call On Controller Load */
    $scope.GetAllMandates();

    /**********************************/
    /**  	  Uploader Listeners     **/
    /**********************************/

    /* Uploader Instance */
    // Uploader
    var uploader = $scope.uploader = new FileUploader({});
    uploader.filters.push({
        name: 'customFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            return this.queue.length < 10;
        }
    });

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };

    // File Added
    uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
        console.info('Added file with name', fileItem.file.name);
        $scope.can_upload = true;
        $scope.current_file = fileItem;
    };

    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
    };
}

// Angular Module
angular.module('application').controller('MapInsuranceQuestionsController', MapInsuranceQuestionsController);

// Injections
MapInsuranceQuestionsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService','insuranceQuestionsService'];

// Function
function MapInsuranceQuestionsController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService, insuranceQuestionsService) {
	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

	$scope.insuranceId = $stateParams.insuraneType;
	var selectedMainQuestion;
	$scope.subQstriggerConditions = [">","<","<=",">=","!=","=="];
	$scope.insuranceId = $stateParams.insuraneType;
	$scope.mainQuestionList = [];
	var subQsToRemove =[];


	function getInsuranceQuestions(){
		insuranceQuestionsService.getInsurenceMainQuestionForInsuranceId($scope.insuranceId,(_mainQuestions)=>{
			$scope.mainQuestionList = _mainQuestions;
			for(index in $scope.mainQuestionList){
				$scope.mainQuestionList[index].addAsSubQuestion = false;
				getAndAppendChildren($scope.mainQuestionList[index]);
			}
			$scope.$apply();
		},(error)=> console.log("error while fetching main insurance questions",error));
	}

	function getAndAppendChildren(mainQuestion){
		var children=mainQuestion.insuranceQuestionObj.mappings[$scope.insuranceId].children;
		var childrenArray = [];
		for(childIndex in children){
			var insuranceQuestionObj = {insuranceQuestionObj: children[childIndex],key: childIndex};
			childrenArray.push(insuranceQuestionObj);
		}
		mainQuestion.insuranceQuestionObj.mappings[$scope.insuranceId].children = childrenArray;
	}

	$scope.getSubQuestions = (_mainQuestions) =>_mainQuestions.insuranceQuestionObj.mappings[$scope.insuranceId].children;

	$scope.addSubQsInMainQ = function(_selectedMainQuestion){
		selectedMainQuestion = _selectedMainQuestion;
	}

	$scope.addSelectedQsAsSubQs = function(){
		/*get selected main quesion*/
		/*get the selected sub question*/		 
		/*get current insurance id*/
		var selectedQsForSubQing = getSelectedQuestion();
		/*validations*/
		if(isValidForAddingMainQsToSubQs()){
			insuranceQuestionsService.addSubquestionsToMainQuestion($scope.insuranceId,selectedMainQuestion,selectedQsForSubQing,()=>{
				/*save the list of subQ which has to be removed for this insurance type after saving the mapping*/
				subQsToRemove = $scope.mainQuestionList.filter((question)=>question.addAsSubQuestion);

				/*on success on success remove the selected question from the list, as it's added as subQs */
				$scope.mainQuestionList = $scope.mainQuestionList.filter((question)=>!question.addAsSubQuestion);

				$scope.$apply();
			});
		}
	}

	function getSelectedQuestion(){
		var selectedQs = $scope.mainQuestionList.filter((question)=>question.addAsSubQuestion);
		return selectedQs;
	}

	/*check if the selcted questions and main questions and insurance id etc,. are valid*/
	function isValidForAddingMainQsToSubQs(){
		return true;
	}

	/*save edited questions*/
	$scope.saveInsuranceQuestion = function(){
		$scope.mainQuestionList.forEach((mainQuestionObj)=>{
			var data = restructureMainQForFirebase(mainQuestionObj)
			insuranceQuestionsService.updateQuestion(mainQuestionObj.key, data);
		});
		subQsToRemove.forEach((subQ)=>{
			if(subQ.insuranceQuestionObj.mappings[$scope.insuranceId])
				subQ.insuranceQuestionObj.mappings[$scope.insuranceId] = null;
			var data = angular.fromJson(angular.toJson(subQ.insuranceQuestionObj));
			insuranceQuestionsService.updateQuestion(subQ.key, data);
		});
	}

	/*restucture main Q and and it's sub Q to be saved in db*/
	function restructureMainQForFirebase(mainQuestionObj){
		// remove properties added by angular (lik '$$hashKey')
		var insuranceQuestionObj = angular.fromJson(angular.toJson(mainQuestionObj.insuranceQuestionObj));
		if(insuranceQuestionObj.mappings[$scope.insuranceId] && insuranceQuestionObj.mappings[$scope.insuranceId].children){
			var childrenObj= {};
			for(var index in insuranceQuestionObj.mappings[$scope.insuranceId].children){
				var subQ = insuranceQuestionObj.mappings[$scope.insuranceId].children[index];
				childrenObj[subQ.key] = subQ.insuranceQuestionObj;
			}
			insuranceQuestionObj.mappings[$scope.insuranceId].children =  childrenObj;
		}
		return insuranceQuestionObj;
	}

	getInsuranceQuestions();
	/*function to */

}

// Angular Module
angular.module('application').controller('MetaController', MetaController);

// Injections
MetaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller'];

// Function
function MetaController($rootScope, $scope, $stateParams, $state, $controller) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


}

// Angular Module
angular.module('application').controller('OfferController', OfferController);

// Injections
OfferController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService'];

// Function
function OfferController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    $scope.deductibleType = {};
    $scope.file_limit = 5;
    $scope.files_to_upload = {};
    $scope.files_uploaded = {};
    $scope.unsaved_changes = false;

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

    /* Get Single Offer */
    $scope.GetSingleOffer = function(callback){
      $rootScope.local_load = true;
      offerService.getSingleOffer($stateParams.offer, function(offer){
        if(offer && offer.display_version && offer.display_version == 2){
          $state.go("comparisonpreview",{"offer":$stateParams.offer});
        }
        companyService.getCompanyInformation(offer.company, function(company){
          $rootScope.local_load = null;
          $scope.offer = offer;
          $scope.num_offers = 0;
          for(var key in offer.comparisons){
            $scope.num_offers++;
          }
          getdeductibleType();
          $scope.company = company;
          $scope.getProductsForThisInsuranceType();
          $scope.GetPolicySpecificCriteria();
          $scope.GetIndustrySpecificCriteria();
          $scope.number_of_eligible_products = $scope.offer.products ? Object.keys($scope.offer.products).length : 0
          $scope.safeApply(fn => fn);
          if (typeof callback === 'function') callback(null, offer);
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
          if (typeof callback === 'function') callback(error);
        });
      }, function(error){
        if (typeof callback === 'function') callback(error);
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Lock */
    $scope.Lock = function(){
      $rootScope.local_load = true;
      offerService.lockToAdvisor($rootScope.user.email, $stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('You have been marked as Advisor');
        backofficeService.logpost({msg:'Offer Locked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    const REPORT_GENERATION_TIMEOUT = 4000;

    $scope.GenerateNewReport = function() {
      $scope.offer_in_progress = true;
      offerService.generateReport($stateParams.offer, function(){
      setTimeout(()=>{
          $scope.GetSingleOffer((err) => {
          if (err || !$scope.offer.report) {
              $scope.offer_broken = true;
          }
          $scope.offer_in_progress = false;
        });
      }, REPORT_GENERATION_TIMEOUT);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error, $rootScope.user.email, 'offer', 'error', ()=>{}, ()=>{});
      });
    };

    /* Unlock */
    $scope.Unlock = function(){
      $rootScope.local_load = true;
      offerService.unlockForAdvisor($stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Unlocked');
        backofficeService.logpost({msg:'Offer unlocked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    /* Finalize Offer */
    $scope.FinalizeOffer = function(chosen_comparison){
      console.log('Finalizing:',chosen_comparison);
      offerService.finalizeOffer($scope.offer.company, $scope.offer.comparisons[chosen_comparison], $stateParams.offer, $scope.offer.subject, result => {
        $state.go('extraction',{ policy:result.policy_uid, company:$scope.offer.company });
      }, error => {
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      })
    }

    /* Get Extraction Help */
    $scope.GetExtractionHelp = function(){
      $rootScope.local_load = true;
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Get Carriers */
    $scope.GetCarriers = function(){
      $rootScope.local_load = true;
      $scope.carriers = [];
      $scope.carrier_dictionary = {};
      metaService.getCarriers(function(carriers){
        $scope.carrier_dictionary = carriers;
        for(var key in carriers){
          $scope.carriers.push({key:key, carrier:carriers[key]});
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Add Offer */
    $scope.AddOffer = function(){
      $rootScope.local_load = true;
      offerService.addComparison($stateParams.offer,{}, function(){
        $rootScope.genService.showDefaultSuccessMsg('Added');
        backofficeService.logpost({msg:'Offer Added',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})

        $rootScope.local_load = null;
        $state.reload();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Delete Comparison */
    $scope.DeleteComparison = function(comparison_uid){
      offerService.deleteComparison($stateParams.offer, comparison_uid, function(){
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        backofficeService.logpost({msg:'Delete comparition',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Save */
    $scope.Save = function(){

      // Null every undefined
      for(var key in $scope.offer.comparisons){
        for(var field in $scope.offer.comparisons[key]){
          if(!$scope.offer.comparisons[key][field]){
            $scope.offer.comparisons[key][field] = 0;
          }
        }
        for(var field in $scope.offer.comparisons[key].custom_fields){
          if($scope.offer.comparisons[key].custom_fields[field] === undefined){
            $scope.offer.comparisons[key].custom_fields[field] = 0;
          }
        }
      }
      //
      //
      // //check if deductible is entered in % or number
      //
      // for(var key in $scope.offer.comparisons){
      //   for(var comp_key in $scope.offer.comparisons[key]){
      //     if(!$scope.offer.comparisons[key][comp_key]){
      //       $scope.offer.comparisons[key][comp_key] = 0;
      //     }
      //   }
      // }
      setdeductibleType();
      $scope.offer.display_version = 1;
      console.log($scope.offer);
      offerService.saveOffer($stateParams.offer, $scope.offer, function(){
        console.log($scope.offer);
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        backofficeService.logpost({msg:'Offer saved',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    $scope.Download = function(file){
      offerService.downloadFile(file, $scope.offer.company, function(url_for_download){
        $rootScope.genService.downloadWithLink(url_for_download);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    };

    $scope.DownloadReport = function(){
        const from = "documents/" + $scope.offer.company + "/" + $scope.offer.report;
        const rename_to = "Report for " + $scope.company.name + " for the offer of " + $scope.insurance_types[$scope.offer.subject].name_de + " " + moment($scope.offer.created_at).format("D MMMM YYYY HH.mm") + ".pdf";
        $scope.offer_in_progress = true;
        fileService.downloadWithName(from, rename_to)
          .then(() => {
              $scope.offer_in_progress = false;
              $scope.safeApply();
          })
          .catch(error => {
              $rootScope.genService.showDefaultErrorMsg('Q&A document link is broken');
              backofficeService.logpost(error, $scope.currentUser, 'offer_v2', 'error', () => {
              }, () => {});
              $scope.offer_in_progress = false;
              $scope.offer_broken = true;
              $scope.safeApply();
          })
    };

    /* Get Policy Specific Criteria */
    $scope.GetPolicySpecificCriteria = function(){
      metaService.getPolicySpecificCriteriaFromSubjectTrigger($scope.offer.subject, function(policy_specific_criteria){
        $scope.custom_fields = [];
        for(var key in policy_specific_criteria){
          if(policy_specific_criteria[key].disabled)
            continue;

          for(var field_key in policy_specific_criteria[key].fields){
            $scope.custom_fields.push({key: field_key, field: policy_specific_criteria[key].fields[field_key]});
          }
        }
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Get Industry Specific Criteria */
    $scope.GetIndustrySpecificCriteria = function(){
      $scope.industry_fields = [];
      metaService.getIndustrySpecificCriteriaFromPolicyTrigger($scope.offer.subject, function(industry_criteria){
        var included_criteria = [];
        for(var key in industry_criteria){
          triggers = industry_criteria[key].industry_trigger;
          criteria_loop:
          for(var trigger in triggers){
            for(var code in $scope.company.industry_codes){
              var should_include = $scope.company.industry_codes[code].includes(triggers[trigger]);
              if(should_include === true){
                if(industry_criteria[key].disabled)
                  continue;
                included_criteria.push(industry_criteria[key]);
                console.log('Criteria triggered for industry code',triggers[trigger],'and business code',$scope.company.industry_codes[code]);
                break criteria_loop;
              }
            }
          }
        }
        for(in_key in included_criteria){
          var fields = included_criteria[in_key].fields;
          for(var field_key in fields){
            $scope.industry_fields.push({key : field_key, field : fields[field_key]});
          }
        }
        $scope.safeApply(fn => fn);
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Mark as Offered */
    $scope.MarkAsOffered = function(){
      let offer_display_version = 1;
      offerService.markOfferAsOffered(offer_display_version, $stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Pushed to client');
        backofficeService.logpost({msg:'Offer pushed to client',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /* Revoke Offer */
    $scope.RevokeOffer = function(){
      offerService.revokeOffer($stateParams.offer, function(){
        $rootScope.genService.showDefaultSuccessMsg('Mark as Requested');
        backofficeService.logpost({msg:'Offer revoked',offer:$stateParams.offer},$rootScope.user.email,'offer','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
      });
    }

    /*get the deductible type based on the suffix added (% for percent)*/
    function getdeductibleType (){
      for(var key in $scope.offer.comparisons){
        $scope.deductibleType[key]= "number";
        var comparisonObj = $scope.offer.comparisons[key];
        $scope.deductibleType[key]
        if (comparisonObj.deductible){
          var suffix = comparisonObj.deductible.toString().slice(-1);
          if (suffix == "%"){
            //trim the % suffix and set the radio button.
            $scope.offer.comparisons[key].deductible = comparisonObj.deductible.slice(0, -1);
            $scope.deductibleType[key]="percent";
          }
        }
      }
    }

    /*set deductible type before saving*/
    setdeductibleType = function(){
      for(var key in $scope.offer.comparisons){
        var comparisonObj = $scope.offer.comparisons[key];
        if(comparisonObj.deductible){
          if($scope.deductibleType[key] == "percent"){
          //append % if the radio is selected for percent.
          $scope.offer.comparisons[key].deductible += "%";
          }
        }
      }
    }

    /* File Changed */
    $scope.FileChanged = function(file){
      if(!file || Object.keys($scope.files_to_upload).length >= $scope.file_limit || $scope.files_to_upload[file.name]){
        return;
      }
      $scope.files_to_upload[file.name] = file
      $scope.PerformUpload(file)
    }

    /* Remove From Uploads */
    $scope.RemoveFromUploads = function(key, files){
      if(!$scope.files_to_upload[key]){
        return;
      }
      delete $scope.files_to_upload[key];
      if(Object.keys($scope.files_to_upload).length === 0){
        // Nothing Yet
      }
      $scope.safeApply(fn => fn);
    }

    /* Edit Alias */
    $scope.EditAlias = function(key){
      $scope.selected_document = $scope.files_uploaded[key];
      $scope.selected_document_key = key;
    }

    /* Download Policy */
    $scope.DownloadFile = function(object){
      if(!object) {return}
      const from = "documents/" + $scope.offer.company + "/" + object.file;
      const rename_to = object.alias ? (object.alias + '.pdf') : object.file;
      fileService.downloadWithName(from, rename_to);
    };

    /* Remove From Offer */
    $scope.RemoveFromOffer = function(key){
      offerService.removeDocument($stateParams.offer, $scope.selected_comparison, key, () => {
        delete $scope.files_uploaded[key];
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'extraction (file management)','error',()=>{},()=>{})
      })
    }

    /* Save Document */
    $scope.SaveDocument = function(selected_document) {
      let route = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].route
      let key = $scope.offer.comparisons[$scope.selected_comparison].documents[$scope.selected_document_key].key
      documentService.saveDocument(route, key, selected_document, () => {
        $scope.GetDocuments();
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        document.getElementById('close_alias').click();
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'could not update document','error',()=>{},()=>{})
      })
    }

    /* Get Documents */
    $scope.GetDocuments = function(){
      if(!$scope.offer) {
        return
      };
      if($scope.files_uploaded){
        $scope.files_uploaded = {};
      }
      for(var key in $scope.offer.comparisons[$scope.selected_comparison].documents){
        let doc = $scope.offer.comparisons[$scope.selected_comparison].documents[key];
        documentService.getDocument(doc.route, doc.key, document => {
          $scope.files_uploaded[doc.key] = null;
          $scope.files_uploaded[doc.key] = document;
          console.log(document);
          $scope.safeApply(fn => fn);
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
          backofficeService.logpost(error,$rootScope.user.email, 'offer', 'error',()=>{},()=>{})
        });
      }
    }

    /* Perform upload */
  	$scope.PerformUpload = function(file){
      if(!file){return}
      $rootScope.local_load = true;
      $scope.disableUploadBtn= true;
      documentService.uploadFile(file, $scope.offer.company, file_urls => {
        documentService.createGenericDocument(file_urls, $scope.offer.company, (newUpdateDocuments, document_list) => {
          offerService.addDocumentToOffer(newUpdateDocuments, document_list.document, $stateParams.offer, $scope.selected_comparison, () => {
            $scope.files_uploaded[document_list.document.key] = newUpdateDocuments[Object.keys(newUpdateDocuments)[0]];
            delete $scope.files_to_upload[file.name]
            $rootScope.local_load = null;
            $scope.safeApply(fn => fn);
            $scope.GetSingleOffer();
          }, error => {
            $scope.disableUploadBtn= false;
            $rootScope.local_load = null;
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.code);
            backofficeService.logpost(error,$scope.currentUser,'offer','error',()=>{},()=>{});
          });
        });
      }, error => {
        console.error(error);
        $scope.disableUploadBtn= false;
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
        backofficeService.logpost(error,$scope.currentUser,'offer','error',()=>{},()=>{});
      });
    }

    $scope.SelectComparison = function(key){
      $scope.selected_comparison = key;
      $scope.GetDocuments();
    }

    /* Get Products for Offers Insurance Type */
    $scope.getProductsForThisInsuranceType = function(){
      metaService.getProductsWithInsuranceType($scope.offer.subject, products => {
        $scope.products = products;
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
      });
    }

    /* Change Display Version */
    $scope.ChangeDisplayVersion = function(version){
      offerService.changeDisplayVersion($scope.offer, $stateParams.offer, () => {
        $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
        $state.go("comparisonpreview",{"offer":$stateParams.offer});
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $rootScope.genService.showDefaultErrorMsg(error.code);
      });
    }

    $scope.EnablePushToClient = function(offerObj){
      let is_enabled = false;
      if(offerObj){
        for(let comparison_id in offerObj.comparisons){
          if(!offerObj.comparisons[comparison_id].carrier || !offerObj.comparisons[comparison_id].start_date || !offerObj.comparisons[comparison_id].end_date || !offerObj.comparisons[comparison_id].premium || !offerObj.comparisons[comparison_id].deductible || !offerObj.comparisons[comparison_id].sum_insured){
            is_enabled = true;
          }
        }
      }
      return is_enabled;
    }

    /* Unsaved Changes */
    $scope.UnsavedChanges = function(){
      $scope.unsaved_changes = true;
    }

    /* On Controller Load */
    $scope.GetSingleOffer();
    $scope.GetExtractionHelp();
    $scope.GetCarriers();

}

// Angular Module
angular.module('application').controller('OfferCriteriaController', OfferCriteriaController);

// Injections
OfferCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService', 'extractionService'];

// Function
function OfferCriteriaController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService, extractionService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables */
  $scope.offer_uid = $stateParams.offer_uid;
  $scope.comparison_uid = $stateParams.comparison_uid;
  $scope.insurance_uid = $stateParams.insurance_uid;
  
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
  
  /* Get Single Offer */
  $scope.GetSingleOffer = function(callback){
    $rootScope.local_load = true;
    offerService.getSingleOffer($stateParams.offer_uid, function(offer){
      $scope.offer = offer;
      if(!$scope.offer.comparisons[$stateParams.comparison_uid]){
        $rootScope.genService.showDefaultErrorMsg('Could not load');
        $rootScope.local_load = null;
        return
      }
      $scope.comparison = $scope.offer.comparisons[$stateParams.comparison_uid];
      $scope.UpdateAnnualPremium();
      $scope.GetCompany();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{})
    });
  };
  
  /* Update Annual Premium */
  $scope.UpdateAnnualPremium = function(){
    if(!$scope.comparison.basic){
      $scope.annual_gross_premium = 0;
      $scope.safeApply(fn => fn);
      return;
    }
    $scope.annual_gross_premium = $scope.comparison.basic.premium*(($scope.comparison.basic.insurance_tax*0.01)+1) || 0;
    $scope.safeApply(fn => fn);
  }
  
  // Get Company Information
  $scope.GetCompany = function(){
    companyService.getCompanyInformation($scope.offer.company, function(company){
      $scope.company = company;
      $rootScope.local_load = null;
      $scope.GetComparisonCriteriaMapping();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Get Offer Options */
  $scope.GetOfferOptions = function(){
    $scope.options = offerService.getOfferOptions();
  }
  
  /* Mark Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
    $scope.safeApply(fn => fn);
  }
  
  /*  */
  $scope.SaveComparison = function(){
    $rootScope.local_load = true;
    offerService.saveComparison($stateParams.offer_uid, $stateParams.comparison_uid, $scope.comparison, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved')
      $state.go('comparisonpreview',{offer:$stateParams.offer_uid})
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(specific_or_general, comparison_criteria){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.offer.subject
    
    // Null Checking
    $scope.comparison.insurance_types[insurance_uid] = $scope.comparison.insurance_types[insurance_uid] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general] = $scope.comparison.insurance_types[insurance_uid][specific_or_general] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] = $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] || {}
    
    if(!$scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent){
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = true
    } else {
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercentGeneralCriteria = function(specific_or_general){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.offer.subject
    
    // Null Checking
    $scope.comparison.insurance_types[insurance_uid] = $scope.comparison.insurance_types[insurance_uid] || {}
    $scope.comparison.insurance_types[insurance_uid].general = $scope.comparison.insurance_types[insurance_uid].general || {}
    $scope.comparison.insurance_types[insurance_uid].general = $scope.comparison.insurance_types[insurance_uid].general || {}
    
    if(!$scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent){
      $scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent = true
    } else {
      $scope.comparison.insurance_types[insurance_uid].general.deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }
  
  /* Get Carriers */
  $scope.GetCarriers = function(){
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer criteria','error',()=>{},()=>{})
      console.error(error);
    });
  }
  
  /* Get Comparison Criteria */
  $scope.GetComparisonCriteria = function(){
    metaService.getAllComparisonCriteria(comparison_criteria => {
      $scope.comparison_criteria = comparison_criteria;
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      $rootScope.local_load = null;
      console.error(error);
    })
  }
  
  /* Get Comparison Criteria Mapping */
  $scope.GetComparisonCriteriaMapping = function(){
    extractionService.getSpecificCriteriaForIndustryCodes($stateParams.insurance_uid, $scope.company.industry_codes, criteria => {
      if(!criteria || $state.current.name !== 'specificoffercriteria') { return }
      let comparison_criteria = {};
      criteria.specificCriterias.forEach(key => {comparison_criteria[key] = {included:true}})
      criteria.specificCriteriasWithIndustryCodes.forEach(key => {comparison_criteria[key] = {included:true}})
      $scope.comparison_criteria_mapping = { comparison_criteria : comparison_criteria }
      $scope.safeApply(fn => fn);
    }, error => {
      $rootScope.genService.showDefaultErrorMsg(error.message);
      $rootScope.local_load = null;
      console.error(error);
    })
  }
  
  /* On Controller Load */
  $scope.GetSingleOffer();
  $scope.GetOfferOptions();
  $scope.GetCarriers();
  
  if($state.current.name === 'specificoffercriteria'){
    //$scope.GetComparisonCriteriaMapping();
    $scope.GetComparisonCriteria();
  }
}

// Angular Module
angular.module('application').controller('OffersController', OffersController);

// Injections
OffersController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService'];

// Function
function OffersController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /* Get All Requested Offers */
    $scope.GetAllRequestedOffers = function(){
      $scope.offers = [];
      $rootScope.local_load = true;
      companyService.getAllCompanies(function(companies){
        offerService.getOfferRequests(function(offers){
          for(let key in offers){
            if(companies[offers[key].company]) {
              $scope.offers.push({key:key, offer:offers[key], company:companies[offers[key].company].name});
            }
          }
          $rootScope.local_load = null;
          $scope.$apply();
        }, function(error){
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message);
        })
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      })
    };

    /* On Controller Load */
    $scope.GetAllRequestedOffers();

  $scope.openOffer = function(offerObj) {
    console.log('offerObj.offer.display_version', offerObj.offer.display_version, offerObj.offer.display_version == 2);
    if (offerObj.offer.display_version == 2) {
      $state.go("comparisonpreview", {"offer":offerObj.key});
    }
    else{
      $state.go("offer",{"offer":offerObj.key});
    }
  };

    metaService.getInsuranceTypes(function (insurance_types) {
      $scope.insurance_types = insurance_types;
    });

}

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

// Angular Module
angular.module('application').controller('PickinsuranceQuestionController', PickinsuranceQuestionController);

// Injections
PickinsuranceQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'insuranceQuestionsService', 'metaService'];

// Function
function PickinsuranceQuestionController($rootScope, $scope, $stateParams, $state, $controller,  insuranceQuestionsService, metaService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

  $scope.selectedQuestionsList = {};
  $scope.selectedQuestionsList.set = new Set();
  $scope.selectedQuestion;
  $scope.selected_question;
  $scope.insurance_type = $stateParams.insuranceType;

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

  /*add question to the selected insurence*/
  $scope.addQuestionToInsurence = function(){
    var selectedQuestionObj = JSON.parse($scope.selectedQuestion);
    $scope.selectedQuestionsList.set.add(selectedQuestionObj);
    $scope.selectedQuestionsList.arr = Array.from( $scope.selectedQuestionsList.set);
  }

  /*user cannot find needed question, redirect to add new questions page*/
  $scope.addNewQuestions = function(){
    $state.go('questionsearch',{question_type:'specific'});
  }

  /*redirect to insurance questions page*/
  $scope.back = function(){
    $state.go('insurancequestions');
  }

  /*save selected question as main questions for current insurance type*/
  $scope.save = function(){
    $scope.selectedQuestionsList.arr.forEach((_selectedQuestion)=>{
      var selectedQuestion = _selectedQuestion.question;
      if(!selectedQuestion.mappings)
        selectedQuestion.mappings = {};
      selectedQuestion.mappings[$scope.insurance_type] = {"children":false};
      insuranceQuestionsService.updateQuestion(_selectedQuestion.key, selectedQuestion);
    });
  }

  /* Get All Questions */
  function GetAllInsuranceSpecificQuestions (){
    $rootScope.local_load = true;
    console.log('Getting Questions..');
    insuranceQuestionsService.getAllInsuranceQuestions(function(questions){
      $scope.questions = {};
      for(var key in questions){
        if((questions[key].question_type === 'specific' && $stateParams.insuranceType !== 'confirmatory' && $stateParams.insuranceType !== 'general') || (questions[key].question_type === 'general' && $stateParams.insuranceType === 'general') || (questions[key].question_type === 'confirmatory' && $stateParams.insuranceType === 'confirmatory')){
          if(!$scope.questions_map || !$scope.questions_map[key]){
            $scope.questions[key] = questions[key];
          }
        }
      }
      $rootScope.local_load = false;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
      console.error(error.message);
    });
  }

  /* Get Meta Information */
  GetMetaInformation = function(){
    insuranceQuestionsService.getAllMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.input_types = meta.input_type_enum;
      $scope.meta.question_types = meta.question_type_enum;
      $scope.meta.account_page_status = meta.account_page_status;
    }, error => {
      console.error(error);
    });
  }

  /* Selector Change */
  $scope.selectorChange = function(){

  }

  /* Add Question to Mapping */
  $scope.AddQuestionToMapping = function() {
    if(!$scope.selected_question_key) { return }
    metaService.editQuestionMapping($scope.insurance_type, $scope.selected_question_key, { children : false, order:parseInt($scope.questions_map_length) }, result => {
      $rootScope.genService.showDefaultSuccessMsg('New Question Added');
      $state.go('insurancequestions', {insuranceType:$scope.insurance_type});
    }, error => {
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
      console.error(error.message);
    });
  }

  /* Get Question Mapping */
  GetQuestionMapping = function(){
    metaService.getQuestionMappingForInsuranceType($stateParams.insuranceType, question_mapping => {
      $scope.questions_map = question_mapping;
      if($scope.questions_map){
        $scope.questions_map_length = parseInt(Object.keys(question_mapping).length) + 1
      } else {
        $scope.questions_map_length = 1;
      }

      console.log('ORDER:',$scope.questions_map_length);
      GetAllInsuranceSpecificQuestions();
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }

  GetMetaInformation();
  GetQuestionMapping();
}

// Angular Module
angular.module('application').controller('PolicyController', PolicyController);

// Injections
PolicyController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function PolicyController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    $scope.AddBlankCriteria = function(){
      $scope.criteria = [];
      metaService.addPolicyCriteria(function(){
        $rootScope.genService.showDefaultSuccessMsg('Policy Criteria - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Criteria */
    $scope.GetAllPoliciCriteria = function(){
      $rootScope.local_load = true;
      console.log('Getting Policy Criteria..');
      $scope.criterias = [];

      metaService.getPolicyCriteria(function(criterias){
        for(var key in criterias){
          $scope.criterias.push({key:key, criteria:criterias[key]});;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }
    

    /* On Controller Load */
    $scope.GetAllPoliciCriteria();
    $scope.GetInsuranceTypes();

}

// Angular Module
angular.module('application').controller('PolicyTypeController', PolicyTypeController);

// Injections
PolicyTypeController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'backofficeService'];

// Function
function PolicyTypeController($rootScope, $scope, $stateParams, $state, $controller, metaService, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.criteria = null;

    /* Get Single Policy Criteria */
    $scope.GetSinglePolicyCriteria = function(){
      $rootScope.local_load = true;
      metaService.getSinglePolicyCriteria($stateParams.criteria, function(criteria){
        $scope.criteria = criteria;
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Save Criteria */
    $scope.SaveCriteria = function(){
      $rootScope.local_load = true;
      // for(var key in $scope.policytype.fields){
      //   var field = $scope.policytype.fields[key];
      //   console.log(field);
      //   field.variable_name = $rootScope.genService.generateVariableName(field.title);
      // }

      metaService.savePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $rootScope.genService.showDefaultSuccessMsg('Saved');
        backofficeService.logpost({msg:'criteria saved',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Add Custom Field */
    $scope.AddCustomField = function(){
      console.log('Adding custom field..');
      $rootScope.local_load = true;
      metaService.addCustomField($stateParams.criteria, function(){
        backofficeService.logpost({msg:'custom field added',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Disable Custom Field */
    $scope.DisableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.disableCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field disabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Deleted');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Enable Custom Field */
    $scope.EnableCustomField = function(field_uid){
      $rootScope.local_load = true;
      metaService.enableCustomField($stateParams.criteria, field_uid, function(){
        backofficeService.logpost({msg:'custom field enabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Disable Criteria */
    $scope.DisableCriteria = function(){
      metaService.deletePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        backofficeService.logpost({msg:'criteria disabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Disabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Enable Criteria */
    $scope.EnableCriteria = function(){
      metaService.enablePolicyCriteria($stateParams.criteria, $scope.criteria, function(){
        $scope.ConfirmAction = null;
        backofficeService.logpost({msg:'criteria enabled',criteria:$stateParams.criteria},$rootScope.user.email,'policytype','info',()=>{},()=>{})
        $rootScope.genService.showDefaultSuccessMsg('Enabled');
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* Get Insurance Types */
    $scope.GetInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = [];
        for(var key in insurance_types){
          $scope.insurance_types.push({key:key, insurance_type:insurance_types[key]});
        }
        $scope.$apply();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'policytype','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetSinglePolicyCriteria();
    $scope.GetInsuranceTypes();
}

// Angular Module
angular.module('application').controller('PretriggerEditorController', PretriggerEditorController);

// Injections
PretriggerEditorController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function PretriggerEditorController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.question_uid = $stateParams.question_uid;
    $scope.product_uid = $stateParams.product_uid;
    $scope.trigger = {};

    /////////////////////////////
    /*        Functions        */
    /////////////////////////////

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

    /* Easy Apply */
    //   $scope.easyApply = function(){
    //   $scope.safeApply(fn => fn);
    // };

    /* Download Question */
    DownloadQuestion = function(){
      insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.question_uid, question => {
        $scope.question = question;
        if($scope.question.input_type === 'bool'){
          $scope.trigger.on = $scope.trigger.on.toString();
        }

        $scope.safeApply(fn => fn)
      }, error => {
        console.error(error);
      });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
      metaService.getAllProductMetaInformation(meta => {
        $scope.meta = {};
        $scope.meta.product_input_type_enum = meta.product_input_type_enum;
        $scope.meta.product_trigger_conditions = meta.product_trigger_conditions;
        $scope.meta.product_boolean_answers = meta.product_boolean_answers;
      }, error => {
        console.error(error);
      });
    }

    /* Get the information about product */
    GetProductInfo = function(){
      metaService.getSingleProduct($scope.product_uid, product => {
        $scope.product = product;
        $scope.trigger = product.pre_triggers.questions[$stateParams.question_uid].trigger;
        DownloadQuestion();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Save Product Question Threshold */
    $scope.SaveProductQuestionThreshold = function(){
      if(!$scope.trigger) {return}

      if($scope.trigger.on === 'false'){
        $scope.trigger.on = false;
        $scope.trigger.condition = '=='
      }

      if($scope.trigger.on === 'true'){
        $scope.trigger.on = true;
        $scope.trigger.condition = '=='
      }

      if($scope.trigger.on === 'no_threshold'){
        $scope.trigger.condition = 'no_threshold'
      }

      if($scope.trigger.condition === 'no_threshold'){
        $scope.trigger.on = 'no_threshold'
      }
      metaService.savePretriggerQuestion($scope.product_uid, $scope.question_uid, $scope.trigger, () => {
        $state.reload()
        $rootScope.genService.showDefaultSuccessMsg('Trigger Saved');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Condition for no threshold value field */
    $scope.NoThresholdTrigger = function(nothreshold_trigger_condition){
      if($scope.question.input_type !== 'bool'){
        if($scope.trigger.condition !== 'no_threshold' && $scope.trigger.on === 'no_threshold'|| $scope.trigger.on === false){
          $scope.trigger.on = $scope.question.input_type === 'currency' ? 0 : $scope.trigger.on;
          $scope.trigger.on = $scope.question.input_type === 'number' ? 0 :   $scope.trigger.on;
        }
      }
      if($scope.trigger.condition === 'no_threshold'){
        $scope.trigger.on = 'no_threshold'
      }
      $scope.safeApply(fn => fn)
    }

    /*redirect to insurance questions page*/
    $scope.back = function(){
        window.history.back();
    }

    /* Unsaved Changes*/
    $scope.UnsavedChanges = function(){
      $scope.unsaved_changes = true;
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetMetaInformation();
    GetProductInfo();
}

// Angular Module
angular.module('application').controller('ProductController', ProductController);

// Injections
ProductController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'insuranceQuestionsService', 'FoundationApi'];

// Function
function ProductController($rootScope, $scope, $stateParams, $state, $controller, metaService, insuranceQuestionsService, FoundationApi) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables  */
  $scope.product_uid = $stateParams.product_uid;
  $scope.unsaved_changes = false;
  $scope.industry_weights = {}
  $scope.questions = {}
  $scope.subquestion_trigger = {}
  
  
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
  
  /* Get Product */
  $scope.GetProduct = function(){
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid, function(product){
      $rootScope.local_load = null;
      product.pre_triggers = product.pre_triggers || {}
      product.pre_triggers.industry = product.pre_triggers.industry || {}
      product.pre_triggers.industry.industry_codes = product.pre_triggers.industry.industry_codes || {}
      product.pre_triggers.questions = product.pre_triggers.questions || {}
      $scope.product = product;
      if($scope.product.pre_triggers.industry.exclude_all !== null && $scope.product.pre_triggers.industry.exclude_all !== undefined){
        $scope.product.pre_triggers.industry.exclude_all = $scope.product.pre_triggers.industry.exclude_all.toString();
      }
      $scope.pretrigger_question_length = Object.keys($scope.product.pre_triggers.questions).length
      for(var key in $scope.product.pre_triggers.questions){
        GetSingleQuestion(key);
      }
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Make Exclude Bool */
  MakeExcludeBool = function(){
    if($scope.product.pre_triggers.industry.exclude_all === 'false'){
      $scope.product.pre_triggers.industry.exclude_all = false;
    }
    if($scope.product.pre_triggers.industry.exclude_all === 'true'){
      $scope.product.pre_triggers.industry.exclude_all = true;
    }
  }
  
  /* Save Product */
  $scope.SaveProduct = function(){
    $scope.product.name = $scope.product.name || ""
    MakeExcludeBool();
    $rootScope.local_load = true;
    metaService.saveProduct($stateParams.product_uid, $scope.product, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Disable */
  $scope.DisableProduct = function(){
    $rootScope.local_load = true;
    metaService.disableProduct($stateParams.product_uid, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
  }
  
  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = codes;
      for(var key in codes){
        $scope.codes.push({key:key, code:codes[key]});;
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.product.pre_triggers.industry.industry_codes[key];
    $scope.safeApply(fn => fn);
  }
  
  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(key){
    if(!key) {
      return;
    }
    $scope.UnsavedChanges();
    $scope.product.pre_triggers.industry.industry_codes[key] = true
    $scope.safeApply(fn => fn);
  }
  
  /* Enable */
  $scope.EnableProduct = function(){
    $rootScope.local_load = true;
    metaService.enableProduct($stateParams.product_uid, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Get Carriers */
  $scope.GetCarriers = function(){
    $rootScope.local_load = true;
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      console.error(error);
    });
  }
  
  GetProductMetaInformation = function(){
    metaService.getAllProductMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.product_input_type_enum = meta.product_input_type_enum;
      $scope.meta.product_trigger_conditions = meta.product_trigger_conditions;
      $scope.meta.product_boolean_answers = meta.product_boolean_answers;
    }, error => {
      console.error(error);
    });
  }
  
  /* Get Extraction Help */
  $scope.GetInsuranceTypes = function(){
    $rootScope.local_load = true;
    metaService.getInsuranceTypes(function(insurance_types){
      $scope.insurance_types = insurance_types;
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      console.error(error);
    });
  }
  
  /* Get Single Question */
  GetSingleQuestion = function(question_uid){
    metaService.getSingleInsuranceQuestion(question_uid, question => {
      $scope.questions[question_uid] = question;
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'product editor','error',()=>{},()=>{})
    });
  }
  
  /* Question Mapping */
  $scope.GetProductQuestionMapping = function(){
    $scope.knockout_question_list = []
    metaService.getQuestionMappingForProduct($stateParams.product_uid, question_mapping => {
      if(!question_mapping) {
        return;
      }
      question_mapping = question_mapping.questions
      $scope.raw_mapping = question_mapping;
      console.log('Mapping',question_mapping);
      for(var key in question_mapping){
        $scope.knockout_question_list.push({key:key, question:question_mapping[key]});
        GetSingleQuestion(key);
        for(var child_key in question_mapping[key].children){
          GetSingleQuestion(child_key);
        }
      }
      $scope.safeApply(fn => fn);
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
    });
  }
  
  /* Decrement all question Above */
  DecrementAboveQuestions = function(deleted_question_uid)  {
    let ordered_map = {};
    let highest_order = 0;
    for(var key in $scope.raw_mapping){
      if(key === deleted_question_uid) { continue }
      ordered_map[$scope.raw_mapping[key].order] = {question:$scope.raw_mapping[key], key:key}
      highest_order = highest_order < $scope.raw_mapping[key].order ? $scope.raw_mapping[key].order : highest_order;
    }
    let goal = 1;
    for(var i=1; i<=highest_order;i++){
      let question = ordered_map[i];
      if(question && goal === question.question.order){
        goal++;
        continue;
      } else if(question) {
        question.question.order = goal;
        goal++;
        metaService.saveQuestionMappingForProduct($stateParams.product_uid, question.key, question.question, result => {
          
        }, error => {
          $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
          console.error(error.message);
        });
      }
    }
  }
  
  /* Delete Pretrigger Question */
  $scope.DeletePretriggerQuestion = function(question_uid){
    metaService.deletePretriggerQuestion($stateParams.product_uid, question_uid, () => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      $state.reload();
    }, error => {
      $rootScope.genService.showDefaultErrorMsg('Couldn\'t perform operation');
      console.error(error.message);
    });
  }
  
  /* Move Up */
  $scope.MoveUp = function(key) {
    let question_up = $scope.raw_mapping[key]
    let question_down_index = null;
    if(question_up.order <= 1) { return }
    for(var index in $scope.raw_mapping){
      if($scope.raw_mapping[index].order === question_up.order-1){
        question_down_index = index
        break;
      }
    }
    if(!question_down_index){ return }
    metaService.swapOrderOnQuestionInProductMapping($stateParams.product_uid, key, question_down_index, question_up.order-1, question_up.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }
  
  /* Move Down */
  $scope.MoveDown = function(key) {
    let question_down = $scope.raw_mapping[key];
    let question_up_index = null;
    if(question_down.order >= $scope.knockout_question_list.length) { return }
    for(var index in $scope.raw_mapping){
      if($scope.raw_mapping[index].order == question_down.order+1){
        question_up_index = index
        break;
      }
    }
    if(!question_up_index){ return }
    metaService.swapOrderOnQuestionInProductMapping($stateParams.product_uid, key, question_up_index, question_down.order+1, question_down.order, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'swapquestionorder','error',()=>{},()=>{})
    })
  }
  
  /* Delete Question From Mapping */
  $scope.DeleteQuestionFromMapping = function(question_uid) {
    let deleted_question = $scope.questions[question_uid]
    metaService.deleteFromProductQuestionMapping($stateParams.product_uid, question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Question Removed');
      DecrementAboveQuestions(question_uid)
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Redirect to Question Picker */
  $scope.addQuestionToInsurence =function(pre_trigger){
    $state.go('productquestionpicker', {product_uid:$stateParams.product_uid ,order:$scope.knockout_question_list.length+1, pre_trigger:pre_trigger});
  }
  
  /* Get Meta Information */
  GetMetaInformation = function(){
    insuranceQuestionsService.getAllMetaInformation(meta => {
      $scope.meta = {};
      $scope.meta.input_types = meta.input_type_enum;
      $scope.meta.question_types = meta.question_type_enum;
      $scope.meta.account_page_status = meta.account_page_status;
      $scope.meta.trigger_conditions = meta.trigger_conditions;
      $scope.meta.boolean_answers = meta.boolean_answers;
    }, error => {
      console.error(error);
    });
  }
  
  /* Make Subquestion of Above */
  $scope.MakeSubQuestionOfAbove = function(key, order) {
    
    $scope.subquestion_trigger.on = $scope.raw_mapping[key].knockout_trigger.on;
    $scope.subquestion_trigger.condition = $scope.raw_mapping[key].knockout_trigger.condition;
    
    let question_above_index = null;
    let question_to_subquestion = $scope.questions[key];
    if(question_to_subquestion.order <= 1) {
      return;
    }
    
    if($scope.raw_mapping[key].order===order) {
      var child_question_id = $scope.raw_mapping[key].order;
      var parent_question_id = $scope.raw_mapping[key].order-1;
      for(var index in $scope.raw_mapping) {
        if($scope.raw_mapping[index].order==parent_question_id) {
          question_above_index = index;
        }
      }
    }
    
    if(!question_above_index) {
      return;
    }
    
    if($scope.raw_mapping[key].children){
      return;
    }
    
    if($scope.questions[question_above_index].input_type === 'date') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Date');
      })
      return;
    }
    
    if($scope.questions[question_above_index].input_type === 'text') {
      $scope.safeApply(fn => {
        $rootScope.genService.showDefaultErrorMsg('Cannot add Suquestion to a Question of type Free Text');
      })
      return;
    }
    
    metaService.deleteAndMakeSubquestionProduct($scope.product_uid, question_above_index, key, $scope.subquestion_trigger, result => {
      $rootScope.genService.showDefaultSuccessMsg('Moved');
      DecrementAboveQuestions(key);
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'makesubquestion','error',()=>{},()=>{})
    })
  }
  
  /* Delete Sub Question From Mapping */
  $scope.DeleteSubQuestionFromProductMapping = function(parent_question_uid, child_question_uid) {
    metaService.deleteSubQuestionOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, result => {
      $rootScope.genService.showDefaultSuccessMsg('Sub Question Removed');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  // Set trigger for sub questions of bool type products
  $scope.SetSubquestionTriggerBool = function(parent_question_uid, child_question_uid, subquestion, new_bool){
    subquestion.trigger = {};
    subquestion.trigger.condition = "==";
    subquestion.trigger.on = new_bool;
    metaService.setSubQuestionTriggerOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, subquestion, () => {
      $rootScope.genService.showDefaultSuccessMsg('Trigger set for sub question');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  // Set trigger for sub questions of non-bool type products
  $scope.SetSubquestionTriggerNotBool = function(parent_question_uid, child_question_uid, subquestion){
    metaService.setSubQuestionTriggerOfProduct($stateParams.product_uid, parent_question_uid, child_question_uid, subquestion, () => {
      $rootScope.genService.showDefaultSuccessMsg('Trigger set for sub question');
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  $scope.back = function(){
    $state.go('products');
  }
  
  /* *********comparison criteria*********** */
  
  const criteria_dummy = {
    sum_insured: 0,
    deductible_absolute_max: 0,
    deductible_absolute_min: 0,
    deductible_is_percent: false,
    deductible_percent_max: 0,
    included: false,
    maximisation: 1
  };
  
  $scope.generic_keys = {
    'general': 'General',
    'specific': 'Specific',
    'additional': 'Additional',
    'body': 'Bodily Injury',
    'financial': 'Financial Loss',
    'property': 'Property Damage'
  };
  
  $scope.max_comparison_count = 3;
  
  /**
  * Retrieve Comparison Criteria for the current product
  */
  function loadProductComparisonCriteria() {
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid,(product)=>{
      $scope.product = product;
      if(product.comparisons){
        $scope.comparison_keys = Object.keys($scope.product.comparisons);
        $scope.comparison_count = $scope.comparison_keys.length;
        
        $scope.compare_insurance_types = [];
        
        $scope.tree = {
          general: {[product.insurance_type]: {}},
          specific: {},
          additional: {}
        };
        
        $scope.obsolete_criteria = {};
        
        //iterate offer comparisons
        $scope.comparison_keys.forEach(comparison_key => {
          const comparison = product.comparisons[comparison_key];
          
          //iterate comparison insurance types
          for (let insurance_type_key in comparison.insurance_types) {
            if (comparison.insurance_types.hasOwnProperty(insurance_type_key)) {
              const insurance_type = comparison.insurance_types[insurance_type_key];
              
              if (typeof insurance_type === 'object') { //Dev.purposes mostly: we don't expect this to be false in real life
              
              /**
              * General
              */
              
              if (insurance_type_key === product.insurance_type) { //Check if this is a general insurance type
                for (let key in insurance_type.general) { //Go through general insurance types (body, financial, property)
                  if (insurance_type.general.hasOwnProperty(key)) {
                    if (!$scope.tree.general[insurance_type_key][key]) 
                      $scope.tree.general[insurance_type_key][key] = {};
                    $scope.tree.general[insurance_type_key][key][comparison_key] = insurance_type.general[key];
                  }
                }
              }
            } //if (typeof insurance_type === 'object')
          } //if (comparison.insurance_types.hasOwnProperty(insurance_type_key))
        }
      });
      isComparisionCriteriaValid();
    }
  });
}

/* Make Preferred */
$scope.MakePreferred = function(comparison_key){
  $scope.product.preferred = comparison_key;
  $scope.SaveProduct();
}

/**
*
* @param {String} key
* @return {*}
*/
$scope.getSectionName = function (key) {
  if (!key) return '';
  if ($scope.comparisons[key]) return $scope.comparisons[key].name_de;
  return $scope.generic_keys[key] || key;
};

/**
* Create a new blank comparison in the current product
*/
$scope.createNewComparison = function () {
  if (!$scope.comparison_count || $scope.comparison_count < $scope.max_comparison_count) {
    $scope.adding_comparison = true;
    
    const comparison = {
      insurance_types: {
        [$scope.product.insurance_type]: {
          general: {
            body: Object.assign({}, criteria_dummy),
            financial: Object.assign({}, criteria_dummy),
            property: Object.assign({}, criteria_dummy)
          },
          specific: {}
        }
      }
    };
    
    metaService.addProductComparison($scope.product_uid, comparison, () => {
      $state.reload();
    }, (err) => {
      console.log(err);
    });
    
  }
};

metaService.getAllComparisonCriteria(function (comparisons) {
  $scope.comparisons = comparisons
});

//Request the Deletion (Modal) of Comparison criteria in product
$scope.requestDeleteComparison = function(comparison_key) {
  $rootScope.local_load = true;
  $scope.delete_comparison = {
    key: comparison_key,
    comparison: $scope.product.comparisons[comparison_key]
  };
  FoundationApi.publish('comparison-deletion-modal', 'show');
};

/**
* Remove comparison from the current product
* @param comparison_uid
*/
$scope.deleteComparison = function (comparison_uid) {
  $rootScope.local_load = true;
  metaService.deleteComparisonFromProduct($stateParams.product_uid, comparison_uid, () => {
    $state.reload();
    FoundationApi.publish('comparison-deletion-modal', 'hide');
    $rootScope.genService.showDefaultSuccessMsg('Comparison deleted');
  }, (err) => {
    console.log(err);
  })
};

/* Change Display Version */
$scope.ChangeDisplayVersion = function(version){
  metaService.changeProductDisplayVersion($scope.product_uid, () => {
    $rootScope.genService.showDefaultSuccessMsg('Display Version set to: '+version+'');
    $state.reload();
  }, error => {
    console.error(error);
    $rootScope.local_load = null;
    $rootScope.genService.showDefaultErrorMsg(error.code);
  });
}

function isComparisionCriteriaValid(){
  $scope.isComparisionCriteriaValid = true;
  if($scope.product.display_version == 2){
    if(!$scope.product.comparisons || !$scope.product.insurance_type){
      $scope.isComparisionCriteriaValid = false;
      return;
    }
    for(let comparisionId in $scope.product.comparisons){
      let comparisonObj = $scope.product.comparisons[comparisionId];
      if(!comparisonObj.insurance_types || !comparisonObj.basic ){
        $scope.isComparisionCriteriaValid = false;
        break;
      }
      let generalCriteria = comparisonObj.insurance_types[$scope.product.insurance_type];
      if(!generalCriteria || !generalCriteria.general){
        $scope.isComparisionCriteriaValid = false;
        break;
      }
      /* check if the general is valid, if all 3  criteri's included flags are not set then it's invalid */
      $scope.isComparisionCriteriaValid = false;
      for(let generalCriteriaId in generalCriteria.general){
        let generalCriteriaItem = generalCriteria.general[generalCriteriaId];
        if(generalCriteriaItem.included){
          $scope.isComparisionCriteriaValid = true;
          break;
        }
      }
      if(!$scope.isComparisionCriteriaValid){
        break;
      }
      /* check for specif criteria comparision here, do only if general criterias are valid */
      if($scope.isComparisionCriteriaValid){

      }
    }
  }
}

/**
 * Apply class for the comparison criteria
 * @param {Object | false} comparison
 * @return {string}
 */
$scope.checkCoverage = function (comparison) {
  if (typeof comparison === 'undefined') return "not-used";
  if (typeof comparison.included !== 'boolean') return "not-applicable";
  if (!comparison.included) return "not-included";
  return '';
};

/* Check Basic */
$scope.checkBasic = function(basic_criteria){
  if (typeof basic_criteria === 'undefined') return "not-applicable";
  return '';
}

/* On Controller Load */
GetMetaInformation();
$scope.GetProduct();
$scope.GetCarriers();
$scope.GetInsuranceTypes();
$scope.GetAllCodes();
$scope.GetProductQuestionMapping();
loadProductComparisonCriteria()
}

// Angular Module
angular.module('application').controller('ProductCriteriaController', ProductCriteriaController);

// Injections
ProductCriteriaController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'metaService', 'fileService', 'backofficeService', 'documentService', 'extractionService'];

// Function
function ProductCriteriaController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, metaService, fileService, backofficeService, documentService, extractionService) {
  angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));
  
  /* Scope Variables */
  $scope.product_uid = $stateParams.product_uid;
  $scope.comparison_uid = $stateParams.comparison_uid;
  $scope.insurance_uid = $stateParams.insurance_uid;
  
  /* Constants */
  const included_options = {
    [true]: 'Included',
    [false]: 'Not Included'
  };
  
  const general_keys = {
    body: 'Bodily Injury',
    property: 'Property Damage',
    financial: 'Financial Loss'
  };
  
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
  
  /* Get Product */
  $scope.GetSingleProduct = function(){
    $rootScope.local_load = true;
    metaService.getSingleProduct($scope.product_uid, function(product){
      $scope.product = product;
      if(!$scope.product.comparisons[$stateParams.comparison_uid]){
        $rootScope.genService.showDefaultErrorMsg('Could not load');
        $rootScope.local_load = null;
        return
      }
      $scope.comparison = $scope.product.comparisons[$stateParams.comparison_uid];
      $scope.UpdateAnnualPremium();
      $scope.safeApply(fn => fn);
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Update Annual Premium */
  $scope.UpdateAnnualPremium = function(){
    if(!$scope.comparison.basic){
      $scope.annual_gross_premium = 0;
      $scope.safeApply(fn => fn);
      return;
    }
    $scope.annual_gross_premium = $scope.comparison.basic.premium*(($scope.comparison.basic.insurance_tax*0.01)+1) || 0;
    $scope.safeApply(fn => fn);
  }
  
  /* Mark Unsaved Changes */
  $scope.UnsavedChanges = function(){
    $scope.unsaved_changes = true;
    $scope.safeApply(fn => fn);
  }
  
  /*  */
  $scope.SaveComparison = function(){
    $rootScope.local_load = true;
    offerService.saveComparison($stateParams.offer_uid, $stateParams.comparison_uid, $scope.comparison, () => {
      $rootScope.genService.showDefaultSuccessMsg('Saved')
      $state.reload();
    }, error => {
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer','error',()=>{},()=>{});
    });
  }
  
  /* Save Product */
  $scope.SaveProduct = function(){
    $rootScope.local_load = true;
    metaService.saveProduct($stateParams.product_uid, $scope.product, function(){
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
      $rootScope.local_load = null;
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }
  
  /* Get Carriers */
  $scope.GetCarriers = function(){
    metaService.getCarriers(function(carriers){
      $scope.carriers = carriers;
      $scope.safeApply(fn => fn);
    }, function(error){
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'offer criteria','error',()=>{},()=>{})
      console.error(error);
    });
  }
  
  /* Get Product Options */
  $scope.GetProductOptions = function(){
    $scope.options = { included_options, general_keys };
  }
  
  /* Make deductible Percent */
  $scope.MakedeductiblePercent = function(specific_or_general, comparison_criteria){
    
    let insurance_uid = $stateParams.insurance_uid || $scope.product.insurance_type
    
    // Null Checking
    $scope.comparison.insurance_types[insurance_uid] = $scope.comparison.insurance_types[insurance_uid] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general] = $scope.comparison.insurance_types[insurance_uid][specific_or_general] || {}
    $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] = $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria] || {}
    
    if(!$scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent){
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = true
    } else {
      $scope.comparison.insurance_types[insurance_uid][specific_or_general][comparison_criteria].deductible_is_percent = false
    }
    $scope.safeApply(fn => fn);
  }
  
  /* On Controller Load */
  $scope.GetSingleProduct();
  $scope.GetCarriers();
  $scope.GetProductOptions();
  
}

// Angular Module
angular.module('application').controller('ProductQuestionController', ProductQuestionController);

// Injections
ProductQuestionController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function ProductQuestionController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.question_uid = $stateParams.question_uid;
    $scope.product_uid = $stateParams.product_uid;
    $scope.child_question_uid = $stateParams.child_question_uid;
    $scope.trigger = {};

    /////////////////////////////
    /*        Functions        */
    /////////////////////////////



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

    /* Easy Apply */
    //   $scope.easyApply = function(){
    //   $scope.safeApply(fn => fn);
    // };

    /* Download Question */
    DownloadQuestion = function(){
        insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.question_uid, question => {
            if(question.input_type !== 'bool'){
                if($scope.trigger.on === 'no_threshold' || $scope.trigger.on === 'false'){
                    $scope.trigger.on  = question.input_type === 'currency' && 0;
                    $scope.trigger.on  = question.input_type === 'number' && 0;
                }
            }
            question.account_page_status = question.account_page_status || 'hide';
            $scope.question = question;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
        });
    }

    /* Download Sub Question */
    DownloadSubQuestion = function(){
        insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.child_question_uid, subquestion => {
            // if(question.input_type !== 'bool'){
            //     if($scope.trigger.on === 'no_threshold' || $scope.trigger.on === 'false'){
            //         $scope.trigger.on  = question.input_type === 'currency' && 0;
            //         $scope.trigger.on  = question.input_type === 'number' && 0;
            //     }
            // }
            subquestion.account_page_status = subquestion.account_page_status || 'hide';
            $scope.subquestion = subquestion;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
        });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
        metaService.getAllProductMetaInformation(meta => {
            $scope.meta = {};
            $scope.meta.product_input_type_enum = meta.product_input_type_enum;
            $scope.meta.product_trigger_conditions = meta.product_trigger_conditions;
            $scope.meta.product_boolean_answers = meta.product_boolean_answers;
        }, error => {
            console.error(error);
        });
    }

    /* Remap Insurance Mapping */
    RemapInsuranceMapping = function(mapping, callback){
        $scope.question_mapping = {};
        for(var key in mapping){
            let questions = mapping[key].questions;
            $scope.question_mapping[key] = new Set();
            for(var q_uid in questions){
                $scope.question_mapping[key].add(q_uid)
                for(var c_uid in questions[q_uid].children){
                    $scope.question_mapping[key].add(c_uid)
                }
            }
        }
        if(callback){
            console.log('Mapping Updated');
            callback();
        }
    }

    /* Get the information about product from firebase */
    GetProductInfo = function(){
        metaService.getSingleProduct($scope.product_uid, productInfo => {
            $scope.nameOfProduct = productInfo.name;
            $scope.isProduct = $scope.product_uid;
               // $scope.safeApply(fn => fn)
           }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get the trigger for product questions */
    GetTriggerForProductQuestion = function(){
        metaService.getTriggersForProductQuestion($scope.product_uid, $scope.question_uid, trigger => {
            for(var product_trigger_condition in trigger) {
                $scope.trigger = trigger.knockout_trigger;
                if($scope.trigger.on===true) {
                    $scope.trigger.on = "true";
                } else if($scope.trigger.on===false) {
                    $scope.trigger.on = "false";
                }
            }
            $scope.NoThresholdTrigger($scope.trigger.condition);
            DownloadQuestion();
            //$scope.safeApply(fn => fn);
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get the trigger for product sub questions */
    GetTriggerForProductSubQuestion = function(){
        metaService.getTriggersForProductSubQuestion($scope.product_uid, $scope.question_uid, $scope.child_question_uid, subqs_trigger => {
            for(var product_trigger_condition in subqs_trigger) {
                $scope.subqs_trigger = subqs_trigger.knockout_trigger;
                if($scope.subqs_trigger.on===true) {
                    $scope.subqs_trigger.on = "true";
                } else if($scope.subqs_trigger.on===false) {
                    $scope.subqs_trigger.on = "false";
                }

            }
            $scope.NoThresholdTrigger($scope.subqs_trigger.condition);
            DownloadQuestion();
            //$scope.safeApply(fn => fn);
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Save Product Question Threshold */
    $scope.SaveProductQuestionThreshold = function(){
        if(!$scope.trigger) {return}
        if($scope.trigger.on == "true"){
            $scope.trigger.on = true;
            $scope.trigger.condition = '==';
        } else if($scope.trigger.on == "false"){
            $scope.trigger.on = false;
            $scope.trigger.condition = '==';
        }
        if($scope.trigger.on == "no_threshold"){
            $scope.trigger.condition = "no_threshold";
        } else if($scope.trigger.condition == "no_threshold"){
            $scope.trigger.on = "no_threshold";
        }

        if($scope.trigger.condition == "<>"){
          $scope.trigger.on = 0;
        }
        metaService.saveTriggersForProductQuestion($scope.product_uid, $scope.question_uid, $scope.trigger, () => {
            $state.reload()
            $rootScope.genService.showDefaultSuccessMsg('Instant Threshold Saved');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Save Product Sub Question Threshold */
    $scope.SaveProductSubQuestionThreshold = function(){
        if(!$scope.subqs_trigger) {return}
        if($scope.subqs_trigger.on == "true"){
            $scope.subqs_trigger.on = true;
            $scope.subqs_trigger.condition = '==';
        } else if($scope.subqs_trigger.on == "false"){
            $scope.subqs_trigger.on = false;
            $scope.subqs_trigger.condition = '==';
        }
        if($scope.subqs_trigger.on == "no_threshold"){
            $scope.subqs_trigger.condition = "no_threshold";
        } else if($scope.subqs_trigger.condition == "no_threshold"){
            $scope.subqs_trigger.on = "no_threshold";
        }
        metaService.saveTriggersForProductSubQuestion($scope.product_uid, $scope.question_uid, $scope.child_question_uid, $scope.subqs_trigger, () => {
            $state.reload()
            $rootScope.genService.showDefaultSuccessMsg('Instant Threshold Saved');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Condition for no threshold value field */
    $scope.NoThresholdTrigger = function(nothreshold_trigger_condition){
      if(nothreshold_trigger_condition == 'no_threshold'){
        $scope.hide_value = true;
          //$scope.trigger.on = 0;
      } else {
        $scope.hide_value = false;
      }
      $scope.safeApply(fn => fn)
    }


    /*redirect to insurance questions page*/
    $scope.back = function(){
        window.history.back();
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetMetaInformation();
    GetTriggerForProductQuestion();
    GetProductInfo();
    DownloadSubQuestion();

    if($scope.child_question_uid){
        GetTriggerForProductSubQuestion();
    }
}

// Angular Module
angular.module('application').controller('ProductQuestionPickerController', ProductQuestionPickerController);

// Injections
ProductQuestionPickerController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function ProductQuestionPickerController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));


    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////

    $scope.product_uid = $stateParams.product_uid;
    $scope.pre_trigger = $stateParams.pre_trigger === 'true';
    $scope.linkedData = {};
    $scope.isLinked = {};

    /////////////////////////////
    /*        Functions        */
    /////////////////////////////


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

    /* Get All Specific Questions */
    function GetAllInsuranceSpecificQuestions (){
      $rootScope.local_load = true;
      metaService.getAllInsuranceQuestions(function(questions){
        $scope.questions = {};
        for(var key in questions){
          if(!$scope.pre_trigger && questions[key].question_type === 'specific'){
            $scope.questions[key] = questions[key];
          } else if($scope.pre_trigger && questions[key].question_type === 'general'){
            $scope.questions[key] = questions[key];
          }
        }
        $rootScope.local_load = false;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.error(error.message);
        $rootScope.local_load = false;
      });
    }

    /* Get the information about product from firebase */
    GetProductInfo = function(){
        metaService.getSingleProduct($scope.product_uid, productInfo => {
            $scope.nameOfProduct = productInfo.name;
            $scope.isProduct = $scope.product_uid;
            $scope.safeApply(fn => fn)
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message);
        });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
        insuranceQuestionsService.getAllMetaInformation(meta => {
          $scope.meta = {};
          $scope.meta.input_types = meta.input_type_enum;
          $scope.meta.question_types = meta.question_type_enum;
          $scope.meta.account_page_status = meta.account_page_status;
        }, error => {
          console.error(error);
        });
    }

    /* when user cannot find needed question, redirect to add new questions page */
    $scope.addNewQuestions = function(){
        $state.go('questionsearch',{question_type:'specific'});
    }

    /*redirect to insurance questions page*/
    $scope.back = function(){
        $state.go('product', {product_uid:$stateParams.product_uid});
    }

    /* Save Linked Product Question */
    $scope.SaveLinkedProductQuestion = function(){
        if(!$scope.selected_question_key) { return }
        $scope.linkedData.questions = $scope.selected_question_key;
        metaService.saveLinkedProductQuestion($scope.product_uid, $scope.selected_question_key, Number($scope.questions_map_length), () => {
            window.history.back();
            $rootScope.genService.showDefaultSuccessMsg('This question has been linked to the product');
        }, error => {
            console.error(error);
            $rootScope.genService.showDefaultErrorMsg(error.message)
        });
    }

    /* Save As Pretrigger Questions */
    $scope.SaveAsPretriggerQuestion = function(){
      metaService.addPretriggerToQuestion($scope.product_uid, $scope.selected_question_key, () => {
        $rootScope.genService.showDefaultSuccessMsg('Question added to Product')
        $state.reload()
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Save */
    $scope.Save = function(){
      if($scope.pre_trigger === true){
        $scope.SaveAsPretriggerQuestion();
      } else {
        $scope.SaveLinkedProductQuestion();
      }
    }

    /* Check if the question is already linked */
    function GetLinkedProductQuestion(){
      metaService.getLinkedProductQuestion($scope.product_uid, function(linkedProductQuestion){
        for(var linked_product_question in linkedProductQuestion) {
          $scope.isLinked[linked_product_question] = linked_product_question;
        }
        if($scope.isLinked){
          $scope.questions_map_length = parseInt(Object.keys($scope.isLinked).length) + 1
        } else {
          $scope.questions_map_length = 1
        }
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////

    GetAllInsuranceSpecificQuestions();
    GetMetaInformation();
    GetLinkedProductQuestion();
    GetProductInfo();
}

// Angular Module
angular.module('application').controller('ProductsController', ProductsController);

// Injections
ProductsController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService'];

// Function
function ProductsController($rootScope, $scope, $stateParams, $state, $controller, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

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

    /* Add Blank Product */
    $scope.AddBlankProduct = function(){
      metaService.addInsuranceProduct(function(){
        $rootScope.genService.showDefaultSuccessMsg('Product Added - Click to edit');
        $scope.ConfirmAction = null;
        $state.reload();
      }, function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Carriers */
    $scope.GetAllCarriers = function(){
      metaService.getCarriers(function(carriers){
        $scope.carriers = carriers;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        console.error(error);
      });
    }

    /* Get All Products */
    $scope.GetAllProduts = function(){
      $rootScope.local_load = true;
      metaService.getInsuranceProducts(function(products){
        $scope.products = [];
        for(var key in products){
          $scope.products.push({key:key, product:products[key]});;
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Get All Policy Types */
    $scope.GetAllInsuranceTypes = function(){
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types;
        $scope.safeApply(fn => fn);
      },function(error){
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* Add Product */
    $scope.AddNewProduct = function(){
      metaService.addInsuranceProduct(result => {
        $state.go('product', {product_uid:result.key});
        $rootScope.genService.showDefaultSuccessMsg('Product Added');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
      });
    }

    /* On Controller Load */
    $scope.GetAllProduts();
    $scope.GetAllCarriers();
    $scope.GetAllInsuranceTypes();

}

// Angular Module
angular.module('application').controller('QuestionEditController', QuestionEditController);

// Injections
QuestionEditController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'offerService', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function QuestionEditController($rootScope, $scope, $stateParams, $state, $controller, offerService, companyService, insuranceQuestionsService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));




    /////////////////////////////
    /*      Scope Variables    */
    /////////////////////////////
    $scope.question_uid = $stateParams.question_uid;


    /////////////////////////////
    /*        Functions        */
    /////////////////////////////

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

    /* Easy Apply */
    $scope.easyApply = function(){
      $scope.safeApply(fn => fn);
    };

    /* Download Question */
    DownloadQuestion = function(){
      insuranceQuestionsService.getSingleInsuranceQuestion($stateParams.question_uid, question => {
        question.account_page_status = question.account_page_status || 'hide';
        $scope.question = question;
        $scope.safeApply(fn => fn)
      }, error => {
        console.error(error);
      });
    }

    /* Get Meta Information */
    GetMetaInformation = function(){
      insuranceQuestionsService.getAllMetaInformation(meta => {
        $scope.meta = {};
        $scope.meta.input_types = meta.input_type_enum;
        $scope.meta.question_types = meta.question_type_enum;
        $scope.meta.account_page_status = meta.account_page_status;
        $scope.meta.future_dates = meta.future_dates;
      }, error => {
        console.error(error);
      });
    }

    /* Save Question */
    $scope.SaveQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, $scope.question, () => {
        $rootScope.genService.showDefaultSuccessMsg('Saved')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Delete Question */
    $scope.DeleteQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.deleteQuestion($stateParams.question_uid, () => {
        $rootScope.genService.showDefaultSuccessMsg('Deleted')
        $state.go('questionsearch');
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Disable Question */
    $scope.DisableQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, {disabled : true}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Disabled')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Activate Question */
    $scope.ActivateQuestion = function(){
      if(!$scope.question) {return}
      insuranceQuestionsService.updateQuestion($stateParams.question_uid, {disabled : false}, () => {
        $rootScope.genService.showDefaultSuccessMsg('Activated')
        $state.reload();
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message)
      });
    }

    /* Get All Questions */
    $scope.GetAllQuestions = function(){
      $rootScope.local_load = true;
      console.log('Getting Questions..');
      insuranceQuestionsService.getAllInsuranceQuestions(function(questions){
        $scope.questions = []
        for(var key in questions){
          let qt = $stateParams.question_type;
          if(qt === questions[key].question_type || qt === 'all'){
            $scope.questions.push({key:key, question:questions[key]});
          }
        }
        $rootScope.local_load = false;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Remap Insurance Mapping */
    RemapInsuranceMapping = function(mapping, callback){
      $scope.question_mapping = {};
      for(var key in mapping){
        let questions = mapping[key].questions;
        $scope.question_mapping[key] = new Set();
        for(var q_uid in questions){
          $scope.question_mapping[key].add(q_uid)
          for(var c_uid in questions[q_uid].children){
            $scope.question_mapping[key].add(c_uid)
          }
        }
      }
      if(callback){
        console.log('Mapping Updated');
        callback();
      }
    }

    /* Get Question Mapping */
    GetQuestionMapping = function(callback){
      metaService.getAllQuestionMapping(question_mapping => {
        RemapInsuranceMapping(question_mapping, callback);
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
      });
    }

    /* Get all Insurance Types */
    GetInsuranceTypes = function(){
      $rootScope.local_load = true;
      $scope.insurance_types = {};
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types
        $scope.insurance_types['general'] = {name_de : 'General'}
        $scope.insurance_types['confirmatory'] = {name_de : 'Confirmatory'}
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Display Delete Question button */
    $scope.displayDeleteBtn = function(questionmapping_element) {
      for(var element in questionmapping_element){
        if(questionmapping_element[element].has($scope.question_uid)) {
          return true;
        } 
      }
      return false;
    }

    /* Confirm Delete Question if not used anywhere */
    $scope.ConfirmDeleteQuestion = function(){
      console.log('Attempding delete')
      if(!$scope.question) {return}
      GetQuestionMapping(() => {
        for(var question_element in $scope.question_mapping){
          if($scope.question_mapping[question_element].has($scope.question_uid)) {
            console.log('Delete denied')
            return false; // it will simply return false and won't delete the question
          } 
        }
        insuranceQuestionsService.deleteQuestion($stateParams.question_uid, () => {
          $rootScope.genService.showDefaultSuccessMsg('Question Deleted')
          $state.go('questionsearch');
        }, error => {
          console.error(error);
          $rootScope.genService.showDefaultErrorMsg(error.message)
        });
        console.log('Delete Approved')
      });
    }

    /////////////////////////////
    /*         On Load         */
    /////////////////////////////
    GetMetaInformation();
    DownloadQuestion();
    GetQuestionMapping();
    GetInsuranceTypes();
    $scope.GetAllQuestions();
}

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

// Angular Module
angular.module('application').controller('QuestionSearchController', QuestionSearchController);

// Injections
QuestionSearchController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService', 'insuranceQuestionsService', 'metaService'];

// Function
function QuestionSearchController($rootScope, $scope, $stateParams, $state, $controller, companyService, insuranceQuestionsService, metaService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables */
    $scope.question_type = $stateParams.question_type;
    let allowed_types = new Set();
    allowed_types.add('all');
    allowed_types.add('general')
    allowed_types.add('specific')
    allowed_types.add('confirmatory')


    if(!allowed_types.has($stateParams.question_type)){
      $state.go('questionsearch', {question_type:'all'});
    }

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

    /* Get All Questions */
    $scope.GetAllQuestions = function(){
      $rootScope.local_load = true;
      console.log('Getting Questions..');
      insuranceQuestionsService.getAllInsuranceQuestions(function(questions){
        $scope.questions = []
        for(var key in questions){
          let qt = $stateParams.question_type;
          if(qt === questions[key].question_type || qt === 'all'){
            $scope.questions.push({key:key, question:questions[key]});
          }
        }
        $rootScope.local_load = false;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Add New Question */
    $scope.AddNewQuestion = function(){
      insuranceQuestionsService.addNewQuestion( result => {
        $rootScope.genService.showDefaultSuccessMsg('Added');
        $state.go('questioneditor', {question_uid:result.key});
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }


    /* Remap Insurance Mapping */
    RemapInsuranceMapping = function(mapping){
      $scope.question_mapping = {};
      for(var key in mapping){
        let questions = mapping[key].questions;
        $scope.question_mapping[key] = new Set();
        for(var q_uid in questions){
          $scope.question_mapping[key].add(q_uid)
          for(var c_uid in questions[q_uid].children){
            $scope.question_mapping[key].add(c_uid)
          }
        }
      }
    }

    /* Get Question Mapping */
    GetQuestionMapping = function(){
      metaService.getAllQuestionMapping(question_mapping => {
        RemapInsuranceMapping(question_mapping);
        $scope.safeApply(fn => fn);
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurancequestionmapping','error',()=>{},()=>{})
      });
    }

    /* Get all Insurance Types */
    GetInsuranceTypes = function(){
      $rootScope.local_load = true;
      $scope.insurance_types = {};
      metaService.getInsuranceTypes(function(insurance_types){
        $scope.insurance_types = insurance_types
        $scope.insurance_types['general'] = {name_de : 'General'}
        $scope.insurance_types['confirmatory'] = {name_de : 'Confirmatory'}
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn);
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'activityquestion','error',()=>{},()=>{})
        console.error(error);
      });
    }

    /* Call On Controller Load */
    $scope.GetAllQuestions();
    GetQuestionMapping();
    GetInsuranceTypes();
}

// Angular Module
angular.module('application').controller('RecommendationController', RecommendationController);

// Injections
RecommendationController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'firebase', 'FileUploader', 'fileService', 'recommendationService', 'FoundationApi'];

// Function
function RecommendationController($rootScope, $scope, $stateParams, $state, $controller, firebase, FileUploader, fileService, recommendationService, FoundationApi) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* Scope Variables  */
  	$scope.recommendations = {}
  	$scope.notempty = false;
  	$scope.selected_recommendation;

  	/* Get My Policies */
  	$scope.GeyMyRecommendations = function(forms){
  		console.log('Getting Recommendations');

  		var active = [];
  		var pending = [];
  		
      policyService.getPolicies(function(policySet){
  			for(var key in policySet){
  				var tmpPolicy = policySet[key];
  				var status = tmpPolicy.status.toLowerCase();
  				if(status === 'active'){
  					active.push(tmpPolicy);
  				} else if(status === 'pending'){
  					pending.push(tmpPolicy);
  				} else {
  					pending.push(tmpPolicy);
  				}
  			}
  			$scope.policies.active = active;
  			$scope.policies.pending = pending;
  			$scope.notempty = (pending.length+active.length > 0);
  			$scope.$apply();
  		},function(){

  		});
  	}

  	/* Select Policy */
  	$scope.SelectRecommendation = function(recommendation){
  		console.info("Policy Selected: ",recommendation);
  		$scope.selected_recommendation = recommendation;
  	}


    /* Call these functions on controller load */

} 

// Angular Module
angular.module('application').controller('SearchController', SearchController);

// Injections
SearchController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService'];

// Function
function SearchController($rootScope, $scope, $stateParams, $state, $controller, companyService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    // Scope Models
    $scope.companies = []
    $scope.company_keys = {};

    /* Get All Users */
    $scope.GetAllCompanies = function(){
      $scope.companies = [];
      $scope.company_keys = {};
      $rootScope.local_load = true;

      console.log('Getting Companies..');
      companyService.getAllCompanies(function(companies){
        for(var key in companies){
          $scope.companies.push(companies[key]);
          $scope.company_keys[companies[key].liimex_id] = key;
        }
        $rootScope.local_load = null;
        $scope.$apply();
      }, function(error){
        $rootScope.genService.showDefaultErrorMsg('Couldn\'t load desired data');
        console.log(error.message);
      });
    }

    /* Select User */
    $scope.SelectCompany = function(key, company){
      console.log('Selecting Company:',key, company);
    }

    /* Call On Controller Load */
    $scope.GetAllCompanies();
}

// Angular Module
angular.module('application').controller('SelectIndustryController', SelectIndustryController);

// Injections
SelectIndustryController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller','userrequestService','metaService','companyService'];

// Function
function SelectIndustryController($rootScope, $scope, $stateParams, $state, $controller, userrequestService,metaService, companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* local variables */
    let company_id = $stateParams.company_id;
    let companyid = "";

    /* scope variables */
    $scope.picked_levels = {};
    $scope.picked_levels[1] = {};
    $scope.picked_levels[2] = {};
    $scope.picked_levels[3] = {};
    $scope.industry_set = new Set();
    $scope.cat_limit = 1;
    $scope.chosen = {};

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

    /* Get Industries */
    getIndustries = function(){
        $rootScope.local_load = true;
        metaService.getIndustryCodes(codes => {
            $scope.industries = [];
            $scope.top_levels = {};
            for(var key in codes){
                if(codes[key].level == 1){
                    $scope.top_levels[codes[key].code] = codes[key];
            }
            }
            for(var key in codes){
                $scope.industry_set.add(codes[key].code);
                var parentIndustryCode = String(codes[key].code).split('.')[0];;
                $scope.industries.push({key:key, code:codes[key], parent:$scope.top_levels[parentIndustryCode]});
            }
            getSelectedIndustries();
            $scope.safeApply(f=>f);
        }, error => {
            console.error(error);
            $rootScope.local_load = null;
        });
    }

    /* Refresh Model */
    $scope.RefreshModel = function(cat_num, models){
        for(var i in models){
            if($scope.picked_levels[cat_num][models[i]]){
                $scope.picked_levels[cat_num][models[i]] = null;
            }
        }
        $scope.unsaved = true;
        $scope.safeApply(fn => fn);
    }

    /* Submit Categories */
    $scope.submitIndustries = function(){
        $rootScope.local_load = true;
        if(!$scope.picked_levels[1][1]) return;
        cleanLevels();
        var industry_codes = [];
            outer_loop:
            for(var level in $scope.picked_levels){
                if(!$scope.picked_levels[level][1]){
                    continue outer_loop;
                }
                for(var cat = 4; cat>0; cat--){
                    if($scope.picked_levels[level][cat]){
                        industry_codes.push($scope.picked_levels[level][cat])
                        continue outer_loop;
                    }
                }
            }
        userrequestService.updateIndustryCodes(companyid, industry_codes, (data) => {
           console.log("Industry Codes Updated")
           $rootScope.genService.showDefaultSuccessMsg('Industry Codes Updated');
           $rootScope.local_load = null;
           $state.reload()
        }, error => {
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
            backofficeService.logpost(error,'','industry','error',()=>{},()=>{});
        });
    }

    /*Get industries if it's already previously selected*/
    function getSelectedIndustries(){
      $rootScope.local_load = true;
      companyService.getCompanyInformation($stateParams.company_id, company => {
        companyid = $stateParams.company_id;
        $scope.company = company;
        if(company.industry_codes){
          $scope.cat_limit = company.industry_codes.length;
          for(var i=1;i<=$scope.cat_limit;i++){
            var industry = getIndustryObjForIndustryCode(company.industry_codes[i-1]);
            if(!industry){
              $scope.outdated_indstries = true;
              $rootScope.local_load = null;
              $scope.safeApply(fn => fn)
              return;
            }
            $scope.chosen[i] = industry.code.code;
          }
          $scope.RebuildIndustries(company.industry_codes)
        }
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      }, error => {
        console.error(error);
        $rootScope.local_load = null;
        $scope.safeApply(fn => fn)
      })
    }

    $scope.RebuildIndustries = function(industryCodesList){
        for(var i in industryCodesList){
            var code = industryCodesList[i];
            var split = code.split('.');
            var next = "";
            for(var number in split){
                next += next === "" ? split[number] : '.'+split[number]
                $scope.picked_levels[Number(i)+1][Number(number)+1] = next;
            }
        }
    }

    function getIndustryObjForIndustryCode(code){
        return $scope.industries.find(industry=> industry.code.code == code);
    }

    /* Remove Cat*/
    $scope.RemoveCat = function(){
        $scope.cat_limit = $scope.cat_limit-1;
        $scope.picked_levels[$scope.cat_limit+1] = null;
        $scope.unsaved = true;
    }

    function cleanLevels(){
        for(var level in $scope.picked_levels){
            if(level > $scope.cat_limit){
                $scope.picked_levels[level] = {};
            }
        }
    }

    $scope.pickActivity = function(){
        $state.go("pickactivity",{"company_id": $stateParams.company_id});
    }

    getIndustries();

}

// Angular Module
angular.module('application').controller('UpdateaddressController', UpdateaddressController);

// Injections
UpdateaddressController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'companyService'];

// Function
function UpdateaddressController($rootScope, $scope, $stateParams, $state, $controller,companyService) {
    angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* local variables */
    $scope.company_id = $stateParams.company_id;
    $scope.addresses =[];

    $scope.safeApply = function(fn) {
        if(!this.$root){
            return;
        }
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    function getCompanyAddress(){
        $rootScope.local_load = true;
        companyService.getCompanyAddress($scope.company_id,addresses=>{
            $rootScope.local_load = null;
            for(addressKey in addresses){
                if(addresses[addressKey].main === true){
                    $scope.main_address = addresses[addressKey];
                    $scope.main_address_key = addressKey;
                } else {
                    $scope.addresses.push(addresses[addressKey]);
                }
            }
            $scope.safeApply(fn => fn)
        },error=>{
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
        });
    }

    $scope.saveAddress = function(){
        $rootScope.local_load = true;
        companyService.updateAddress($scope.main_address_key,$scope.main_address,()=>{
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultSuccessMsg('Address updated!');
            $state.go("company",{company:$scope.company_id});
        });
    }


    function getCompanyDetails(){
        companyService.getCompanyInformation($scope.company_id,company=>{
            $rootScope.local_load = null;
            $scope.company = company;
            $scope.safeApply(fn => fn)
        },error=>{
            console.error(error);
            $rootScope.local_load = null;
            $rootScope.genService.showDefaultErrorMsg(error.code);
        });
    }

    getCompanyAddress();
    getCompanyDetails();

}

// Angular Module
angular.module('application').controller('UsertempController', UsertempController);

// Injections
UsertempController.$inject = ['$rootScope','$scope', '$stateParams', '$state', '$controller', 'metaService', 'FileUploader', 'backofficeService'];

// Function
function UsertempController($rootScope, $scope, $stateParams, $state, $controller, metaService, FileUploader, backofficeService) {
  	angular.extend(this, $controller('DefaultController', {$scope: $scope, $stateParams: $stateParams, $state: $state}));

    /* scope variables */
  $scope.industry_weights = {};
  /* local variables */
  let recommendationMapping;

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


  /* Get Insurance Type */
  $scope.GetInsuranceType = function(){
    $rootScope.local_load = true;
    console.log('Getting Insurance Type..');
    metaService.getSingleInsuranceType($stateParams.insurancetype, function(insurance_type){
      $rootScope.local_load = null;
      $scope.insurance_type = insurance_type;
      $scope.$apply();
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Save Insurance Type */
  $scope.SaveInsuranceType = function(){
    $rootScope.local_load = true;
    saveRecommendationScore();
    metaService.saveInsuranceType($stateParams.insurancetype, $scope.insurance_type, function(){
      backofficeService.logpost({msg:'insurance type saved',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $rootScope.genService.showDefaultSuccessMsg('Saved');
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  // Disable
  $scope.DisableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.disableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Disabled');
      backofficeService.logpost({msg:'insurance type disabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Remove Code From Insurance Type */
  $scope.RemoveIndustryFromInsuranceType = function(key){
    if(!key) {
      return;
    }
    delete $scope.industry_weights[key];
    $scope.safeApply(fn => fn);
  }

  /* Add Industry To Insurance Type */
  $scope.AddIndustryToInsuranceType = function(score, key){
    if(score === null || !key) {
      return;
    }
    $scope.industry_weights[key] = {score:score}
    $scope.safeApply(fn => fn);
  }

  // Enable
  $scope.EnableInsuranceType = function(){
    $rootScope.local_load = true;
    metaService.enableInsuranceType($stateParams.insurancetype, function(){
      $rootScope.local_load = null;
      $rootScope.genService.showDefaultSuccessMsg('Enabled');
      backofficeService.logpost({msg:'insurance type enabled',insurance_type:$stateParams.insurance_type},$rootScope.user.email,'insurancetype','info',()=>{},()=>{})
      $state.reload();
    }, function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
      backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
    });
  }

  /* Get All Codes */
  $scope.GetAllCodes = function(){
    $rootScope.local_load = true;
    $scope.codes = [];
    metaService.getIndustryCodes(function(codes){
      $scope.codes_dict = codes;
      for(var key in codes){
        $scope.codes.push({key:key, code:codes[key]});;
      }
      $rootScope.local_load = null;
      $scope.safeApply(fn => fn)
    },function(error){
      console.error(error);
      $rootScope.genService.showDefaultErrorMsg(error.message);
    });
  }

  /* check if all recommendations objs are fetched and set the activity score on the ui once fetched*/
  function getRecommendationMappingAndSetIndustryScores(){
    if(!recommendationMapping){
      getRecommendationMapping(()=>{
        setIndustryScore();
      });
    }
    else{
      setIndustryScore();
    }
  }

  /* gets the insurance recommendation_mapping table*/
  function getRecommendationMapping(callback, err_call){
    $rootScope.local_load = true;
    let currentInsuraceType = $stateParams.insurancetype;
    metaService.getAllRecommendationMapping(_recommendationMapping =>{
      if(_recommendationMapping.insurance_types
      && _recommendationMapping.insurance_types[currentInsuraceType]
      && _recommendationMapping.insurance_types[currentInsuraceType].industry_weights){
        recommendationMapping = _recommendationMapping.insurance_types[currentInsuraceType];
      }
      if(callback) {
        callback();
      }
    }, error => {
        console.log("error while fetching recommendation", error);
        if(err_call) err_call();
      });
    }

    /* Set activity score on the ui */
    function setIndustryScore(){
      if(!recommendationMapping){
        return
      }
      for(var index in recommendationMapping.industry_weights){
        $scope.industry_weights[index] = {score:recommendationMapping.industry_weights[index].score};
      }
      $scope.safeApply(fn => fn);
    }

    /* Save the activity score */
    function saveRecommendationScore(){
      let currentInsuraceType = $stateParams.insurancetype;
      let data = {industry_weights: $scope.industry_weights};
      metaService.saveIndustryRecommendationScore(currentInsuraceType,data,()=>{
        console.log("successfully saved Industry weight")
      }, error => {
        console.error(error);
        $rootScope.genService.showDefaultErrorMsg(error.message);
        backofficeService.logpost(error,$rootScope.user.email,'insurance_type','error',()=>{},()=>{})
      });
    }

    /* On Controller Load */
    $scope.GetInsuranceType();
    $scope.GetAllCodes();
    getRecommendationMappingAndSetIndustryScores();
  }

angular.module('application').filter('capitalize', function() {
  return function(input = '') {
    return input.charAt(0).toUpperCase() + input.slice(1);
  };
});

angular.module('application').filter('commaToDecimal', [
function() {
    return function(input) {
    var ret=(input)?input.toString().trim().replace(",","."):null;
        return parseFloat(ret);
    };
}]);

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

/*
* This Directive is called using format-date
* and is used to format the date types from Strings into Date Objects
*/
angular.module('application').directive("formatDate", function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attr, modelCtrl) {
            modelCtrl.$formatters.push(function(modelValue) {
                if (modelValue){
                    return new Date(modelValue);
                }
                else {
                    return null;
                }
            });
        }
    };
});

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

/*
* This Directive is called using convert-to-number
* and is used to conver string to int type
*/
angular.module('application').directive("lmxInlineDatepicker", function($timeout, $document) {
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    return {
        link: {
            post: function (scope, element, attr) {

                function startEditing() {
                    if (scope.disabled) return;
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('input').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.finishEditing();
                    });
                    $document.bind('keydown', event => {
                        if (event.which === ENTER_KEY) {
                            scope.finishEditing();
                        }
                        if (event.which === ESCAPE_KEY) {
                            scope.finishEditing(true);
                        }
                    });
                }


                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    startEditing();
                });

                element.find('.focus-catcher').focus(event =>{
                    startEditing();
                });

                element.find('input').on('focusout', event => {
                    scope.finishEditing();
                });
            }
        },
        controller: ['$scope', function LmxInlineDatepickerController($scope){
            $scope.initialValue = $scope.value;

            $scope.startProcessing = function() {
                $scope.processing = true;
            };

            $scope.endProcessing = function(err, updatedValue) {
                $scope.processing = false;
                if (err) {
                    $scope.value = $scope.initialValue;
                    return;
                }
                $scope.initialValue = updatedValue || $scope.value;
            };

            $scope.safeApply = function(fn) {
                if(!this.$root){
                    return;
                }
                const phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            $scope.finishEditing = function(suppressed) {
                $document.unbind('mouseup');
                $document.unbind('keydown');
                $scope.mode = 'view';
                $scope.safeApply();

                if ($scope.initialValue === $scope.value) {
                    return;
                }

                if (suppressed) {
                    $scope.value = $scope.initialValue;
                    return;
                }

                if (typeof $scope.onChange === 'function' && !suppressed) {
                    $scope.startProcessing();
                    $scope.onChange($scope.identity, $scope.value, $scope.endProcessing);
                }
            };
        }],
        restrict: 'E',
        scope: {
            value: '=',
            disabled: '=',
            identity: '=',
            onChange: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_datepicker.html'
    };
});

/*
* This Directive is called using convert-to-number
* and is used to conver string to int type
*/
angular.module('application').directive("lmxInlineDropdown", function($timeout, $document) {
    return {
        link: {
            pre: function(scope, elem, attr) {
                const property = String(attr.property).slice(1, -1);
                const value = property ? 'value.' + property : 'value';
                scope.expression = 'key as ' + value + ' for (key, value) in options';
            },
            post: function (scope, element, attr) {

                function startEditing() {
                    if (scope.disabled) return;
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('select').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.select();
                    });
                }

                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    startEditing();
                });

                element.find('.focus-catcher').focus(event =>{
                    startEditing()
                });

                element.find('select').on('blur', event => {
                    scope.select();
                });
            }
        },
        controller: ['$scope', function LmxInlineDropdownController($scope){
            $scope.initialValue = $scope.value;

            $scope.startProcessing = function() {
                $scope.processing = true;
            };

            $scope.endProcessing = function(err, updatedValue) {
                $scope.processing = false;
                if (err) {
                    $scope.value = $scope.initialValue;
                    return;
                }
                $scope.initialValue = updatedValue || $scope.value;
            };

            $scope.safeApply = function(fn) {
                if(!this.$root){
                    return;
                }
                const phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                }
                } else {
                    this.$apply(fn);
                }
            };

           $scope.select = function() {
               $document.unbind('mouseup');
               $document.unbind('keydown');
               $scope.mode = 'view';
               $scope.safeApply();


               if ($scope.initialValue === $scope.selected) {
                   return;
               }

               if (typeof $scope.onChange === 'function') {
                   $scope.startProcessing();
                   $scope.onChange($scope.identity, $scope.selected, $scope.endProcessing);
               }
           };
        }],
        restrict: 'E',
        scope: {
            selected: '=',
            options: '=',
            disabled: '=',
            property: '=',
            identity: '=',
            onChange: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_dropdown.html'
    };
});

angular.module('application').directive("lmxInlineHtml", function($timeout, $document) {
    const WARNING_CLASS = 'warning-class';
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    return {
        link: {
            post: function (scope, element, attr) {

                function toggleEditing() {
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('input').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.select();
                    });

                    $document.bind('keydown', event => {
                        if (event.which === ENTER_KEY) {
                            scope.select();
                        }
                        if (event.which === ESCAPE_KEY) {
                            scope.select(true);
                        }
                    });
                }

                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    toggleEditing()
                });

                element.find('.focus-catcher').focus(event =>{
                    toggleEditing()
                });

                element.find('input').on('focusout', event => {
                    scope.select();
                });
            }
        },
        controller: ['$scope', function LmxInlineDropdownController($scope){
            $scope.initialValue = $scope.value;

            $scope.startProcessing = function() {
                $scope.processing = true;
            };

            $scope.endProcessing = function(err, updatedValue) {
                $scope.processing = false;
                if (err) {
                    $scope.value = $scope.initialValue;
                    return;
                }
                $scope.initialValue = updatedValue || $scope.value;
            };

            $scope.safeApply = function(fn) {
                if(!this.$root){
                    return;
                }
                const phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            $scope.select = function(suppressed) {
                $document.unbind('mouseup');
                $document.unbind('keydown');
                $scope.mode = 'view';
                $scope.safeApply();

                if ($scope.initialValue === $scope.value) {
                    return;
                }

                if (suppressed) {
                    $scope.value = $scope.initialValue;
                    return;
                }

                if (typeof $scope.onChange === 'function') {
                    $scope.startProcessing();
                    $scope.onChange($scope.identity, $scope.value, $scope.endProcessing);
                }
            };
        }],
        restrict: 'E',
        scope: {
            value: '=',
            identity: '=',
            onChange: '=',
            applyFilter: '=',
            applyValidation: '=',
            placeholder: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_input.html'
    };
});

angular.module('application').config(['dynamicNumberStrategyProvider', function(dynamicNumberStrategyProvider){
    dynamicNumberStrategyProvider.addStrategy('euro', {
        numInt: 8,
        numFract: 2,
        numSep: ',',
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numPrepend: '€'
    });
    dynamicNumberStrategyProvider.addStrategy('percent', {
        numInt: 8,
        numFract: 2,
        numSep: ',',
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numAppend: '%'
    });
    dynamicNumberStrategyProvider.addStrategy('multiply', {
        numInt: 8,
        numFract: 0,
        numPos: true,
        numNeg: false,
        numRound: 'round',
        numThousand: true,
        numPrepend: '×'
    });
}]);

angular.module('application').directive("lmxInlineInput", function($timeout, $document, $rootScope) {
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    const DEFAULT_CAPTION = 'Double click to edit';
    return {
        link: {
            post: function (scope, element, attr) {

                function startEditing() {
                    if (scope.disabled || scope.unclickable) return;
                    $rootScope.inline_editing = true;
                    scope.$apply(() => {
                        scope.mode = scope.mode === 'edit' ? 'view' : 'edit';
                        if (scope.mode === 'edit') {
                            $timeout(() => {
                                element.find('input').focus();
                            });
                        }
                    });
                    $document.bind('mouseup', () => {
                        scope.finishEditing();
                    });

                    $document.bind('keydown', event => {
                       if (event.which === ENTER_KEY) {
                           scope.finishEditing();
                       }
                       if (event.which === ESCAPE_KEY) {
                           scope.finishEditing(true);
                       }
                    });
                }

                element.on('mouseup', event => {
                    if (scope.mode === 'edit') {
                        event.stopPropagation();
                    }
                });

                element.on('dblclick', event => {
                    event.stopPropagation();
                    startEditing()
                });

                element.on('click', event => {
                   // if (scope.mode !== 'edit' && $rootScope.inline_editing === true)
                });

                element.find('.focus-catcher').focus(event =>{
                    startEditing()
                });

                element.find('input').on('focusout', event => {
                    scope.finishEditing();
                });
            }
        },
        controller: ['$scope', function LmxInlineInputController($scope){
            $scope.initialValue = $scope.value;

            $scope.safeApply = function(fn) {
                if(!this.$root){
                    return;
                }
                const phase = this.$root.$$phase;
                if (phase === '$apply' || phase === '$digest') {
                    if (fn && typeof fn === 'function') {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            $scope.startProcessing = function() {
                $scope.processing = true;
            };

            $scope.endProcessing = function(err, updatedValue) {
                $scope.processing = false;
                if (err) {
                  $scope.value = $scope.initialValue;
                  return;
                }
                $scope.initialValue = updatedValue || $scope.value;
            };

            $scope.finishEditing = function(suppressed) {
                $document.unbind('mouseup');
                $document.unbind('keydown');
                $scope.mode = 'view';
                $scope.safeApply();

                if ($scope.initialValue === $scope.value) {
                    return;
                }

                if (suppressed) {
                    $scope.value = $scope.initialValue;
                    return;
                }

                if (typeof $scope.onChange === 'function') {
                    $scope.startProcessing();
                    $scope.onChange($scope.identity, $scope.value, $scope.endProcessing);
                }
            };

            $scope.getCaption = function() {
                if ($scope.value == null) return $scope.emptyCaption || DEFAULT_CAPTION;
                return $scope.value;
            };

            $scope.rightIconClick = function() {
                if (typeof $scope.onRightIcon === 'function') {
                    $scope.startProcessing();
                    $scope.onRightIcon($scope.identity, $scope.value, $scope.rightKey, () => {
                        $scope.processing = false;
                    })
                }
            };
        }],
        restrict: 'E',
        scope: {
            value: '=',
            identity: '=',
            disabled: '=',
            unclickable: '=',
            onChange: '=',
            emptyCaption: '=',
            applyFilter: '=',
            applyValidation: '=',
            placeholder: '=',
            onRightIcon: '=',
            rightCaption: '=',
            rightFa: '=',
            rightKey: '='
        },
        templateUrl: 'partials/lmx_directives/lmx_inline_input.html'
    };
});

angular.module('application').filter('meta', function($interpolate) {
    return function(item, filter_name){
        if (!filter_name) {
            return item;
        }
        const result = $interpolate('{{value | ' + filter_name + '}}');
        return result({value: item});
    };
});

angular.module('application').filter('multiply', function() {
    return function(input = 0) {
        const amount = Number(input);
        if (isNaN(amount)) return input;
        return '×' + amount;
    };
});

angular.module('application').filter('percent', function() {
    return function(input = 0) {
        const amount = Number(input);
        if (isNaN(amount)) return input;
        return amount + '%';
    };
});

angular.module('application').filter('range', function() {
  return function(input, total) {
    total = parseInt(total);
    for (var i=0; i<total; i++) {
      input.push(i);
    }
    return input;
  };
});


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

(function() {

    'use strict';

    angular.module('application').
    service('accessService', accessService);

    accessService.$inject = ['$rootScope'];

    /* Access Map */
    const access_map = {};
    access_map[0] = [];
    access_map[1] = [
      'search',
      'advisory',
      'addusers',
      'openlocks'
    ];
    access_map[2] = [
      'search',
      'advisory',
      'addusers',
      'openlocks'
    ];
    access_map[3] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'openlocks'
    ];
    access_map[4] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'demand',
      'questions',
      'openlocks'
    ];
    access_map[5] = [
      'search',
      'advisory',
      'addusers',
      'product',
      'carriers',
      'demand',
      'questions',
      'admin',
      'openlocks'
    ];

    /* Main Function */
    function accessService($rootScope) {

      // Set Access rights
      function setAccessRights(level){
        if (level && access_map[level]) {
          $rootScope.access = new Set(access_map[level]);
        }
      }

      /* Return Stuff */
      return {
        setAccessRights : setAccessRights
      }

    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('activityService', activityService);

    activityService.$inject = ['$rootScope', 'firebase', '$firebaseObject'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoing(company_uid){
        return firebase.database().ref().child('activities/'+company_uid);
    }

    function activityService($rootScope, firebase, $firebaseObject) {

        /* Get Activities */
        function getActivities(callback, err){
            var activitiesRef = getSpecificEndpoing($rootScope.user.company);
            activitiesRef.once('value').then(function(snapshot) {
                var policies = snapshot.val()
                callback(policies);
            });
        }

        /* Log Activity */
        function logActivity(activity){
            var activitiesRef = getSpecificEndpoing($rootScope.user.company);
            const activityRef = activitiesRef.push( activity ).then(function(){

            });
        }

        /* Return Stuff */
        return {
            logActivity : logActivity,
            getActivities : getActivities
        }

    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('authService', authService);

    authService.$inject = ['$rootScope','$firebaseAuth','$state'];

    function authService($rootScope, $firebaseAuth, $state) {

        /* On Auth State Changed */
        $firebaseAuth().$onAuthStateChanged(function(firebaseUser) {
            if(firebaseUser){
                console.log("Authentication Approved");
            } else{
                console.log("Authentication Denied");
                $state.reload();
            }
           //$state.reload();
        });

        /* Update Local Storage */
        // function updateLocalStorage(){
        //     uid = localStorage.getItem('uid') || undefined;
        // }

        /* Login */
        function login(credentials, success, err_call) {
            $firebaseAuth().$signInWithEmailAndPassword(credentials.email, credentials.password).then(function(firebaseUser) {
                console.log("Signed in as:", firebaseUser.uid);
                success(firebaseUser);
            }).catch(function(error) {
                err_call(error);
                console.error("Authentication failed:", error);
            });
        }

        /* Change Email */
        function changeEmail(user_obj, new_email, callback, err_call){
            user_obj.updateEmail(new_email).then(function(){
                callback();
            }, function(error){
                console.error('Email Change Failed',error);
                err_call(error);
            });
        }

        /* Logout */
        function logout(success, err_call) {
            $firebaseAuth().$signOut().then(function() {
                $rootScope = null;
                $state.reload();
                success();
            }, function(error) {
                err_call(error);
                console.log("Error: ", error);
            });
        }

        /* Create User */
        function createUser(params, success, err_call){
            $firebaseAuth().$createUserWithEmailAndPassword(params.email, params.password).then(function(firebaseUser) {
                console.log("AuthUser: " + firebaseUser.uid + " created successfully!");
                success(firebaseUser);
            }).catch(function(error) {
                err_call(error);
                console.error("Error: ", error);
            });
        }

        /* Reset Password */
        function resetPassword(user_data, success, err_call){
            $firebaseAuth().$sendPasswordResetEmail(user_data.email).then(function() {
              console.log('password reset requested');
              success();
            }, function(error) {
              console.log('cant reset password', error);
              err_call();
            });
            $state.reload();
        }

        /* Get User */
        function getCurrentUser(callback){
            var firebaseUser = $firebaseAuth().$getAuth();
            if (firebaseUser) {
                callback(firebaseUser);
            } else {
              callback(null);
            }
        }

        /* Delte User */
        function deleteUser(success, err_call){
          getCurrentUser(function(authObj){
            authObj.delete().then(function() {
              success();
            }, function(error) {
              err_call(error);
            });
          });
        }

        /* Return Stuff */
        return {
            getCurrentUser : getCurrentUser,
            createUser: createUser,
            resetPassword: resetPassword,
            login: login,
            logout: logout,
            changeEmail: changeEmail,
            deleteUser : deleteUser
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('backofficeService', backofficeService);

    backofficeService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService' ];

    /* Endpoints */
    const logendpoint = '/api/log';
    const emailcheckendpoint = '/api/email/';

    const API_INIT_MANDATE = '/api/company/:company_uid/mandate/init';

    function backofficeService($rootScope, firebase, $firebaseObject, requestService) {

        /* Post Log */
        function logpost(logs_object, user, program, level, callback, err_call){
          var params = {logs_object:logs_object, user:user, program:program, level:level, source:'backoffice'};
          requestService.postLiimexResourceWithParams($rootScope.backoffice_url+logendpoint, params, callback, err_call);
        }

        /* Check Email */
        function emailcheckpost(email, callback, err_call){
          var params = {email:email};
          requestService.postLiimexResourceWithParams($rootScope.backoffice_url+emailcheckendpoint, params, callback, err_call);
        }

        function initMandate(company_uid, callback, err_call) {
            const request_url = $rootScope.backoffice_url + API_INIT_MANDATE.replace(':company_uid', company_uid);
            requestService.postLiimexResourceWithParams(request_url, {}, callback, err_call);
        }

        /* Return Stuff */
        return {
            logpost,
            emailcheckpost,
            initMandate
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('claimService', claimService);

    claimService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoint(company_uid){
        return firebase.database().ref().child('claims/'+company_uid);
    }

    function claimService($rootScope, firebase, $firebaseObject, activityService) {


        /* Get Claims */
        function getClaims(company_uid, callback, err){
            var claimsRef = getSpecificEndpoint(company_uid);
            claimsRef.once('value').then(function(snapshot) {
                var claims = snapshot.val()
                callback(claims);
            }, function(error){
              err(error);
            });
        }

        /* Make New Claim */
        function makeNewClaim(claim, success, err){
            var claimsRef = getSpecificEndpoint($rootScope.user.company);
            claim.timestamp = $rootScope.genService.getTimestamp();
            claim.status = 'pending';
            const claimRef = claimsRef.push(claim).then(function(){
                success();
                activityService.logActivity({
                    activity: 'You made a claim',
                    next: 'Waiting for review',
                    timestamp: $rootScope.genService.getTimestamp()
                });
            }, function(error){
                err()
            });
        }

        /* Return Stuff */
        return {
            makeNewClaim: makeNewClaim,
            getClaims: getClaims
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('companyService', companyService);

    companyService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'finfoService', 'requestService'];

    /* Endpoints */
    const company_prefix = 'companies';
    const address_prefix = 'addresses';

    function companyService($rootScope, firebase, $firebaseObject, finfoService, requestService) {

        /* Get Company Info */
        function getCompanyInformation(company_uid, callback, err_call){
          requestService.getDataOnce([company_prefix, company_uid], callback, err_call);
        }

        /* Get All Companies */
        function getAllCompanies(callback, err_call){
          requestService.getDataOnce([company_prefix], callback, err_call);
        }

        /* Get Company Address */
        function getCompanyAddress(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([address_prefix],'company', company_uid, callback, err_call);
        }

        /* Update Company Information */
        function updateCompanyInformation(company_uid, params, callback, err_call){
          params.uid = null;
          requestService.updateData([company_prefix, company_uid], params, callback, err_call);
        }

        /* Update Address */
        function updateAddress(address_uid, params, callback, err_call){
          requestService.updateData([address_prefix, address_uid], params, callback, err_call);
        }

        /* Mark Company Blocked */
        function blockCompany(company_uid, callback, err_call){
          var data = {
            disabled : true
          }
          requestService.updateData([company_prefix, company_uid], data, callback, err_call);
        }

        /* Mark Company Unblocked */
        function unblockCompany(company_uid, callback, err_call){
          var data = {
            disabled : false
          }
          requestService.updateData([company_prefix, company_uid], data, callback, err_call);
        }

        /* Return Stuff */
        return {
            getCompanyInformation: getCompanyInformation,
            getCompanyAddress : getCompanyAddress,
            updateCompanyInformation : updateCompanyInformation,
            updateAddress : updateAddress,
            getAllCompanies : getAllCompanies,
            blockCompany : blockCompany,
            unblockCompany  : unblockCompany
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('documentService', documentService);

    documentService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'requestService', 'fileService'];

    /* Endpoints */
    const document_prefix = 'documents';
    const mandate_suffix = 'mandates';
    const policy_suffix = 'policies';
    const generic_suffix = 'generics'

    /* Model */
    let model = {}

    /* Service Function */
    function documentService($rootScope, firebase, $firebaseObject, requestService, fileService) {

      /* Upload Files */
      function uploadPolicies(file, company_uid, callback, err_call){
        fileService.uploadFileWithCustomEndpoint([document_prefix, company_uid], "", file, callback, err_call);
      }

      /* Upload File */
      function uploadFile(file, company_uid, callback, err_call){
        fileService.uploadFileWithCustomEndpoint([document_prefix, company_uid], "", file, callback, err_call);
      }


      /* Download Document */
      function downloadDocument(file_url, company_uid, callback, err_call){
        fileService.downloadFileWithCustomEndpoint([document_prefix, company_uid], file_url, callback, err_call);
      }

      /* Create Document */
      function createDocuments(file_url, company_uid, callback, err_call){
        let document_keys = []
        document_keys.push({ name:'document', route:[document_prefix, policy_suffix]})
        requestService.getMultipleKeys(document_keys, keys => {
          var newUpdate = {}, now = requestService.getTimestamp();
          for(var elem in keys){
            newUpdate[keys[elem].route+keys[elem].key] = {
              file:file_url, created_at:now, updated_at:now, company:company_uid
            };
          }
          callback(newUpdate, keys);
        });
      }

      /* Create Generic Document */
      function createGenericDocument(file_url, company_uid, callback, err_call){
        let document_keys = []
        document_keys.push({ name:'document', route:[document_prefix, generic_suffix]})
        requestService.getMultipleKeys(document_keys, keys => {
          var newUpdate = {}, now = requestService.getTimestamp();
          for(var elem in keys){
            newUpdate[keys[elem].route+keys[elem].key] = {
              file:file_url, created_at:now, updated_at:now, company:company_uid
            };
          }
          callback(newUpdate, keys);
        });
      }

      /* Get Document */
      function getDocument(route, key, callback, err_call){
        requestService.getDataOnce((route+key).split('/'), callback, err_call);
      }

      /* Save Document */
      function saveDocument(route, key, newData, callback, err_call){
        requestService.updateData((route+key).split('/'), newData, callback, err_call);
      }

      /* Get and Store Mandate */
      function getAndStoreMandate(key, callback, err_call){
        if(model[key]){
          console.log('Returning mandate');
          callback(model[key]);
          return;
        }
        requestService.on_child_value([document_prefix, mandate_suffix, key], document => {
          console.log('Updating mandate');
          model[key] = document;
          callback(model[key]);
        }, error => {
          err_call(error);
        });
      }

      /* Return Stuff */
      return {
        getAndStoreMandate : getAndStoreMandate,
        uploadPolicies : uploadPolicies,
        createDocuments : createDocuments,
        getDocument : getDocument,
        downloadDocument : downloadDocument,
        saveDocument : saveDocument,
        uploadFile : uploadFile,
        createGenericDocument : createGenericDocument
      }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('extractionService', extractionService);

    extractionService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','companyService','requestService','metaService'];

    /* Main Service */
    function extractionService($rootScope, firebase, $firebaseObject, activityService, companyService,requestService,metaService) {

        /* Constants */
        const general_keys = {}
        general_keys['body'] = 'Bodily Injury'
        general_keys['property'] = 'Property Damage'
        general_keys['financial'] = 'Financial Loss'

        /* Local Variables */
        var allIndustryCode = {};
        var allcomparisonCriteria = {};

        /* Get Specific Criteria */
        function getSpecificCriteriaForIndustryCodes(insuranceId,IndustryCodes,callback, err_call){
            metaService.getComparisonCriteriaMappingForInsuranceType(insuranceId,criteriaMapping=>{
                let specificCriteriaForIndustryCodesAndInsuranceType = [];
                let specificCriteriasWithIndustryCodes = [];
                if(criteriaMapping && criteriaMapping.comparison_criteria){
                    for(let criteriaId in criteriaMapping.comparison_criteria){
                        let criteriaMappingItem = criteriaMapping.comparison_criteria[criteriaId];
                        let specificCriteriaIndustryCodes = getIndustryCodesPerSpecificCriteria(criteriaMappingItem)
                        let allIndustryCodesWithParentsForCompany = getAllIndustryCodesWithParentsForCompany(IndustryCodes);
                        let isExcludeIndustryCodes = criteriaMappingItem.industry.exclude_all
                        for(let industryCode in allIndustryCodesWithParentsForCompany){
                            /* if exclude all is set to true then, include all the industry codes matching companies industry code. */
                            if(isExcludeIndustryCodes){
                                if(specificCriteriaIndustryCodes.indexOf(industryCode) > -1 ){
                                    specificCriteriaForIndustryCodesAndInsuranceType.push(criteriaId);
                                    if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                                        specificCriteriasWithIndustryCodes.push(criteriaId);
                                    }
                                    break;
                                }
                            }
                            else{
                                if(specificCriteriaIndustryCodes.indexOf(industryCode) == -1 ){
                                    specificCriteriaForIndustryCodesAndInsuranceType.push(criteriaId);
                                    if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                                        specificCriteriasWithIndustryCodes.push(criteriaId);
                                    }
                                }
                                else{
                                    /*  if u find any one of user's industry code matching the criteria's industry codes then remove it */
                                    specificCriteriaForIndustryCodesAndInsuranceType = specificCriteriaForIndustryCodesAndInsuranceType.filter(_criteriaId=> _criteriaId != criteriaId);
                                    specificCriteriasWithIndustryCodes = specificCriteriasWithIndustryCodes.filter(_criteriaId=> _criteriaId != criteriaId);
                                    break;
                                }
                            }
                        }
                    }
                }
                if(callback){
                    specificCriteriaForIndustryCodesAndInsuranceType = [...new Set(specificCriteriaForIndustryCodesAndInsuranceType)];
                    specificCriteriasWithIndustryCodes = [...new Set(specificCriteriasWithIndustryCodes)];
                    callback({"specificCriterias": specificCriteriaForIndustryCodesAndInsuranceType,"specificCriteriasWithIndustryCodes": specificCriteriasWithIndustryCodes});
                }
            },err_call);
        }

        function getAllIndustryCodesWithParentsForCompany(industry_keys){
            let object_with_all_codes = {}
            for(var index in industry_keys){
                let split_code = industry_keys[index].split('.');
                let tmp_code = '';
                for (let inner_index in split_code) {
                    if (split_code.hasOwnProperty(inner_index)) {
                        tmp_code = inner_index == 0 ?
                        tmp_code + split_code[inner_index] :
                        tmp_code + '.' + split_code[inner_index];
                        object_with_all_codes[tmp_code] = true;
                    }
                }
            }
            return object_with_all_codes;
        }

        function getIndustryCodesPerSpecificCriteria(criteriaMappingItem){
            let criteriaIndustryCodes = [];
            if(criteriaMappingItem.industry && criteriaMappingItem.industry.industry_codes){
                for(let industryCode_id in criteriaMappingItem.industry.industry_codes){
                    let industryCode = allIndustryCode[industryCode_id].code;
                    if(industryCode)
                        criteriaIndustryCodes.push(industryCode);
                }
            }
            return criteriaIndustryCodes;
        }

        function getCriteriaName(criteriaId){
            if(allcomparisonCriteria[criteriaId] && allcomparisonCriteria[criteriaId].name_de)
                return allcomparisonCriteria[criteriaId].name_de;
        }

        (()=>{
            metaService.getIndustryCodes(_allIndustryCode => allIndustryCode = _allIndustryCode);
            metaService.getAllComparisonCriteria(_allcomparisonCriteria => allcomparisonCriteria = _allcomparisonCriteria);
        })()

        /* Get Options */
        function get_options(){
            return { general_keys };
        }

        /* Return Stuff */
        return {
            getSpecificCriteriaForIndustryCodes,
            getCriteriaName,
            get_options
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('fileService', fileService);

    fileService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'uuid2'];

    // Parse File Name
    function parseFileName(userId, blob, uuid2){
      console.log('BLOB',blob);
        var extension = blob.type.split('/')[1];
        return uuid2.newuuid()+'.'+extension;
    }

    /* Get Dynamic Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getEndpoint(routeList){
        var route = routeList.join('/');
        console.log('Requested Storage Route:',route);
        return firebase.storage().ref().child(route);
    }

    function fileService($rootScope, firebase, $firebaseObject, uuid2) {

        // Policies Reference
        const policiesRef = firebase.storage().ref().child('policies/');

        /* Download A Policy */
        function downloadSinglePolicy(file_url, callback){
          var policyRef = policiesRef.child(file_url);
          policyRef.getDownloadURL().then(function(url) {
              callback(url);
          }, function(error) {

          });
        }

        /* Upload file */
        function uploadFile(company_uid ,fileItem, callback, err){
            var file_url = parseFileName(company_uid, fileItem, uuid2);
            var newPolicyRef = policiesRef.child(file_url);
            newPolicyRef.put(fileItem).then(function(snapshot) {
                callback(file_url)
            }, function(error){
                err(error);
            });
        }

        /* Upload File With Custom Endpoint */
        function uploadFileWithCustomEndpoint(route, file_id, fileItem, callback, err_call){
          var file_url = parseFileName(file_id, fileItem, uuid2);
          var storageRef = getEndpoint(route).child(file_url);
          storageRef.put(fileItem).then(function(snapshot) {
              callback(file_url)
          }, function(error){
              err_call(error);
          });
        }

        /* Download File With Custom Endpoint */
        function downloadFileWithCustomEndpoint(route, file_url, callback, err_call){
          var storageRef = getEndpoint(route).child(file_url);
          storageRef.getDownloadURL().then(function(url) {
              callback(url);
          }, function(error) {
              err_call(error)
          });
        }

        function downloadWithName(from, rename_to) {
            rename_to = encodeURIComponent(rename_to);
            return firebase.storage().ref().child(from).getDownloadURL()
                .then(() => { //We don't need a downloadURL, since we use it only to make sure the resource exists
                    window.location.assign("/api/download?from=" + from + "&as=" + rename_to);
                });
        }

        /* Return Stuff */
        return {
            uploadFile: uploadFile,
            downloadSinglePolicy: downloadSinglePolicy,
            uploadFileWithCustomEndpoint : uploadFileWithCustomEndpoint,
            downloadFileWithCustomEndpoint : downloadFileWithCustomEndpoint,
            downloadWithName: downloadWithName
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('finfoService', finfoService);

    finfoService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService', 'modelsService'];

    /* Get Specific Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getSpecificEndpoint(address){
        return firebase.database().ref().child(address);
    }

    /* Service Function */
    function finfoService($rootScope, firebase, $firebaseObject, activityService, modelsService) {

        /* Get Company Information Blocks */
        function getCompanyInfoBlocks(callback){
            var model = modelsService.getModel('statistics');
            var blocksRef = getSpecificEndpoint(model.root);
            blocksRef.once('value').then(function(snapshot) {
                var blocks = snapshot.val()
                if(blocks) {
                  console.log('Previous data', blocks);
                  console.log('New data', model.model);
                  modelsService.syncTwoModels(blocks, model.model);
                  callback(blocks);
                }
                else {
                  console.log('All new data',model.model);
                  callback(model.model);
                }
            }, function(){

            });
        }

        /* Update Information For Company */
        function updateInformationForCompany(block_name,params, callback){
            var model = modelsService.getModel('statistics');
            var company_blocks = getSpecificEndpoint(model.root);
            var company_block = company_blocks.child(block_name);
            var block_obj = $firebaseObject(company_block);
            Object.assign(block_obj, params);
            block_obj.$save().then(function(ref) {
                console.info('Information Updated');
                activityService.logActivity({
                    activity: params.title+ ' updated',
                    next: 'Everything up to date',
                    timestamp: $rootScope.genService.getTimestamp()
                });
                callback();
            }, function(error) {
                console.log("Error:", error);
            });
        }

        /* Return Stuff */
        return {
            getCompanyInfoBlocks: getCompanyInfoBlocks,
            updateInformationForCompany: updateInformationForCompany
        }
    }
})();

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

(function() {

  'use strict';

  angular.module('application').
  service('iconService', iconService);

  iconService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'requestService', 'fileService'];

  const icon_prefix = 'icons';
  const insurance_suffix = 'insurance_types';
  const meta_prefix = 'meta';

  const icons_route = [icon_prefix];

  function iconService($rootScope, firebase, $firebaseObject, requestService, fileService) {

    function uploadFile(file, callback, err_call){
      fileService.uploadFileWithCustomEndpoint(icons_route, "", file,
        file_id => {
            fileService.downloadFileWithCustomEndpoint(icons_route, file_id, (download_url) => {
              const icon_record = {
                name: file.name,
                storage_id: file_id,
                download_url
              };
              requestService.pushData(icons_route, icon_record, callback, err_call);
            }, err_call);
        }
      , err_call);
    }

    function onIconsUpdate(callback, call_err) {
      requestService.getDataOnValue(icons_route, callback, call_err)
    }

    function updateInsuranceTypeIcon(insurance_uid, icon_url, callback, err_call) {
        requestService.updateData([meta_prefix, insurance_suffix, insurance_uid], {icon_url}, callback, err_call)
    }

    return {
      uploadFile,
      onIconsUpdate,
      updateInsuranceTypeIcon
    }
  }

})();

(function() {

	'use strict';

	angular.module('application').
	service('insuranceQuestionsService', insuranceQuestionsService);
	insuranceQuestionsService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'fileService', 'metaService'];

	function insuranceQuestionsService($rootScope, firebase, $firebaseObject, fileService, metaService){

		/////////////////////////////
		/*      Scope Variables    */
		/////////////////////////////

		/* Question Input Types */
		let input_type_enum = {}
		input_type_enum['bool'] = "Yes / No";
		input_type_enum['number'] = "Number";
		input_type_enum['date'] = "Date";
		input_type_enum['currency'] = "Currency/Money";
		input_type_enum['text'] = "Free Text";

		/* Question Types */
		let question_type_enum = {}
		question_type_enum['general'] = "General (shown in the beginning)";
		question_type_enum['confirmatory'] = "Confirmatory (shown in the end)";
		question_type_enum['specific'] = "Specific (specific to an insurance type)";

		/* Show on Account Page Bool */
		let account_page_status = {};
		account_page_status['hide'] = "Hide from account page";
		account_page_status['show'] = "Show on account page";
		account_page_status['edit'] = "Show and Edit from account page";

		/* Are */
		let future_dates = {};
		future_dates[false] = "No";
		future_dates[true] = "Yes";

		let trigger_conditions = {}
		trigger_conditions['<'] = "<";
		trigger_conditions['>'] = ">";
		trigger_conditions['<='] = "<=";
		trigger_conditions['>='] = ">=";
		trigger_conditions['!='] = "!=";
		trigger_conditions['=='] = "=";

		/* Boolean Answers */
		let boolean_answers = {};
		boolean_answers[false] = "No";
		boolean_answers[true] = "Yes";


		var allInsuranceQuestionsArray = [];

		/////////////////////////////
		/*        Functions        */
		/////////////////////////////
		/*get insuranceQuestions from meta service and convert to an array.*/
		function getAllInsuranceQuestionsArray(successCallback,errorCallback){
			metaService.getAllInsuranceQuestions((insuranceQuestionslistObj)=>{
				for(var index in insuranceQuestionslistObj){
					var insuranceQuestionObj= {insuranceQuestionObj: insuranceQuestionslistObj[index],key: index};
					allInsuranceQuestionsArray.push(insuranceQuestionObj);
				}
				if(successCallback)
					successCallback(allInsuranceQuestionsArray);
			});
		}

		/*get all main questions for the insurence type*/
		function getInsurenceMainQuestionForInsuranceId(insurenceTypeId,successCallback, errorCallback){
			getAllInsuranceQuestionsArray(()=>{
				var mainQuestionPerInsurance = allInsuranceQuestionsArray.filter((questionObj)=> {
					if(questionObj.insuranceQuestionObj.mappings && questionObj.insuranceQuestionObj.mappings[insurenceTypeId])
						return true;

					else
						return false;
				});
				successCallback(mainQuestionPerInsurance);
			});
		}
		/*move converts the selected main questions as sub questions*/
		function addSubquestionsToMainQuestion(insurenceTypeId,mainQuestion,subquestions,successCallback, errorCallback){
			/*1 check if the insuranceid already exists */
			/*2 check if the subquestion already exists */
			/*3 if 2 is false add subquestionid to the mainquestion obj*/

			if(!mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId]){
				mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId] = {"children":{}}
			}

			/*remove bool from the child's property*/
			mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId].children = {};

			subquestions.forEach((subquestion)=>{
				mainQuestion.insuranceQuestionObj.mappings[insurenceTypeId].children[subquestion.key] = {insuranceQuestionObj: {trigger:{}},key: subquestion.key};
			});

			if (successCallback)
				successCallback(mainQuestion);
		}

		/* Get All Insurance Questions */
		function getAllInsuranceQuestions(question_uid, callback, err_call){
			metaService.getAllInsuranceQuestions(question_uid, callback, err_call);
		}

		/* Get Single Insurance Question */
		function getSingleInsuranceQuestion(question_uid, callback, err_call){
			metaService.getSingleInsuranceQuestion(question_uid, callback, err_call);
		}

		/* Get all meta information */
		function getAllMetaInformation(callback, err_call){
			callback({input_type_enum, question_type_enum, account_page_status, future_dates, trigger_conditions, boolean_answers});
		}

		/* Update Question */
		function updateQuestion(question_uid, data, callback, err_call){
			for(var key in data){
				if(data[key] === undefined){
					data[key] = null;
				}
			}
			metaService.updateInsuranceQuestion(question_uid, data, callback, err_call);
		}

		/* Delete Question */
		function deleteQuestion(question_uid, callback, err_call){
			metaService.deleteInsuranceQuestion(question_uid, callback, err_call);
		}

		/* Add New Question */
		function addNewQuestion(callback, err_call){
			metaService.addNewInsuranceQuestion({disabled:true}, callback, err_call);
		}

		/////////////////////////////
		/*         Returns         */
		/////////////////////////////
		return {
			getSingleInsuranceQuestion : getSingleInsuranceQuestion,
			getAllMetaInformation : getAllMetaInformation,
			updateQuestion : updateQuestion,
			getAllInsuranceQuestions : getAllInsuranceQuestions,
			deleteQuestion : deleteQuestion,
			addNewQuestion : addNewQuestion,
			getInsurenceMainQuestionForInsuranceId: getInsurenceMainQuestionForInsuranceId,
			addSubquestionsToMainQuestion: addSubquestionsToMainQuestion
		}
	}

})();

(function() {

    'use strict';

    angular.module('application').
    service('logService', logService);

    logService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService', ];

    /* Endpoints */
    const prefix = 'log';
    const client_suffix = 'client';
    const office_suffix = 'office';

    function logService($rootScope, firebase, $firebaseObject, requestService) {

        /* Get Office Logs */
        function getOfficeLogs(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        /* Push Office Log */
        function pushOfficeLog(action, callback, err_call){
          var data = {
            actor : $rootScope.user.email,
            action : action
          }
          requestService.pushData([prefix], data, callback, err_call);
        }

        /* Return Stuff */
        return {
          getOfficeLogs : getOfficeLogs,
          pushOfficeLog : pushOfficeLog
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('mandateService', mandateService);

    mandateService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'backofficeService', 'fileService'];

    /* Prefix */
    const mandate_prefix = 'mandates';
    const document_prefix = 'documents';

    /* Service Function */
    function mandateService($rootScope, firebase, $firebaseObject, activityService, requestService, backofficeService, fileService) {

        /* Get Single Mandate */
        function getSingleMandate(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([document_prefix, mandate_prefix], 'company', company_uid, callback, err_call);
        }

        /* Get All Mandates */
        function getAllMandates(callback, err_call){
          requestService.getDataOnce([mandate_prefix], function(mandates){
              callback(mandates)
          }, function(error){
              err_call(error);
          });
        }

        /*Get mandate by id */
        function getMandateById(mandateId,callback,err_call){
          console.log('checking '+document_prefix+'/'+mandate_prefix+'/'+mandateId);
          requestService.getDataOnce([document_prefix,mandate_prefix,mandateId],callback,err_call)
        }

        /* Download mandate*/
        function getLinkToDownloadMandate(file_url, company_uid, callback, err_call){
          fileService.downloadFileWithCustomEndpoint([mandate_prefix, company_uid], file_url, callback, err_call);
        }

        function checkMandate(mandate_uid, company_uid, callback, err_call) {
            if (mandate_uid) {
                return callback(mandate_uid);
            }
            backofficeService.initMandate(company_uid, res => callback(res.mandate_uid), err_call);
        }

        function uploadMandate(file, company_uid, mandate_uid, callback, err_call) {
            checkMandate(mandate_uid, company_uid, (correct_mandate_uid) => {
                fileService.uploadFileWithCustomEndpoint([mandate_prefix, company_uid], "", file, signed_document_url => {
                    const mandate_data = {
                        signed_document_url,
                        notified: true,
                        status: 'signed',
                        timestamp: requestService.getTimestamp()
                    };
                    requestService.updateData([document_prefix, mandate_prefix, correct_mandate_uid], mandate_data, callback, err_call);
                }, err_call)
            }, err_call);

        }

        /* Return Stuff */
        return {
          getSingleMandate,
          getAllMandates,
          getLinkToDownloadMandate,
          getMandateById,
          uploadMandate
        }
    }
})();

(function() {
  
  'use strict';
  
  angular.module('application').
  service('metaService', metaService);
  
  metaService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];
  
  // Routes
  const prefix = 'meta';
  const mandate_suffix = 'mandate';
  const policies_suffix = 'policy_criteria';
  const industry_suffix = 'industry_criteria';
  const custom_field_suffix = 'fields';
  const products_suffix = 'products';
  const carrier_suffix = 'carriers';
  const insurance_suffix = 'insurance_types';
  const codes_suffix = 'industry_codes';
  const activity_suffix = 'activities';
  const group_suffix = 'activity_groups';
  const activities_suffix = 'activities';
  const insurance_questions_suffix = 'insurance_questionnaire';
  const insurance_mapping_suffix = 'insurance_question_mapping';
  const mapped_questions_suffix = 'questions';
  const recommendation_mapping_suffix = 'recommendation_mapping';
  const activity_weights_suffix = 'activity_weights';
  const knockout_trigger_suffix = 'knockout_trigger';
  const product_question_children_suffix = 'children';
  const pretrigger_suffix = 'pre_triggers';
  const questions_suffix = 'questions';
  const comparison_criteria_suffix = 'comparison_criteria';
  const comparison_criteria_mapping_suffix = 'comparison_criteria_mapping';
  const trigger_suffix = 'trigger';
  const comparisons_suffix = 'comparisons';
  
  function metaService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {
    
    let model = {};
    
    /* Question Input Types */
    let product_input_type_enum = {};
    product_input_type_enum['bool'] = "Yes / No";
    product_input_type_enum['number'] = "Number";
    product_input_type_enum['date'] = "Date";
    product_input_type_enum['currency'] = "Currency/Money";
    product_input_type_enum['text'] = "Free Text";
    
    var allInsuranceQuestionsArray = [];
    
    /* Threshold triggers for products */
    let product_trigger_conditions = {}
    product_trigger_conditions['<'] = "<";
    product_trigger_conditions['>'] = ">";
    product_trigger_conditions['<='] = "<=";
    product_trigger_conditions['>='] = ">=";
    product_trigger_conditions['!='] = "!=";
    product_trigger_conditions['=='] = "=";
    product_trigger_conditions['<>'] = "<>";
    product_trigger_conditions['no_threshold'] = "No threshold";
    
    let product_boolean_answers = {};
    product_boolean_answers[false] = "No";
    product_boolean_answers[true] = "Yes";
    product_boolean_answers["no_threshold"] = "No threshold";
    
    /*********************************************/
    /**                 Mandate                 **/
    /*********************************************/
    
    /* Add Mandate */
    function addMandate(file_url, callback, err_call){
      var data = {
        file: file_url,
        status: 'inactive'
      }
      requestService.pushData([prefix, mandate_suffix], data, callback, err_call);
    }
    
    /* Get Mandates */
    function getMandates(callback, err_call){
      requestService.getDataOnce([prefix, mandate_suffix], callback, err_call);
    }
    
    /* Get Single Mandate */
    function getSingleMandate(mandate_uid, callback, err_call){
      requestService.getDataOnce([prefix, mandate_suffix, mandate_uid], callback, err_call);
    }
    
    /* Upload Mandate */
    function uploadMandate(fileItem, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, mandate_suffix], "", fileItem, callback, err_call);
    }
    
    /* Download Mandate */
    function downloadMandate(file_url, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, mandate_suffix], file_url, callback, err_call);
    }
    
    /* Mark Mandate Active */
    function activateMandate(mandate_uid, callback, err_call){
      var data = {
        status : 'active'
      }
      requestService.updateData([prefix, mandate_suffix, mandate_uid], data, callback, err_call)
    }
    
    /* Mark Mandate Inactive */
    function deactivateMandate(mandate_uid, callback, err_call){
      var data = {
        status : 'inactive'
      }
      requestService.updateData([prefix, mandate_suffix, mandate_uid], data, callback, err_call)
    }
    
    /*********************************************/
    /**             Policy Criteria             **/
    /*********************************************/
    
    /* Get All Criteria  */
    function getAllComparisonCriteria(callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_suffix], callback, err_call);
    }
    
    /* Get All Criteria Mapping  */
    function getComparisonCriteriaMapping(callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_mapping_suffix], callback, err_call);
    }
    
    /* Get All Criteria Mapping For Insurance Type */
    function getComparisonCriteriaMappingForInsuranceType(insurance_type, callback, err_call){
      requestService.getDataOnce([prefix, comparison_criteria_mapping_suffix, insurance_suffix, insurance_type], callback, err_call);
    }
    
    /* Update Comparison Criteria Mapping */
    function updateComparisonCriteriaMapping(insurance_type, data, callback, err_call){
      requestService.updateData([prefix, comparison_criteria_mapping_suffix, insurance_suffix, insurance_type], data, callback, err_call);
    }
    
    /* Add Comparison Criteria to Criteria Mapping */
    function addComparisonCriteriaToMapping(insurance_type, criterias, callback, err_call){
      let data = { industry : {exclude_all : false} }
      let newUpdate = {}
      for(let key in criterias){
        newUpdate[prefix+'/'+comparison_criteria_mapping_suffix+'/'+insurance_suffix+'/'+insurance_type+'/'+comparison_criteria_suffix+'/'+key] = data
      }
      requestService.multiPathUpdate(newUpdate, callback, err_call);
    }
    
    /* OLD STUFF BELOW */
    
    /* Add Policy Criteria */
    function addPolicyCriteria(callback, err_call){
      requestService.pushData([prefix, policies_suffix], {}, callback, err_call);
    }
    
    /* Add Custom Field To Policy Criteria */
    function addCustomField(policy_uid, callback, err_call){
      requestService.pushData([prefix, policies_suffix, policy_uid, custom_field_suffix], {}, callback, err_call);
    }
    
    /* Save Policy Criteria */
    function savePolicyCriteria(policy_uid, data, callback, err_call){
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call)
    }
    
    /* Disable Custom Field */
    function disableCustomField(policy_uid, field_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, policies_suffix, policy_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Enable Custom Field */
    function enableCustomField(policy_uid, field_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, policies_suffix, policy_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Delete Policy Criteria */
    function deletePolicyCriteria(policy_uid, data, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call);
    }
    
    /* Enable Policy Criteria */
    function enablePolicyCriteria(policy_uid, data, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, policies_suffix, policy_uid], data, callback, err_call);
    }
    
    /* Get Policy Criteriaa */
    function getPolicyCriteria(callback, err_call){
      requestService.getDataOnce([prefix, policies_suffix], callback, err_call);
    }
    
    /* Get Single Policy Criteria */
    function getSinglePolicyCriteria(policy_uid, callback, err_call){
      requestService.getDataOnce([prefix, policies_suffix, policy_uid], callback, err_call);
    }
    
    /* Get Policy Specific Criteria From Subject Trigger */
    function getPolicySpecificCriteriaFromSubjectTrigger(subject_trigger, callback, err_call){
      requestService.getDataOnceEqualTo([prefix, policies_suffix], 'trigger', subject_trigger, callback, err_call);
    }
    
    /* OLD STUFF ABOVE */
    
    
    /*********************************************/
    /**               Industry Criterias        **/
    /*********************************************/
    
    /* Add Industry Criteria */
    function addIndustryCriteria(callback, err_call){
      requestService.pushData([prefix, industry_suffix], {}, callback, err_call);
    }
    
    /* Get Industry Criteriaa */
    function getIndustryCriteria(callback, err_call){
      requestService.getDataOnce([prefix, industry_suffix], callback, err_call);
    }
    
    /* Get Single Industry Criteria */
    function getSingleIndustryCriteria(criteria_uid, callback, err_call){
      requestService.getDataOnce([prefix, industry_suffix, criteria_uid], callback, err_call);
    }
    
    /* Save Industry Criteria */
    function saveIndustryCriteria(criteria_uid, data, callback, err_call){
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call)
    }
    
    /* Add Custom Field To Industry Criteria */
    function addInudstryCustomField(criteria_uid, callback, err_call){
      requestService.pushData([prefix, industry_suffix, criteria_uid, custom_field_suffix], {}, callback, err_call);
    }
    
    /* Disable Custom Field */
    function disableIndustryCustomField(criteria_uid, field_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Enable Custom Field */
    function enableIndustryCustomField(criteria_uid, field_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid, custom_field_suffix, field_uid], data, callback, err_call)
    }
    
    /* Delete Industry Criteria */
    function disableIndustryCriteria(criteria_uid, data, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call);
    }
    
    /* Enable Industry Criteria */
    function enableIndustryCriteria(criteria_uid, data, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, industry_suffix, criteria_uid], data, callback, err_call);
    }
    
    /* Get Industry Specific Criteria From Subject Trigger */
    function getIndustrySpecificCriteriaFromPolicyTrigger(policy_trigger, callback, err_call){
      requestService.getDataOnceEqualTo([prefix, industry_suffix], 'policy_trigger', policy_trigger, callback, err_call);
    }
    
    
    /*********************************************/
    /**               Carriers                  **/
    /*********************************************/
    
    /* Add Carrier */
    function addCarrier(callback, err_call){
      var data = {
        disabled : true
      }
      requestService.pushData([prefix, carrier_suffix], data, callback, err_call);
    }
    
    /* Get Carriers */
    function getCarriers(callback, err_call){
      requestService.getDataOnce([prefix, carrier_suffix], callback, err_call);
    }
    
    /* Get Single Carrier */
    function getSingleCarrier(carrier_uid, callback, err_call){
      requestService.getDataOnce([prefix, carrier_suffix, carrier_uid], callback, err_call);
    }
    
    /* Save Carrier */
    function saveCarrier(carrier_uid, data, callback, err_call){
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call)
    }
    
    /* Upload Carrier Photo */
    function uploadCarrierPhoto(fileItem, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, carrier_suffix], "", fileItem, callback, err_call);
    }
    
    /* Add Photo to Carrier */
    function addPhotoToCarrier(file_url, carrier_uid, callback, err_call){
      var data = {
        file: file_url
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /* Download Carrier Photo */
    function downloadCarrier(file_url, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, carrier_suffix], file_url, callback, err_call);
    }
    
    /* Disable Carrier */
    function disableCarrier(carrier_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /* Enable Carrier */
    function enableCarrier(carrier_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, carrier_suffix, carrier_uid], data, callback, err_call);
    }
    
    /*********************************************/
    /**             Insurance Types             **/
    /*********************************************/
    
    /* Add Insurance Type */
    function addInsuranceType(callback, err_call){
      var data = {
        disabled : true,
        included_for_all : false,
      }
      requestService.pushData([prefix, insurance_suffix], data, callback, err_call);
    }
    
    /* Get Insurance Types */
    function getInsuranceTypes(callback, err_call){
      requestService.getDataOnce([prefix, insurance_suffix], callback, err_call);
    }
    
    /* Get Single Insurance Type */
    function getSingleInsuranceType(insurance_uid, callback, err_call){
      requestService.getDataOnce([prefix, insurance_suffix, insurance_uid], callback, err_call);
    }
    
    /* Disable Insurance Type */
    function disableInsuranceType(insurance_uid, callback, err_call){
      var data = {
        disabled : true
      }
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call);
    }
    
    /* Enable Insurance Type */
    function enableInsuranceType(insurance_uid, callback, err_call){
      var data = {
        disabled : false
      }
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call);
    }
    
    /* Save Insurance Type */
    function saveInsuranceType(insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, insurance_suffix, insurance_uid], data, callback, err_call, true)
    }
    
    /*********************************************/
    /**             Industry Codes             **/
    /*********************************************/
    
    /* Add Industry Code */
    function addIndustryCode(callback, err_call){
      var data = {
        disabled : true
      }
      requestService.pushData([prefix, codes_suffix], data, callback, err_call);
    }
    
    /* Get Industry Codes */
    function getIndustryCodes(callback, err_call){
      if(model.industry_codes) {
        callback(model.industry_codes)
        return;
      }
      requestService.getDataOnValue([prefix, codes_suffix],
        result => {
          model.industry_codes = result;
          callback(model.industry_codes);
          return;
        }, err_call);
      }
      
      /* Get Single Insurance Type */
      function getSingleIndustryCode(code_uid, callback, err_call){
        requestService.getDataOnce([prefix, codes_suffix, code_uid], callback, err_call);
      }
      
      /* Disable Industry Code */
      function disableIndustryCode(code_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call);
      }
      
      /* Enable Industry Code */
      function enableIndustryCode(code_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call);
      }
      
      /* Save Industry Code */
      function saveIndustryCode(code_uid, data, callback, err_call){
        requestService.updateData([prefix, codes_suffix, code_uid], data, callback, err_call)
      }
      
      /* Get Code uid From Code Code */
      function getCodeDataFromCode(code, callback, err_call){
        requestService.getDataOnceEqualTo([prefix, codes_suffix], 'code', code, callback, err_call);
      }
      
      
      /*********************************************/
      /**               Activities                **/
      /*********************************************/
      
      /* Get All Activities */
      function getAllActivities(callback, err_call){
        requestService.getDataOnce([prefix, activity_suffix], callback, err_call);
      }
      
      /* Get Single Activity */
      function getSingleActivity(uid, callback, err_call){
        requestService.getDataOnce([prefix, activity_suffix, uid], callback, err_call);
      }
      
      /* Add Activity */
      function addActivity(data, callback, err_call){
        data.disabled = false;
        requestService.pushData([prefix, activity_suffix], data, callback, err_call);
      }
      
      /* Save Activity */
      function saveActivity(uid, data, callback, err_call){
        requestService.updateData([prefix, activity_suffix, uid], data, callback, err_call);
      }
      
      /* Get Groups */
      function getGroups(callback, err_call){
        requestService.getDataOnce([prefix, group_suffix], callback, err_call);
      }
      
      /* Get Single Group */
      function getSingleGroup(uid, callback, err_call){
        requestService.getDataOnce([prefix, group_suffix, uid], callback, err_call);
      }
      
      /* Save Group */
      function saveGroup(data, uid, callback, err_call){
        requestService.updateData([prefix, group_suffix, uid], data, callback, err_call);
      }
      
      /* Add Group */
      function addGroup(data, callback, err_call){
        data.disabled = false;
        requestService.pushData([prefix, group_suffix], data, callback, err_call);
      }
      
      function disableActivity(activity_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, activity_suffix, activity_uid], data, callback, err_call);
      }
      
      function enableActivity(activity_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, activity_suffix, activity_uid], data, callback, err_call);
        
      }
      
      function disableActivityGroup(activity_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, group_suffix, activity_uid], data, callback, err_call);
      }
      
      function enableActivityGroup(activity_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, group_suffix, activity_uid], data, callback, err_call);
      }
      
      /* Activity Questions */
      function getActivityQuestions(callback, err_call){
        if(model.activities){
          callback(model.activities);
          return;
        }
        requestService.getDataOnce([prefix, activities_suffix], activities => {
          model.activities = activities;
          callback(activities);
        }, err_call);
      }
      
      /* Activity Groups */
      function getGroups(callback, err_call){
        if(model.groups){
          callback(model.groups)
        }
        requestService.getDataOnce([prefix, group_suffix], groups => {
          model.groups = groups;
          callback(model.groups);
        }, err_call);
      }
      
      /*********************************************/
      /**          Insurance Questions            **/
      /*********************************************/
      
      function getAllInsuranceQuestions(callback, err_call){
        requestService.getDataOnce([prefix, insurance_questions_suffix], callback, err_call);
      }
      
      function getSingleInsuranceQuestion(question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_questions_suffix, question_uid], callback, err_call)
      }
      
      function updateInsuranceQuestion(question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_questions_suffix, question_uid], data, callback, err_call);
      }
      
      function deleteInsuranceQuestion(question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_questions_suffix, question_uid], callback, err_call);
      }
      
      function deleteQuestionFromMapping(insurance_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      function addNewInsuranceQuestion(data, callback, err_call){
        requestService.pushData([prefix, insurance_questions_suffix], data, callback, err_call, false);
      }
      
      function editQuestionMapping(insurance_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, question_uid], data, callback, err_call, false);
      }
      
      function getQuestionMappingForInsuranceType(insurance_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix], callback, err_call);
      }
      
      function getAllQuestionMapping(callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, insurance_suffix], callback, err_call);
      }
      
      function swapOrderOnQuestionInMapping(insurance_uid, question_uid_1, question_uid_2, new_order_1, new_order_2, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+question_uid_1+'/order'] = new_order_1;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+question_uid_2+'/order'] = new_order_2;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteAndMakeSubquestionOf(insurance_uid, parent_question_uid, child_question_uid, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+child_question_uid] = null;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+insurance_suffix+'/'+insurance_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/trigger'] = false;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteSubquestion(insurance_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, parent_question_uid, 'children', child_question_uid], callback, err_call);
      }
      
      function editSubquestion(insurance_uid, parent_question_uid, child_question_uid, data, callback, err_call) {
        requestService.updateData([prefix, insurance_mapping_suffix, insurance_suffix, insurance_uid, mapped_questions_suffix, parent_question_uid, 'children', child_question_uid], data, callback, err_call, false);
      }
      
      
      /*********************************************/
      /**       Recommendation Mapping            **/
      /*********************************************/
      
      function getAllRecommendationMapping(callback, err_call){
        requestService.getDataOnce([prefix, recommendation_mapping_suffix], callback, err_call);
      }
      
      function saveActivityRecommendationScore(insurance_type, activityquestion, data, callback, err_call){
        requestService.updateData([prefix, recommendation_mapping_suffix, insurance_suffix,insurance_type,activity_weights_suffix,activityquestion], data,callback,err_call);
      }
      
      function deleteActivityRecommendationScore(insurance_type, activityquestion, data, callback, err_call){
        requestService.deleteData([prefix, recommendation_mapping_suffix, insurance_suffix, insurance_type, activity_weights_suffix, activityquestion], callback, err_call);
      }
      
      function saveIndustryRecommendationScore(insurance_type, data, callback, err_call){
        requestService.updateData([prefix, recommendation_mapping_suffix, insurance_suffix,insurance_type], data,callback,err_call);
      }
      
      /*********************************************/
      /**                 Products                **/
      /*********************************************/
      
      function getTriggersForProductQuestion(product_uid, question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      function getTriggersForProductSubQuestion(product_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], callback, err_call);
      }
      
      function saveTriggersForProductQuestion(product_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid, knockout_trigger_suffix], data, callback, err_call);
      }
      
      function saveTriggersForProductSubQuestion(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid, knockout_trigger_suffix], data, callback, err_call);
      }
      
      function getAllProductMetaInformation(callback, err_call){
        callback({product_input_type_enum, product_trigger_conditions, product_boolean_answers});
      }
      
      function saveLinkedProductQuestion(product_uid, question_uid, question_order, callback, err_call){
        var data = {
          children : false,
          order : question_order,
          children : false,
          knockout_trigger : {
            condition : "no_threshold",
            on : "no_threshold"
          }
        }
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], data, callback, err_call);
      }
      
      function addPretriggerToQuestion(product_uid, question_uid, callback, err_call){
        var data = {
          trigger : {
            condition : "no_threshold",
            on : "no_threshold"
          }
        }
        requestService.updateData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid], data, callback, err_call);
      }
      
      function savePretriggerQuestion(product_uid, question_uid, data, callback, err_call){
        requestService.updateData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid, trigger_suffix], data, callback, err_call);
      }
      
      function getLinkedProductQuestion(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix], callback, err_call);
      }
      
      /* Add Insurance Product */
      function addInsuranceProduct(callback, err_call){
        var data = {
          disabled : true,
          display_version: 2
        }
        requestService.pushData([prefix, products_suffix], data, callback, err_call);
      }
      
      /* Get Insurance Products */
      function getInsuranceProducts(callback, err_call){
        requestService.getDataOnce([prefix, products_suffix], callback, err_call);
      }
      
      /* Get Single Product */
      function getSingleProduct(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, products_suffix, product_uid], callback, err_call);
      }
      
      /* Disable Product */
      function disableProduct(product_uid, callback, err_call){
        var data = {
          disabled : true
        }
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /* Enable Product */
      function enableProduct(product_uid, callback, err_call){
        var data = {
          disabled : false
        }
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /* Save Product */
      function saveProduct(product_uid, data, callback, err_call){
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call, true)
      }
      
      /* Get Question Mapping For Product */
      function getQuestionMappingForProduct(product_uid, callback, err_call){
        requestService.getDataOnce([prefix, insurance_mapping_suffix, products_suffix, product_uid], callback, err_call);
      }
      
      /* Save Question Mapping For Product */
      function saveQuestionMappingForProduct(product_uid, question_uid, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      /* Delete Question Prom Prouct */
      function deleteFromProductQuestionMapping(product_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, question_uid], callback, err_call);
      }
      
      /* Swap Order On Question Product Mapping */
      function swapOrderOnQuestionInProductMapping(product_uid, question_uid_1, question_uid_2, new_order_1, new_order_2, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+question_uid_1+'/order'] = new_order_1;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+question_uid_2+'/order'] = new_order_2;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      /* Delete And Make Subquestion Of Product */
      function deleteAndMakeSubquestionProduct(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        let new_update = {};
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+child_question_uid] = null;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/trigger'] = false;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/knockout_trigger/condition'] = data.condition;
        new_update[prefix+'/'+insurance_mapping_suffix+'/'+products_suffix+'/'+product_uid+'/'+mapped_questions_suffix+'/'+parent_question_uid+'/children/'+child_question_uid+'/knockout_trigger/on'] = data.on;
        requestService.multiPathUpdate(new_update, callback, err_call);
      }
      
      function deleteSubQuestionOfProduct(product_uid, parent_question_uid, child_question_uid, callback, err_call){
        requestService.deleteData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], callback, err_call);
      }
      
      function setSubQuestionTriggerOfProduct(product_uid, parent_question_uid, child_question_uid, data, callback, err_call){
        requestService.updateData([prefix, insurance_mapping_suffix, products_suffix, product_uid, mapped_questions_suffix, parent_question_uid, product_question_children_suffix, child_question_uid], data, callback, err_call);
      }
      
      function deletePretriggerQuestion(product_uid, question_uid, callback, err_call){
        requestService.deleteData([prefix, products_suffix, product_uid, pretrigger_suffix, questions_suffix, question_uid], callback, err_call);
      }
      
      function getProductsWithInsuranceType(insurance_type, callback, err_call){
        requestService.getDataOnceEqualTo([prefix, products_suffix], 'insurance_type', insurance_type, callback, err_call);
      }
      
      /* Add Comparison */
      function addProductComparison(product_uid, comparison_data, callback, err_call){
        requestService.pushData([prefix, products_suffix, product_uid, comparisons_suffix], comparison_data, callback, err_call);
      }
      
      /* Delete Comparison criteria from Product*/
      function deleteComparisonFromProduct(product_uid, comparison_uid, callback, err_call){
        requestService.deleteData([prefix, products_suffix, product_uid, comparisons_suffix, comparison_uid], callback, err_call)
      }
      
      function changeProductDisplayVersion(product_uid, callback, err_call){
        var data = {
          display_version: 2
        };
        requestService.updateData([prefix, products_suffix, product_uid], data, callback, err_call);
      }
      
      /*********************************************/
      /**       Comparison Criterias             **/
      /*********************************************/
      
      function getcomparisonCriterias(callback,err_call){
        requestService.getDataOnce([prefix, comparison_criteria_suffix], callback, err_call);
      }
      
      function addComparisonCriteria(data,callback,err_call){
        requestService.pushData([prefix,comparison_criteria_suffix],data,callback,err_call);
      }
      
      function saveComparisonCriteria(criteria_uid,data,callback,err_call){
        requestService.updateData([prefix,comparison_criteria_suffix,criteria_uid],data,callback,err_call,true);
      }
      
      function getSinglecomparisonCriteria(criteria_uid,callback,err_call){
        requestService.getDataOnce([prefix, comparison_criteria_suffix, criteria_uid], callback, err_call);
      }
      
      
      /* Return Stuff */
      return {
        enableActivityGroup,
        disableActivityGroup,
        getMandates,
        addMandate,
        uploadMandate,
        getSingleMandate,
        downloadMandate,
        activateMandate,
        deactivateMandate,
        addPolicyCriteria,
        savePolicyCriteria,
        getPolicyCriteria,
        getSinglePolicyCriteria,
        addCustomField,
        disableCustomField,
        deletePolicyCriteria,
        addInsuranceProduct,
        getInsuranceProducts,
        addCarrier,
        getCarriers,
        getSingleCarrier,
        saveCarrier,
        uploadCarrierPhoto,
        addPhotoToCarrier,
        downloadCarrier,
        disableCarrier,
        enableCarrier,
        addInsuranceType,
        getInsuranceTypes,
        getSingleInsuranceType,
        disableInsuranceType,
        enableInsuranceType,
        saveInsuranceType,
        getSingleProduct,
        disableProduct,
        enableProduct,
        saveProduct,
        addIndustryCode,
        getIndustryCodes,
        getSingleIndustryCode,
        disableIndustryCode,
        enableIndustryCode,
        saveIndustryCode,
        enablePolicyCriteria,
        getPolicySpecificCriteriaFromSubjectTrigger,
        getIndustrySpecificCriteriaFromPolicyTrigger,
        enableCustomField,
        addIndustryCriteria,
        getIndustryCriteria,
        getSingleIndustryCriteria,
        saveIndustryCriteria,
        addInudstryCustomField,
        disableIndustryCustomField,
        enableIndustryCustomField,
        disableIndustryCriteria,
        enableIndustryCriteria,
        getCodeDataFromCode,
        getAllActivities,
        getSingleActivity,
        addActivity,
        saveActivity,
        getSingleGroup,
        getGroups,
        saveGroup,
        addGroup,
        disableActivity,
        enableActivity,
        getAllInsuranceQuestions,
        getSingleInsuranceQuestion,
        updateInsuranceQuestion,
        deleteInsuranceQuestion,
        addNewInsuranceQuestion,
        editQuestionMapping,
        getQuestionMappingForInsuranceType,
        deleteQuestionFromMapping,
        swapOrderOnQuestionInMapping,
        deleteAndMakeSubquestionOf,
        deleteSubquestion,
        editSubquestion,
        getAllRecommendationMapping,
        saveActivityRecommendationScore,
        deleteActivityRecommendationScore,
        saveIndustryRecommendationScore,
        getActivityQuestions,
        getAllQuestionMapping,
        getQuestionMappingForProduct,
        deleteFromProductQuestionMapping,
        getLinkedProductQuestion,
        saveLinkedProductQuestion,
        getAllProductMetaInformation,
        saveTriggersForProductQuestion,
        saveTriggersForProductSubQuestion,
        getTriggersForProductQuestion,
        getTriggersForProductSubQuestion,
        swapOrderOnQuestionInProductMapping,
        saveQuestionMappingForProduct,
        deleteAndMakeSubquestionProduct,
        deleteSubQuestionOfProduct,
        setSubQuestionTriggerOfProduct,
        addPretriggerToQuestion,
        savePretriggerQuestion,
        deletePretriggerQuestion,
        getProductsWithInsuranceType,
        getAllComparisonCriteria,
        getComparisonCriteriaMapping,
        addComparisonCriteriaToMapping,
        getComparisonCriteriaMappingForInsuranceType,
        updateComparisonCriteriaMapping,
        getcomparisonCriterias,
        addComparisonCriteria,
        saveComparisonCriteria,
        getSinglecomparisonCriteria,
        addProductComparison,
        deleteComparisonFromProduct,
        changeProductDisplayVersion
      }
    }
  })();
  
(function() {

    'use strict';

    angular.module('application').
    service('modelsService', modelsService);

    modelsService.$inject = ['$http','$rootScope', 'APIService', '$resource'];


    function modelsService($http, $rootScope, APIService, $resource) {

        // Models
        var models;

        /* Get Modelxxs */
        function getModel(key){
            if(models){
                return models[key];
            } else {
                console.log('Models not defined');
            }
        }

        /* Sync Two Models */
        function syncTwoModels(old_model, new_model){
            console.log('Syncing models..', old_model, new_model);
            for(let key in new_model){
              if(typeof new_model === 'object'){
                var key_new = !(key in old_model);
                console.log('key:', key, 'is new:', key_new);
                if(key_new === true){
                  old_model[key] = new_model[key];
                }
                else if(old_model[key] && new_model[key]){
                  syncTwoModels(old_model[key], new_model[key]);
                }
              }
            }
            console.log('OLD', old_model);
        }

        /* Merge Models */
        function mergeModels(last_sync, old_model, new_model){
          if(!last_sync) {
            old_model['last_sync'] = $rootScope.genService.getTimestamp();
          } else {
            console.log('Last Sync', old_model['last_sync']);
          }
        }

        /* Sync Models With API */
        function syncModels(company_uid, success, err_call){
            console.log('Syncing Models');
            APIService.getResourceWithParams(APIService.SEP.MODEL_SYNC, {company_uid: company_uid}, function(data){
                models = data;
                console.log('Models:',models);
                success();
            }, function(error){
                console.log(error);
                err_call();
            });
        }


        /* Return Stuff */
        return {
            syncModels : syncModels,
            getModel : getModel,
            syncTwoModels : syncTwoModels,
            mergeModels : mergeModels
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('offerService', offerService);

    offerService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];

    /* Endpoints */
    const prefix = 'offers';
    const comparisons_suffix = 'comparisons';
    const documents_suffix = 'documents';
    const policy_prefix = 'policies';
    const company_prefix = 'companies';
    const insurance_types_suffix = 'insurance_types';
    const specific_suffix = 'specific';
    const basic_suffix = 'basic';
    const general_suffix = 'general';
    const version_suffix = 'display_version';

    /* Constants */
    const included_options = {
      [true]: 'Included',
      [false]: 'Not Included'
    };

    const type_basic = basic_suffix;
    const type_general = general_suffix;
    const type_specific = specific_suffix;

    const general_keys = {
      body: 'Bodily Injury',
      property: 'Property Damage',
      financial: 'Financial Loss'
    };

    function offerService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {

        /* Get Offer Requests */
        function getOfferRequests(callback, err_call){
          requestService.getDataOnceEqualTo([prefix], 'status', 'requested', callback, err_call);
        }

        /* Get Offers for Company */
        function getOffersForCompany(company_uid, callback, err_call){
          requestService.getDataOnceEqualTo([prefix], 'company', company_uid, callback, err_call);
        }

        /* Generate Report */
        function generateReport(offer_uid, callback, err_call){
          requestService.updateData([prefix, offer_uid], {insurance_report_generated:false}, callback, err_call)
        }

        /* Get All Offers */
        function getAllOffers(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        /* Get Single Offer */
        function getSingleOffer(offer_uid, callback, err_call){
          requestService.getDataOnce([prefix, offer_uid], callback, err_call);
        }

        /* Save Offer */
        function saveOffer(offer_uid, data, callback, err_call){
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Save Comparison */
        function saveComparison(offer_uid, comparison_uid, data, callback, err_call){
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], data, callback, err_call, false)
        }

        /* Lock To Advisor */
        function lockToAdvisor(employee_email, offer_uid, callback, err_call){
          var data = {
            advisor : employee_email
          };
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Mark Offer as Offered */
        function markOfferAsOffered(display_version, offer_uid, callback, err_call){
          if(display_version && display_version===2){
            var data = {
              status : 'pushed',
              advisor : null,
              notified : false,
              display_version: 2
              // not_requested : true for unrequested email
            };  
          } else {
            var data = {
              status : 'pushed',
              advisor : null,
              notified : false
              // not_requested : true for unrequested email
            };
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Mark Offer as Offered No Notification */
        function markOfferAsOfferedDontNotify(display_version, offer_uid, callback, err_call){
          if(display_version && display_version===2){
            var data = {
              status : 'pushed',
              advisor : null,
              notified : true,
              display_version: 2
              // not_requested : true for unrequested email
            };
          } else {
            var data = {
              status : 'pushed',
              advisor : null,
              notified : true
              // not_requested : true for unrequested email
            };
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Finalize Offer*/
        function finalizeOffer(company_uid, policy_template, offer_uid, subject, callback, err_call){
          // Policy Template is the offer comparison that is chosen
          requestService.getMultipleKeys([{
            name:'policy', route:[policy_prefix]
          },{
            name:'offer', route:[prefix, offer_uid]
          },{
            name:'company', route:[company_prefix, company_uid, policy_prefix]
          }], keys => {
            var newUpdate = {}, now = requestService.getTimestamp();
            let policy = policy_template;
            policy.from_offer = offer_uid;
            policy.status = 'pending';
            policy.subject = subject;
            policy.documents = null;
            policy.created_at = now;
            policy.updated_at = now;
            policy.company = company_uid;
            newUpdate[keys['policy'].route+keys['policy'].key] = policy;
            newUpdate[keys['company'].route+keys['policy'].key] = true;
            newUpdate[company_prefix+'/'+company_uid+'/'+prefix+'/'+offer_uid] = null;
            newUpdate[keys['offer'].route+'status'] = 'finalized';
            newUpdate[keys['offer'].route+'updated_at'] = now;
            newUpdate[keys['offer'].route+'advisor'] = null;
            requestService.multiPathUpdate(newUpdate, () => {
              callback({policy_uid:keys['policy'].key});
            }, err_call);
          });
        }

        /* Revoke Offer */
        function revokeOffer(offer_uid, callback, err_call){
          var data = {
            status : 'requested'
          }
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Unlock to Advisor */
        function unlockForAdvisor(offer_uid, callback, err_call){
          const data = {
            advisor : null
          };
          requestService.updateData([prefix, offer_uid], data, callback, err_call, true)
        }

        /* Add Comparison */
        function addComparison(offer_uid, comparison_data = {}, callback, err_call){
          requestService.pushData([prefix, offer_uid, comparisons_suffix], comparison_data, callback, err_call);
        }

        function updateComparison(offer_uid, comparison_uid, comparison_data, callback, err_call) {
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], comparison_data, callback, err_call)
        }

        /* Delete Comparison */
        function deleteComparison(offer_uid, comparison_uid, callback, err_call){
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid], callback, err_call)
        }

        function deleteOfferInsuranceType(offer_uid, comparison_uid, insurance_type_uid, callback, err_call) {
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid], callback, err_call);
        }

      function deleteOfferCriteria(offer_uid, comparison_uid, insurance_type_uid, criterion_uid, callback, err_call) {
        requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, specific_suffix, criterion_uid], callback, err_call);
      }

        /* Remove Document */
        function removeDocument(offer_uid, comparison_uid, document_uid, callback, err_call){
          requestService.deleteData([prefix, offer_uid, comparisons_suffix, comparison_uid, 'documents', document_uid], callback, err_call)
        }

        /* Write File Value */
        function writeFileValue(offer_uid, comparison_uid, newFile, callback, err_call){
          const data = {
            file : newFile
          };
          requestService.updateData([prefix, offer_uid, comparisons_suffix, comparison_uid], data, callback, err_call)
        }

        /* Upload File */
        function uploadFile(fileItem, company_uid, callback, err_call){
          fileService.uploadFileWithCustomEndpoint([prefix, company_uid], "", fileItem, callback, err_call);
        }

        /* Download File */
        function downloadFile(file_url, company_uid, callback, err_call){
          fileService.downloadFileWithCustomEndpoint([prefix, company_uid], file_url, callback, err_call);
        }

        /* Download Report */
        function downloadReport(file_name, company_uid, callback, err_call){
          console.log('downloadReport', file_name, company_uid);
          // fileService.downloadFileWithCustomEndpoint([documents_suffix, company_uid], file_name, callback, err_call);
          // requestService.postLiimexResourceWithParams($rootScope.backoffice_url + '/api/download/office', {}, callback, err_call);
        }

        /* Add Document to Offer */
        function addDocumentToOffer(updateWithDocument, document_object, offer_uid, comparison_uid, callback, err_call) {
          updateWithDocument[prefix+'/'+offer_uid+'/'+comparisons_suffix+'/'+comparison_uid+'/'+documents_suffix+'/'+document_object.key] = document_object;
          requestService.multiPathUpdate(updateWithDocument, callback, err_call);
        }

        /**
         * Update single value in the offer comparisons
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} err_call
         * @return {undefined}
         */
        function updateSingleValue(params, callback, err_call) {
            const {offer_uid, comparison_uid, insurance_type_uid, criteria_uid, value_type, key, value} = params;
            let path = '';
            switch (value_type) {
                case type_basic:    path = [prefix, offer_uid, comparisons_suffix, comparison_uid, basic_suffix];
                                    break;

                case type_general:  path = [prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, general_suffix];
                                    break;

                case type_specific: path = [prefix, offer_uid, comparisons_suffix, comparison_uid, insurance_types_suffix, insurance_type_uid, specific_suffix, criteria_uid];
                                    break;
                default: return err_call({
                    error: 'Unknown value type. Expected: "basic", "general" or "specific"',
                    received: value_type});
            }
            console.log('attempting on');
            console.log(path);
            console.log({[key]: value});
            return requestService.updateData(path, {[key]: value}, callback, err_call)
        }

        /* Request Multiple Offers At Once */
        function requestMultipleOffers(keyList, company_uid, callback, err_call) {
          const keyArray = [];
          keyList.forEach(insuranceTypeKey => {
            keyArray.push({
              name:insuranceTypeKey+'offer',
              route:[prefix]
            });
          });

          requestService.getMultipleKeys(keyArray, keys => {
            var newUpdate = {}, now = requestService.getTimestamp();
            keyList.forEach(insuranceTypeKey => {
              newUpdate[company_prefix+'/'+company_uid+'/'+prefix+'/'+keys[insuranceTypeKey+'offer'].key] = true;
              newUpdate[keys[insuranceTypeKey+'offer'].route+keys[insuranceTypeKey+'offer'].key] = {
                company: company_uid,
                status: 'requested',
                notified: 'true',
                display_version: 2,
                insurance_report_generated: false,
                subject: insuranceTypeKey,
                created_at: now,
                updated_at: now,
                notified: false
              };
            });
            requestService.multiPathUpdate(newUpdate, callback, err_call);
          });
        }

        /* Get Offer Options */
        function getOfferOptions(){
          return { included_options, general_keys }
        }

        /* Change Display Version */
        function changeDisplayVersion(offer, offer_uid, callback, err_call){
          // offer.display_version = 2;
          for(var key in offer.comparisons){
            offer.comparisons[key].basic = {
              carrier : offer.comparisons[key].carrier || null,
              main_renewal_date : offer.comparisons[key].end_date || null,
              premium : offer.comparisons[key].premium || null,
              start_date : offer.comparisons[key].start_date || null,
              insurance_tax : 19
            }
            delete offer.comparisons[key].carrier;
            delete offer.comparisons[key].end_date;
            delete offer.comparisons[key].start_date;
            delete offer.comparisons[key].premium;
          }
          requestService.updateData([prefix, offer_uid], offer, callback, err_call);
        }


        /* Return Stuff */
        return {
          getOfferRequests,
          saveOffer,
          lockToAdvisor,
          unlockForAdvisor,
          writeFileValue,
          uploadFile,
          downloadFile,
          getSingleOffer,
          addComparison,
          updateComparison,
          deleteComparison,
          deleteOfferInsuranceType,
          deleteOfferCriteria,
          markOfferAsOffered,
          revokeOffer,
          getAllOffers,
          downloadReport,
          getOffersForCompany,
          addDocumentToOffer,
          removeDocument,
          finalizeOffer,
          generateReport,
          requestMultipleOffers,
          getOfferOptions,
          saveComparison,
          changeDisplayVersion,
          markOfferAsOfferedDontNotify,
          updateSingleValue
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('APIService', APIService);

    APIService.$inject = ['$rootScope', '$resource'];

    /* Endpoints */
    var EP = {};
    EP.mailroom = '/api/mailroom';

    /* Main Service Function */
    function APIService($rootScope, $resource) {

        /*************************************/
        /*      Get Resource With Params     */
        /*************************************/
        function getResourceWithParams(endpoint, params, callback, err_call){
            var new_resource = $resource(endpoint);
            var resource_call = new_resource.get(params, function(response) {
                var data = response.data;
                callback(data);
            },
            function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /*************************************/
        /*      Get Resource Without Params   */
        /*************************************/
        function getResourceWithoutParams(endpoint, callback, err_call){
            var new_resource = $resource(endpoint);
            var resource_call = new_resource.get(function(response) {
                var data = response.data;
                callback(data);
            },
            function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Return Stuff */
        return {
            EP: EP,
            getResourceWithParams : getResourceWithParams,
            getResourceWithoutParams : getResourceWithoutParams
        }
    }
})();

(function() {

  'use strict';

  angular.module('application').
  service('policyService', policyService);

  policyService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','requestService', 'fileService'];

  /* Endpoints */
  const prefix = 'policies';
  const company_prefix = 'companies';
  const documents_suffix = 'documents';
  const insuranceTypes_suffix = 'insurance_types';
  const general_suffix = 'general';
  const specific_suffix = 'specific';

  function policyService($rootScope, firebase, $firebaseObject, activityService, requestService, fileService) {

    /* Get Policies For a Company */
    function getPolicies(company_uid, callback, err_call){
      requestService.getDataOnceEqualTo([prefix], 'company', company_uid, callback, err_call);
    }

    /* Get Single Policy */
    function getSinglePolicy(policy_id, callback, err_call){
      requestService.getDataOnce([prefix, policy_id], function(policies){
        callback(policies)
      }, function(error){
        err_call(error);
      });
    }

    /* Register Existing Policy */
    function registerExistingPolicy(company_uid ,file_url, callback, err_call){
      requestService.getMultipleKeys([{
        name:'company', route:[company_prefix, company_uid, prefix]
      },{
        name:'policy', route:[prefix]
      }], keys => {
        var newUpdate = {}, now = requestService.getTimestamp();
        newUpdate[keys['company'].route+keys['policy'].key] = true;
        newUpdate[keys['policy'].route+keys['policy'].key] = {
          display_version:2, basic : {insurance_tax : 19}, file:file_url, company:company_uid, status:'pending', created_at:now, updated_at:now
        }
        requestService.multiPathUpdate(newUpdate, callback, err_call);
      });
    }

    /* Get All Policies */
    function getAllPolicies(callback, err_call){
      requestService.getDataOnce([prefix], callback, err_call);
    }

    /* Get Pending Policies */
    function getPoliciesWithFilter(sort_param, sort_value, callback, err_call){
      requestService.getDataOnceEqualTo([prefix], sort_param, sort_value, callback, err_call);
    }

    /* Overwrite File Value */
    function overwriteFileValue(policy_uid, newFile, callback, err_call){
      var data = {
        file : newFile
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Save Policy */
    function savePolicy(policy_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    function saveGeneralCriteria(policy_uid,insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid, general_suffix], data, callback, err_call)
    }

    function saveSpecificCriteria(policy_uid,insurance_uid, data, callback, err_call){
      requestService.updateData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid,specific_suffix], data, callback, err_call)
    }

    function deleteAdditionalModule(policy_uid,insurance_uid, callback, err_call){
      requestService.deleteData([prefix, policy_uid, insuranceTypes_suffix, insurance_uid],callback,err_call);
    }

    /* Mark Policy Deleted */
    function deletePolicy(policy_uid, callback, err_call){
      var data = {
        status : 'deleted',
        notified : true
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Deleted */
    function makePending(policy_uid, callback, err_call){
      var data = {
        status : 'pending'
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Active */
    function activatePolicy(policy_uid, display_version = null, callback, err_call){
      var data = {
        status : 'active',
        display_version,
        extractor : null,
        notified : false
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Mark Policy Active */
    function activatePolicyNoEmail(policy_uid, display_version = null, callback, err_call){
     var data = {
        status : 'active',
        display_version,
        extractor : null,
        notified : true
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call, true)
    }

    /* Lock To Extractor */
    function lockToExtractor(employee_email, policy_uid, callback, err_call){
      var data = {
        extractor : employee_email
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Remove Document */
    function removeDocument(policy_uid, document_uid, callback, err_call){
      requestService.deleteData([prefix, policy_uid, 'documents', document_uid], callback, err_call)
    }

    /* Unlock to Extractors */
    function unlockForExtractors(policy_uid, callback, err_call){
      var data = {
        extractor : null
      }
      requestService.updateData([prefix, policy_uid], data, callback, err_call)
    }

    /* Add Document to Policy */
    function addDocumentToPolicy(updateWithDocument, document_object, policy_uid, callback, err_call) {
      updateWithDocument[prefix+'/'+policy_uid+'/'+documents_suffix+'/'+document_object.key] = document_object;
      requestService.multiPathUpdate(updateWithDocument, callback, err_call);
    }

    /* Upload Policy */
    function uploadPolicy(fileItem, company_uid, callback, err_call){
      fileService.uploadFileWithCustomEndpoint([prefix, company_uid], "", fileItem, callback, err_call);
    }

    /* Download Policy */
    function downloadPolicy(file_url, company_uid, callback, err_call){
      fileService.downloadFileWithCustomEndpoint([prefix, company_uid], file_url, callback, err_call);
    }

    /* Change Display Version */
    function changeDisplayVersion(policy, policy_uid, callback, err_call){
      policy.display_version = 2;
      policy.insurance_types = {};
      policy.basic = {
        premium : policy.premium || 0,
        carrier : policy.carrier || null,
        policy_number : policy.policy_number || null,
        start_date : policy.start_date || null,
        main_renewal_date: policy.end_date || null,
        insurance_tax : 19
      }
      policy.insurance_types[policy.subject] = {general:{maximisation:1}}
      requestService.updateData([prefix, policy_uid], policy, callback, err_call);
    }

    /* Return Stuff */
    return {
      registerExistingPolicy,
      getPolicies,
      getAllPolicies,
      getSinglePolicy,
      savePolicy,
      overwriteFileValue,
      deletePolicy,
      makePending,
      activatePolicy,
      uploadPolicy,
      downloadPolicy,
      lockToExtractor,
      unlockForExtractors,
      getPoliciesWithFilter,
      addDocumentToPolicy,
      removeDocument,
      activatePolicyNoEmail,
      saveGeneralCriteria,
      saveSpecificCriteria,
      deleteAdditionalModule,
      changeDisplayVersion
    }
  }
})();

(function() {

    'use strict';

    angular.module('application').
    service('productService', productService);

    productService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService', ];

    
    function productService($rootScope, firebase, $firebaseObject, requestService) {


        /* Return Stuff */
        return {
          
        }
    }
})();
(function() {

    'use strict';

    angular.module('application').
    service('recommendationService', recommendationService);

    recommendationService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'activityService','companyService','requestService'];


    /* Endpoints */
    const prefix = 'recommendations';


    /* Main Service */
    function recommendationService($rootScope, firebase, $firebaseObject, activityService, companyService,requestService) {

        /* get recommendation for the given company id */
        function getRecommendationsForCompId(companyid,callback,err_call){
            companyService.getCompanyInformation(companyid,company=>{
                if(company.recommendations){
                    let recommendationid = Object.keys(company.recommendations)[0];
                    if(recommendationid) {
                      getRecommendations(recommendationid, callback, err_call);
                    }
                }
            }, err_call);
        }

        /*  get recommendations for the given recommendation id */
        function getRecommendations(recommendation_uid, callback, err_call){
            requestService.getDataOnce([prefix,recommendation_uid],callback,err_call);
        }

        /* Return Stuff */
        return {
            getRecommendationsForCompId: getRecommendationsForCompId,
            getRecommendations: getRecommendations
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('requestService', requestService);

    requestService.$inject = ['$resource','$rootScope', 'firebase', '$firebaseObject', 'authService', 'modelsService'];

    /* Get Dynamic Endpoint */
    /* Needed to reset endpoint between users sign in/out */
    function getEndpoint(routeList, route_only){
      var route = "";
        for(var i in routeList){
          route = route.concat(routeList[i],'/');
        }
        console.log('Requested Route:',route);
        if(route_only === true){
          return {route:route}
        } else {
          return {ref:firebase.database().ref().child(route), route:route};
        }
    }

    /* Get Time */
    function getTimestamp(){
      return firebase.database.ServerValue.TIMESTAMP
    }

    /* Service Function */
    function requestService($resource, $rootScope, firebase, $firebaseObject) {

      /* Hold Data Tempeorarily */
        var temp_hold_data = null;

        /* Add Timestamps */
        function addTimestamps(data){
            data.created_at       = firebase.database.ServerValue.TIMESTAMP;
            data.updated_at       = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }

        /* Update Timestamps */
        function updateTimestamps(data){
            data.updated_at       = firebase.database.ServerValue.TIMESTAMP;
            return data;
        }

        /* Push Data */
        function pushData(route, data, callback, err_call){
          data = addTimestamps(data);
          var dataRef = getEndpoint(route).ref;
          dataRef.push(data).then(function(response){
              if(callback){
                callback(response);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Update Data */
        function updateData(route, data, callback, err_call, add_timesamps){
          data = add_timesamps === true ? updateTimestamps(data) : data;
          var dataRef = getEndpoint(route).ref;
          dataRef.update(data).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Set Data */
        // Requires manual UID
        function setData(route, data, callback, err_call, add_timesamps){
          data = add_timesamps === true ? addTimestamps(data) : data;
          var dataRef = getEndpoint(route).ref;
          dataRef.set(data).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Delete Data */
        function deleteData(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.remove().then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Data Once */
        function getDataOnce(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.once('value').then(function(snapshot) {
              var data = snapshot.val()
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Data On Value */
        function getDataOnValue(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          dataRef.on('value', function(snapshot, prevChildKey) {
              var data = snapshot.val()
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }


        /* Get Data Once And Cache */
        function getDataOnceAndCache(route, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          if(temp_hold_data !== null && temp_hold_data !== undefined){
            callback(temp_hold_data)
          }else {
            dataRef.once('value').then(function(snapshot) {
                var data = snapshot.val();
                temp_hold_data = data;
                if(callback){
                  callback(data);
                }
            }, function(error){
                console.error(error);
                if(err_call){
                  err_call(error);
                }
            });
          }
        }

        /* Get Data Once With Filter */
        function getDataOnceEqualTo(route, sort_param, sort_value, callback, err_call){
          var dataRef = getEndpoint(route).ref;
          if(!sort_value) { return }

          dataRef.orderByChild(sort_param).equalTo(sort_value).once('value').then(function(snapshot) {
              var data = snapshot.val();
              if(callback){
                callback(data);
              }
          }, function(error){
              console.error(error);
              if(err_call){
                err_call(error);
              }
          });
        }

        // Get Multiple Keys
        function getMultipleKeys(route_list, callback){
          var key_list = {};
          for(var key in route_list){
            var endpoint = getEndpoint(route_list[key].route);
            var dataRef = endpoint.ref.push();
            var dataKey = dataRef.key;
            key_list[route_list[key].name] = {};
            key_list[route_list[key].name].route = endpoint.route;
            key_list[route_list[key].name].key = dataKey;
          }
          callback(key_list);
        }

        // Multu Path update
        function multiPathUpdate(newUpdate, callback, err_call){
          firebase.database().ref().update(newUpdate).then(function(result){
            if(callback){
              callback(newUpdate);
            }
          }, function(error){
              if(err_call){
                err_call(error);
              }
          });
        }

        /* Get Liimex API Request With Params */
        function getLiimexResourceWithParams(endpoint, params, callback, err_call){
            $resource(endpoint).get(params, function(response) {
                callback(response.data);
            }, function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Post to  Liimex API Request With Params */
        function postLiimexResourceWithParams(endpoint, params, callback, err_call){
            $resource(endpoint).save(params, function(response) {
                callback(response);
            }, function(error){
                if(err_call){
                    err_call();
                }
                console.error('Server Error', error);
            });
        }

        /* Attach and Update */
        function attachAndUpdate(route_list, callback, err_call){
          var newUpdate = {};
          var attach_for = {};
          var attach_to = {};

          for(var key in route_list){
            var item = route_list[key];
            var endpoint = getEndpoint(item.route);
            var dataRef = endpoint.ref.push();
            var dataKey = dataRef.key;
            if(item.attach_to === true || item.no_new_key){ dataKey='' }
            endpoint.route = endpoint.route + dataKey;
            newUpdate[endpoint.route] = item.data;
            if(item.attach_to){
              attach_to[endpoint.route] = item;
            }
            if(item.attach_for){
              attach_for[endpoint.route] = {item:item, dataKey:dataKey};
            }
          }

          for(var to_key in attach_to){
            for(var for_key in attach_for){
              if(attach_to[to_key].name === attach_for[for_key].item.attach_on){
                delete newUpdate[to_key];
                if(attach_for[for_key].item.overwrite_existing){
                  var new_key = to_key+attach_for[for_key].item.under;
                  newUpdate[new_key] = {};
                  newUpdate[new_key][attach_for[for_key].dataKey] = true;
                } else {
                  var new_key = to_key+attach_for[for_key].item.under+'/'+attach_for[for_key].dataKey;
                  newUpdate[new_key] = true;
                }
              }
            }
          }

          // Do a deep-path update
          firebase.database().ref().update(newUpdate).then(function(){
            if(callback){
              callback();
            }
          }, function(error){
              if(err_call){
                err_call(error);
              }
          });
        }


        /* Return Stuff */
        return {
          pushData : pushData,
          updateData : updateData,
          getDataOnce : getDataOnce,
          deleteData : deleteData,
          setData : setData,
          getDataOnceEqualTo : getDataOnceEqualTo,
          getDataOnceAndCache : getDataOnceAndCache,
          getLiimexResourceWithParams : getLiimexResourceWithParams,
          getMultipleKeys : getMultipleKeys,
          multiPathUpdate : multiPathUpdate,
          getTimestamp : getTimestamp,
          postLiimexResourceWithParams : postLiimexResourceWithParams,
          getDataOnValue : getDataOnValue,
          attachAndUpdate: attachAndUpdate
        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('userService', userService);

    userService.$inject = ['$rootScope', 'firebase', '$firebaseObject', 'authService', 'modelsService', 'requestService'];

    /* Endpoints */
    const prefix = 'admins';
    const prefix_non_admin = 'users';
    const prefix_companies = 'companies';


    function userService($rootScope, firebase, $firebaseObject, authService, modelsService, requestService) {

        /* Create User */
        function createUser(params, firebase_user, callback, err_call){

            var new_admin_model = {
              first_name : "N/A",
              last_name : "N/A",
              email : "N/A",
              rights : 0
            }

            // Do not ship password
            if(params.password)
                params.password = null;

            Object.assign(new_admin_model, params);

            requestService.setData([prefix, firebase_user.uid], new_admin_model, callback, err_call);
        }

        /* Get User Information */ //admin hardcoded in prefix
        function getUserInformation(user_id, success, err_call){
            requestService.getDataOnce([prefix, user_id], function(user){
              if(user === null){
                err_call({message: "account locked"});
                $rootScope.genService.showDefaultErrorMsg('Account locked. Please contact admin');
              } else if (user.rights === 0) {
                err_call({message: "account locked"});
                $rootScope.genService.showDefaultErrorMsg('Account locked. Please contact admin');
              } else {
                success(user);
              }
            }, err_call);
        }

        /* Get All Users */
        function getAllUsers(callback, err_call){
          requestService.getDataOnce([prefix], callback, err_call);
        }

        // Update User Information
        function updateUserInformation(user_id, prev_parmas, params, callback, reauth, err_call){
            if(prev_parmas.email !== params.email){
                console.log('Detected: New Email');
                authService.getCurrentUser(function(userObj){
                  authService.changeEmail(userObj, params.email, function(){
                      requestService.setData([prefix, user_id], params, callback, err_call);
                  }, function(error){
                      if(error.code === 'auth/requires-recent-login'){ // REPLACE WITH: Reauth Code
                          reauth();
                      }
                      else{
                          err_call(error)
                      }
                  });
                });
            }else{
                requestService.setData([prefix, user_id], params, callback, err_call);
            }
        }

        /* Update Admin Rights*/
        function updateAdminRights(user_id, level, callback, err_call){
            requestService.updateData([prefix, user_id], {rights : level}, callback, err_call)
        }

        /* Delete User */
        function deleteUser(user_id, callback, err_call){
          requestService.deleteData([prefix,user_id], callback, err_call);
        }

        /* Get Users Of Company */
        function getUsersOfCompany(company_uid, callback, err_call){
          requestService.getDataOnce([prefix_companies,company_uid,prefix_non_admin], callback, err_call);
        }

        /*Return user info*/
        function returnUserInfo(userid, callback, err_call){
          console.log('requesting ',userid,prefix_non_admin)
          requestService.getDataOnce([prefix_non_admin, userid], callback, err_call);
        }


        /* Return Stuff */
        return {
            createUser : createUser,
            getUserInformation: getUserInformation,
            updateUserInformation : updateUserInformation,
            getAllUsers : getAllUsers,
            updateAdminRights : updateAdminRights,
            deleteUser : deleteUser,
            getUsersOfCompany : getUsersOfCompany,
            returnUserInfo : returnUserInfo

        }
    }
})();

(function() {

    'use strict';

    angular.module('application').
    service('userrequestService', userrequestService);

    userrequestService.$inject = ['$rootScope', 'firebase', '$firebaseObject','requestService','companyService','metaService','offerService'];

    function userrequestService($rootScope, firebase, $firebaseObject, requestService, companyService,metaService,offerService) {

        /* Endpoints */
        const user_request_prefix = 'user_requests';
        const users_prefix = "users";
        const employments_prefix = "employments";
        const companies_prefix = "companies";
        const address_prefix = "addresses";
        const recommendation_prefix = "recommendations";
        const industry_suffix = "industry_codes";
        const activity_suffix = 'activities';
        const insurance_questionnaire_suffix = 'insurance_questionnaire';

        let userRequestid = "";
        let generalInsuranceQuestions = [];
        let insuranceTypesGroups = {};
        let insuranceTypesGroups_tracker = [];
        let confirmatoryInsuranceQuestions = [];
        let specificInsuranceTypesGroups = {};
        let allInsuranceQuestions = [];
        let allInsuranceQuestionMappings =[];
        let selectedMappingObjs = [];

        /* Delete Request */
        function deleteRequest(request_uid){
            requestService.deleteData([user_request_prefix, request_uid], success => {
                console.log('Request deleted');
            }, error => {
                console.error(error);
            })
        }

        function saveUserRequest(data,callback, err){
            data.processed = false;
            if(data.email.includes('liimex')){
                err({error_message: 'Dont use @Liimex emails here !'})
                return;
            }
            requestService.pushData([user_request_prefix], data, new_user_request =>{
                userRequestid = new_user_request.key;
                setTimeout(()=>{getUserRequest(new_user_request.key,updated_user_request=>{
                    if(!updated_user_request.error && updated_user_request.uid){
                        callback(updated_user_request.uid, userRequestid);
                    }
                    else {
                        err(updated_user_request);
                    }
                    //deleteRequest(new_user_request.key);
                },err)},3000);
            },err);
        }

        function getUserRequest(key,callback, err){
            requestService.getDataOnce([user_request_prefix,key],callback,err);
        }

        function getUserObj(key,callback,err){
            requestService.getDataOnce([users_prefix,key],callback,err);
        }

        function getCompanyFromUserid(uid,callback,err){
            requestService.getDataOnce([employments_prefix,uid],employee=>{
                let compId = employee.company;
                requestService.getDataOnce([companies_prefix, compId],(company)=>{
                    let addressKey;
                    let address;
                    if(company && company.addresses){
                        addressKey = Object.keys(company.addresses)[0];
                        requestService.getDataOnce([address_prefix,addressKey],(addressObj)=> {
                            address = addressObj
                            callback(company,compId,address,addressKey);
                        },e=>{
                            console.log("error fetching address",e);
                            callback(company,compId);
                        });
                    }
                    else
                        callback(company,compId)
                },err);
            },err);
        }

        function updateUserAndCompany(user_request_id, uid, user_params, company_params, address_params , callback, err, compId, addressId){
            address_params.country = "Deutschland";
            company_params.users = {};
            company_params.users[uid] = true;
            company_params.liimex_id = generateCompanyId(company_params, address_params);
            requestService.getMultipleKeys([{
                name:'user', route:[users_prefix]
            },{
                name:'company', route:[companies_prefix]
            },{
                name:'address', route:[address_prefix]
            },{
                name:'employment', route:[employments_prefix]
            }], keys => {
                var newUpdate = {}, now = requestService.getTimestamp();
                let compKey = compId? compId: keys['company'].key;
                let addressKey = addressId? addressId: keys['address'].key;
                user_params.created_at = now;
                user_params.updated_at = now;
                user_params.welcome_email_sent = true;

                address_params.company = compKey;
                address_params.main = true;
                company_params.addresses = {};
                company_params.created_at = now;
                company_params.updated_at = now;
                company_params.addresses[addressKey] = true
                newUpdate[keys['user'].route+uid] = user_params;
                newUpdate[keys['address'].route+addressKey] = address_params;
                newUpdate[keys['company'].route+compKey] = company_params;
                newUpdate[keys['employment'].route+uid] = {
                    company:compKey, created_at:now, updated_at:now
                };
                requestService.multiPathUpdate(newUpdate, data => {
                    deleteRequest(user_request_id);
                    callback(data, keys['company'].key, keys['address'].key)
                }, err);
            });
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

        const getUserRequestKey = () => userRequestid;

        function updateIndustryCodes(company_uid, industry_codes, callback, err_call){
            requestService.setData([companies_prefix, company_uid, industry_suffix], industry_codes, callback, err_call);
        }

        function updateActivityAndRecommendation(company_uid, activity_keys,industry_codes, callback, err_call){
            requestService.getMultipleKeys([{
                name:'recommendation', route:[recommendation_prefix]
            }], recommendationKey => {
                var newUpdate = {}, recommendation_params ={}, company_params = {} , now = requestService.getTimestamp();
                recommendation_params.created_at = now;
                recommendation_params.updated_at = now;
                recommendation_params.company = company_uid;
                recommendation_params.activities = activity_keys;
                recommendation_params.industry_codes = industry_codes;
                recommendation_params.processed = false;

                newUpdate[recommendationKey['recommendation'].route+recommendationKey['recommendation'].key] = recommendation_params;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'updated_at'] = now;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'activities'] = activity_keys;
                newUpdate[companies_prefix+'/'+company_uid+'/'+'recommendations'] = {[recommendationKey['recommendation'].key]: true};

                requestService.multiPathUpdate(newUpdate, callback, err_call);
            });
        }

        function getRecommendationForCompanyID(companyid, callback, err){
            companyService.getCompanyInformation(company=>{
                if(company.recommendations){
                    let recommendations = Object.keys(company.recommendations)[0];
                }

            },err);
        }

        function getQsForSelectedInsurances(selectedInsuranceTypes,companyid,callback,err_call){
            let selectedInsuranceQuestions =[];
            selectedMappingObjs = [];
            allInsuranceQuestionMappings = [];
            metaService.getAllQuestionMapping((_allInsuranceQuestionMappings)=>{
                for(var index in _allInsuranceQuestionMappings ){
                    var mappingsObj = _allInsuranceQuestionMappings[index].questions;
                    allInsuranceQuestionMappings.push({insuranceType: index, mappings: mappingsObj});
                }
                /*add all the general question to the selected mappings list*/
                selectedMappingObjs.push(allInsuranceQuestionMappings.find((mappingsObj)=> mappingsObj.insuranceType == 'general'));
                selectedMappingObjs.push(allInsuranceQuestionMappings.find((mappingsObj)=> mappingsObj.insuranceType == 'confirmatory'));
                selectedInsuranceTypes.forEach((selectedInsuranceType)=>{
                    let _selectedMappingObj = allInsuranceQuestionMappings.find((mappingsObj)=>mappingsObj.insuranceType == selectedInsuranceType);
                    if(_selectedMappingObj)
                        selectedMappingObjs.push(_selectedMappingObj);
                });
                selectedMappingObjs.forEach((selectedMObj)=>{
                    for(var qKey in selectedMObj.mappings){
                        var mainQuestion = getInsuranceQsByQId(qKey);
                        mainQuestion.subQuestions = [];
                        mainQuestion.insurance_type = selectedMObj.insuranceType;
                        mainQuestion.order = selectedMObj.mappings[qKey].order;
                        if(selectedMObj.mappings[qKey].children){
                            for(var childQKey in selectedMObj.mappings[qKey].children){
                                var childQuestion = getInsuranceQsByQId(childQKey);
                                childQuestion.trigger = selectedMObj.mappings[qKey].children[childQKey].trigger;
                                mainQuestion.subQuestions.push(childQuestion);
                            }
                        }
                        selectedInsuranceQuestions.push(mainQuestion);
                    }
                });
                /*remove duplicate question objs*/
                selectedInsuranceQuestions = [...new Set(selectedInsuranceQuestions)];

                assignExistingAnswersForQuesions(selectedInsuranceQuestions,companyid,()=>{
                    divideQuestionTypes(selectedInsuranceQuestions);
                    if(callback)
                        callback({generalInsuranceQuestions:generalInsuranceQuestions,confirmatoryInsuranceQuestions:confirmatoryInsuranceQuestions,specificInsuranceTypesGroups: specificInsuranceTypesGroups});
                },err_call);
            });
        }

        function assignExistingAnswersForQuesions(questionsArr,companyid,callback,err_call){
            companyService.getCompanyInformation(companyid,company=>{
                if(company.insurance_questionnaire){
                    questionsArr.forEach((question)=>{
                        if(company.insurance_questionnaire && company.insurance_questionnaire[question.key])
                            question.answer = company.insurance_questionnaire[question.key].answer;
                        if(question.subQuestions)
                            question.subQuestions.forEach((subQ)=>{
                            if(company.insurance_questionnaire && company.insurance_questionnaire[subQ.key]){
                                subQ.answer = company.insurance_questionnaire[subQ.key].answer;
                                if(!question.triggerMarchingSubQs)
                                    question.triggerMarchingSubQs = [];
                                question.triggerMarchingSubQs.push(subQ);
                            }
                        });
                        if(question.triggerMarchingSubQs)
                            question.triggerMarchingSubQs = [...new Set(question.triggerMarchingSubQs)];
                    });
                }
                if(callback)
                    callback();
            },err_call);
        }

        function divideQuestionTypes(selectedInsuranceQuestions) {
            generalInsuranceQuestions = [];
            specificInsuranceTypesGroups = {};
            insuranceTypesGroups_tracker = [];
            confirmatoryInsuranceQuestions = [];

            selectedInsuranceQuestions.forEach((insuranceQuestion)=>{
                if(insuranceQuestion.insurance_type == 'general')
                    generalInsuranceQuestions.push(insuranceQuestion);
                else if(insuranceQuestion.insurance_type == 'confirmatory')
                    confirmatoryInsuranceQuestions.push(insuranceQuestion);
                else{
                    if(!specificInsuranceTypesGroups[insuranceQuestion.insurance_type]){
                        specificInsuranceTypesGroups[insuranceQuestion.insurance_type] =[];
                        insuranceTypesGroups_tracker.push(insuranceQuestion.insurance_type);
                    }
                    specificInsuranceTypesGroups[insuranceQuestion.insurance_type].push(insuranceQuestion);
                }
            });
        }

        /* returns the insurance question object for the given question ids*/
        function getInsuranceQsByQId(qkey){
            return allInsuranceQuestions.find((insuranceQuestion)=>insuranceQuestion.key == qkey);
        }

        /* Update insurance questions and answers */
        function updateInsuraceAnswer(company_uid, question_uid, params, callback, err_call){
            requestService.updateData([companies_prefix, company_uid, insurance_questionnaire_suffix, question_uid], params, callback, err_call);
        }

        /* Request Multiple Offers At Once */
        function requestMultipleOffers(insuranceKeys, company_uid, callback, err_call) {
            offerService.requestMultipleOffers(insuranceKeys, company_uid, callback, err_call);
        }

        /* self executing function */
        (()=>{
            metaService.getAllInsuranceQuestions((_allInsuranceQuestions)=> {
                for(var index in _allInsuranceQuestions){
                    allInsuranceQuestions.push({key:index,insuranceQuestionObj: _allInsuranceQuestions[index]});
                }
            },error=>{console.log("error while fetching all insurance questions",error)});

        })()



        /* Return Stuff */
        return {
            saveUserRequest:saveUserRequest,
            getUserObj:getUserObj,
            getUserRequest: getUserRequest,
            getCompanyFromUserid: getCompanyFromUserid,
            getUserRequestKey: getUserRequestKey,
            updateUserAndCompany: updateUserAndCompany,
            updateIndustryCodes: updateIndustryCodes,
            updateActivityAndRecommendation: updateActivityAndRecommendation,
            getQsForSelectedInsurances: getQsForSelectedInsurances,
            updateInsuraceAnswer: updateInsuraceAnswer,
            requestMultipleOffers: requestMultipleOffers
        }

    }
})();

angular.module('application').constant('dynamicConfig', {

  /* Firebase Configuration */
  firebase_config : {
    //start-replace-by-prestart//
      apiKey: "AIzaSyDsndvxeuQeO77vZXVI1ac1vZyvX_4gcNs",
      authDomain: "liimex-development.firebaseapp.com",
      databaseURL: "https://liimex-development.firebaseio.com",
      storageBucket: "liimex-development.appspot.com",
      messagingSenderId: "933217935420"
    //end-replace-by-prestart//
  },

  /* Backoffice Service Url*/
  //start-replace-by-prestart//
      backoffice_url : "https://f939d8-06df-49d3-84bd-064190.herokuapp.com"
  //end-replace-by-prestart//

});
