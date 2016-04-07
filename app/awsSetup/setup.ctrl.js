'use strict';

angular.module('awsSetup')
.controller('SetupCtrl', ['$scope', 'localStorageService', 'awsService', '$interval', function($scope, localStorageService, awsService, $interval) {
	//Queue setup
	$scope.queue = {
		workQueue: '',
		queueSize: '-'
	};
	
	$scope.updateQueueSize = function() {
		if(($scope.queue.workQueue !== '') && ($scope.queue.workQueue !== undefined)) {
			awsService.getQueueSize($scope.queue.workQueue)
			.then(function(size) {
				$scope.queue.queueSize = size;
			}, function(err) {
				$scope.queue.queueSize = 'Error';
			});
		} else {
			$scope.queue.queueSize = '-';
		}
	};
	
	var timer = $interval(function() {
		$scope.updateQueueSize();
	}, 5000);
	
	$scope.$on('$destroy', function() {
		$interval.cancel(timer);
	});

	//Load source/destination if it is stored
	$scope.s3 = {
		projectSource: localStorageService.get('projectSource'),
		frameDestination: localStorageService.get('frameDestination')
	};
	
	//Persist source/destination when changed
	$scope.$watch('s3.projectSource', function(newVal) {
		localStorageService.set('projectSource', newVal);
	});
	
	$scope.$watch('s3.frameDestination', function(newVal) {
		localStorageService.set('frameDestination', newVal);
	});
}]);
