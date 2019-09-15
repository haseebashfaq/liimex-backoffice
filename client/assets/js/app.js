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
