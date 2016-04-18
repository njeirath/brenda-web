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
		frameDestination: localStorageService.get('frameDestination'),
		isEbsSource: function() {
			return $scope.s3.projectSource.match(/^[eE][bB][sS]:\/\//) ? true : false;
		}
	};
	
	//Persist source/destination when changed
	$scope.$watch('s3.projectSource', function(newVal) {
		localStorageService.set('projectSource', newVal);
	});
	
	$scope.$watch('s3.frameDestination', function(newVal) {
		localStorageService.set('frameDestination', newVal);
	});
}]);
