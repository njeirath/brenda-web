'use strict';

// Declare app level module which depends on views, and components
angular.module('brendaWeb', [
  'myApp.version',
  'ui.router',
  'ui.bootstrap',
  'LocalStorageModule',
  'awsSetup'
]).
config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('cfg', {
    url: '',
    controller: 'StartCtrl',
    templateUrl: 'index.html'
  }).state('cfg.aws', {
  	url: '/awsSetup',
  	templateUrl: 'awsSetup/awsSetup.html',
  	controller: 'AwsSetupCtrl'
  }).state('cfg.job', {
  	url: '/jobSetup',
  	templateUrl: 'awsSetup/jobSetup.html'
  });
}]);
