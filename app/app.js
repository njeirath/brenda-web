'use strict';

// Declare app level module which depends on views, and components
angular.module('brendaWeb', [
  'myApp.version',
  'ui.router',
  'ui.bootstrap',
  'LocalStorageModule',
  'awsSetup',
  'duScroll'
]).
config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('root', {
    templateUrl: 'index.html'
  }).state('root.landing', {
  	url: '',
  	templateUrl: "landing.html"
  }).state('root.setup', {
  	templateUrl: 'jobSetup/jobSetup.partial.html',
  	controller: 'SetupCtrl'
  }).state('root.setup.view', {
  	url: '/setup',
  	views: {
  		'credentials': {templateUrl: 'awsSetup/awsSetup.html', controller: 'AwsSetupCtrl'},
  		'queue': {templateUrl: 'awsSetup/jobSetup.html', controller: 'JobSetupCtrl'},
  		's3': {templateUrl: 'awsSetup/s3Setup.html', controller: 'S3Ctrl'},
  		'workers': {templateUrl: 'awsSetup/workerSetup.html', controller: 'WorkerSetupCtrl'}
  	}
  });
}]);
