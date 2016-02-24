'use strict';

var StartCtrl = ['$rootScope', '$state', '$scope', '$stateParams', function($rootScope, $state, $scope) {

  $scope.initialise = function() {

    $scope.go = function(state) {
      $state.go(state);
    };

    $scope.tabData   = [
      {
        heading: 'AWS Settings',
        route:   'cfg.aws'
      },
      {
      	heading: 'S3 Setup',
      	route: 'cfg.s3'
      }
    ];
  };

  $scope.initialise();
}];

angular.module('brendaWeb').controller('StartCtrl', StartCtrl);
