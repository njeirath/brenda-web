'use strict';

// Declare app level module which depends on views, and components
angular.module('brendaWeb', [
  'myApp.version',
  'ui.router',
  'ui.bootstrap',
  'ui.router.tabs',
  'LocalStorageModule',
  'awsSetup'
]).
config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('cfg', {
    url: '',
    controller: 'StartCtrl',
    templateUrl: 'start/start.html'
  }).state('cfg.aws', {
  	url: 'awsSetup',
  	templateUrl: 'awsSetup/awsSetup.html',
  	controller: 'AwsSetupCtrl'
  }).state('cfg.s3', {
  	url: 's3Setup',
  	templateUrl: 'awsSetup/s3Setup.html'
  });
}]);
