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
      	heading: 'Job Setup',
      	route: 'cfg.job'
      }
    ];
  };

  $scope.initialise();
}];

angular.module('brendaWeb').controller('StartCtrl', StartCtrl);
