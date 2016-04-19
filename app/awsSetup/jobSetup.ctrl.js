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
.controller('JobSetupCtrl', ['$scope', 'awsService', '$uibModal', '$interval', 'localStorageService', function($scope, awsService, $uibModal, $interval, localStorageService) {
	$scope.queues = [];
	$scope.queueSize = 'No Queue Selected';
	
	$scope.workTemplate = 'blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a';
	$scope.startFrame = 1;
	$scope.endFrame = 240;
	
	$scope.shuffle = Boolean(localStorageService.get('shuffleQ'));
	
	$scope.$watch('shuffle', function(value) {
		localStorageService.set('shuffleQ', value);
	});
	
	awsService.getQueues();
	
	$scope.$watch('queue.workQueue', function(value) {
		if (value !== '') {
			localStorageService.set('workQueue', value);
		}
	});
	
	$scope.$on('brenda-web-credentials-updated', function(event, data) {
		$scope.refreshQueues();
	});
	
	$scope.refreshQueues = function() {
		awsService.getQueues();
	};
	
	$scope.queueAlerts = [];
	
	$scope.closeAlert = function(index) {
	    $scope.queueAlerts.splice(index, 1);
	};
	
	$scope.addQueue = function() {
		var queueModal = $uibModal.open({
			animation: true,
			templateUrl: 'awsSetup/createQueue.html',
			controller: 'CreateQueueCtrl'
		});
		
		queueModal.result.then(function(queueName) {
			awsService.createQueue(queueName)
			.then(function() {
				$scope.queueAlerts.push({type: 'success', msg: 'Queue ' + queueName + ' successfully created! (Note: may take up to 60 seconds for queue to be available)'});
				
				$interval(awsService.getQueues, 30000, 2);
			}, function(err) {
				$scope.queueAlerts.push({type: 'danger', msg: 'Create ' + queueName + ': ' + String(err)});
			});
		});
	};
	
	$scope.workList = function() {
		var list = [];
		
		for (var i = parseInt($scope.startFrame, 10); i <= parseInt($scope.endFrame, 10); i++) {
			var cmd = $scope.workTemplate.replace("$START", i).replace("$END", i).replace("$STEP", 1);
			list.push(cmd);
		}
		
		return list;
	};
	
	$scope.sendWork = function() {
		var list = $scope.workList();
		
		if ($scope.shuffle) {
			for (var i = list.length - 1; i >= 0; i--) {
				var randomIndex = Math.floor(Math.random()*(i+1));
				
				var iItem = list[randomIndex];
				list[randomIndex] = list[i];
				list[i] = iItem;
			}
		}
		
		awsService.sendToQueue($scope.queue.workQueue, list);
	};
	
	$scope.clearQueue = function() {
		awsService.clearQueue($scope.queue.workQueue);
	};
	
	$scope.sendStatus = {
				total: 0,
				success: 0,
				failed: 0,
				inFlight: 0
	};
	
	$scope.$on('aws-sqs-send-update', function(event, data) {
		$scope.sendStatus = data;
	});
	
	$scope.$on('aws-sqs-success', function(event, args) {
		$scope.queues = [];
		
		args.QueueUrls.forEach(function(entry) {
			$scope.queues.push(entry);
		});
		
		$scope.queue.workQueue = localStorageService.get('workQueue');
		$scope.$digest();
	});
}]);
