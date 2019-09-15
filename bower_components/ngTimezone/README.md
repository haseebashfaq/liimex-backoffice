ngTimezone
==========

An angular service for detecting the clients timezone. 

This is an angular wrapper for the jsTimezoneDetect (https://bitbucket.org/pellepim/jstimezonedetect/overview) library. 

Install:

    $ bower install ngTimezone

Sample Usage:

1) Import the ngTimezone module into your angular app...

    angular.module('myApp', ['ngTimezone']).config(...);

2) Import the $timezone service into your controller, directive, or service and get the timezone

    angular.module('myApp')
      .directive('myDirective', function ($timezone) {  
        var timezone = $timezone.getName(); // sample output: 'America/New_York'
      });

You can use this value to query your database for a datetime with the appropriate timezone offset using MySQL's CONVERT_TZ method or an equivalent.
