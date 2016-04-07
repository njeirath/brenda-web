'use strict';

angular.module('awsSetup')
.controller('JobSetupCtrl', ['$scope', 'awsService', '$uibModal', '$interval', 'localStorageService', function($scope, awsService, $uibModal, $interval, localStorageService) {
	$scope.queues = [];
	$scope.queueSize = 'No Queue Selected';
	
	$scope.workTemplate = 'blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a';
	$scope.startFrame = 1;
	$scope.endFrame = 240;
	
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
				$scope.queueAlerts.push({type: 'danger', msg: 'Create ' + queueName + ': ' + err});
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
		awsService.sendToQueue($scope.queue.workQueue, $scope.workList());
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
