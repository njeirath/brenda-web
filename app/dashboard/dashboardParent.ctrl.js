'use strict';

angular.module('dashboard')
.controller('dashboardParentCtrl', ['$scope', 'awsService', '$interval', function($scope, awsService, $interval) {
	$scope.queues = {
		queues: [],
		
		addQueue: function(queueUrl) {
			var queue = this.queues.find(function(queue) {
				return queue.url == queueUrl;
			});
			if (!queue) {
				this.queues.push({url: queueUrl, size: '-'});
			}
		},
		updateSize: function() {
			this.queues.forEach(function(item) {
				(function(q) {
					awsService.getQueueSize(q.url).then(function(size) {
						q.size = size;
					}, function(err) {
						q.size = 'Error';
					});
				}(item));
			});
		}
	};
	
	$scope.instances = {
		table: []
	};
	
	var queueTimer = $interval(function() {
		$scope.queues.updateSize();
	}, 15000);
	
	$scope.$on('$destroy', function() {
		$interval.cancel(queueTimer);
	});
}]);
