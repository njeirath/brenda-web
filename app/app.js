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
  'dashboard'
]).
config(['$stateProvider', function($stateProvider) {
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
}])
.run(['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
	$window.ga('create', 'UA-74793002-1', 'auto');
	$rootScope.$on('$stateChangeSuccess', function (event) {
	    $window.ga('send', 'pageview', $location.path());
	});
}]);
