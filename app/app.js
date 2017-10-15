//Brenda-Web -- Frontend for Blender
//Copyright (C) 2016 Nakul Jeirath
//
//Brenda-Web is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.
//
//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//You should have received a copy of the GNU General Public License
//along with this program.  If not, see <http://www.gnu.org/licenses/>. 

'use strict';

// Declare app level module which depends on views, and components
angular.module('brendaWeb', [
  'myApp.version',
  'ui.router',
  'ui.bootstrap',
  'LocalStorageModule',
  'awsSetup',
  'duScroll',
  'angulartics', 
  'angulartics.google.analytics',
  'dashboard',
  'environment'
]).
config(['$stateProvider', 'envServiceProvider', function($stateProvider, envServiceProvider) {
  $stateProvider.state('landing', {
  	url: '',
  	templateUrl: "landing.html"
  }).state('setup', {
  	templateUrl: 'jobSetup/jobSetup.partial.html',
  	controller: 'SetupCtrl'
  }).state('setup.view', {
  	url: '/setup',
  	views: {
  		'credentials': {templateUrl: 'awsSetup/awsSetup.html', controller: 'AwsSetupCtrl'},
  		'queue': {templateUrl: 'awsSetup/jobSetup.html', controller: 'JobSetupCtrl'},
  		's3': {templateUrl: 'awsSetup/s3Setup.html', controller: 'S3Ctrl'},
  		'workers': {templateUrl: 'awsSetup/workerSetup.html', controller: 'WorkerSetupCtrl'}
  	}
  }).state('dashboard', {
  	templateUrl: 'dashboard/dashboard.partial.html',
  	controller: 'dashboardParentCtrl'
  }).state('dashboard.view', {
  	url: '/dashboard',
  	views: {
  		'queues': {templateUrl: 'dashboard/queues.partial.html', controller: 'queuesCtrl'},
  		'instances': {templateUrl: 'dashboard/instances.partial.html', controller: 'instancesCtrl'},
  		'buckets': {templateUrl: 'dashboard/buckets.partial.html', controller: 'BucketCtrl'}
  	}
  })
  .state('tutorial', {
	  url: '/tutorial',
	  templateUrl: 'tutorial/tutorial.partial.html'
  });

  envServiceProvider.config({
	  domains: {
	  	development: ['localhost'],
	    production: ['brenda-web.com', '*.brenda-web.com']
	  }
  });
  envServiceProvider.check();
}])
.controller('NavCtrl', ['$scope', function($scope) {
	$scope.navbarCollapsed = true;
}])
.run(['$rootScope', '$location', '$window', 'envService', function($rootScope, $location, $window, envService) {
    if (envService.get() === "production") {
        $window.ga('create', 'UA-74793002-1', 'auto');
        $rootScope.$on('$stateChangeSuccess', function (event) {
            $window.ga('send', 'pageview', $location.path());
        });
    }
}]);
