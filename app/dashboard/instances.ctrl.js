'use strict';

angular.module('dashboard')
.controller('instancesCtrl', ['$scope', 'awsService', '$interval', '$http', function($scope, awsService, $interval, $http) {	
	function createRow() {
		return {
			spotId: '-',
			instanceId: '-',
			spotPrice: '-',
			instanceType: '-',
			spotStatus: '-',
			instanceStatus: '-',
			instanceDns: '-',
			instanceIp: '-',
			uptime: '-',
			tasksCompleted: '-',
			cpuLoad: '-',
			queueUrl: '',
			destinationBucket: ''
		};
	}
	
	function updateInstance(row, instance) {
		row.instanceStatus = instance.State.Name;
		row.instanceIp = instance.PublicIpAddress;
		row.instanceDns = instance.PublicDnsName;
		row.instanceType = instance.InstanceType;
	}
	
	$scope.updateTable = function() {
		var newRows = [];
		
		var instanceDetailsDeferred = awsService.getInstanceDetails();
		
		awsService.getSpotRequests()
		.then(function(spotInstances) {
			var instanceIds = [];
			spotInstances.SpotInstanceRequests.forEach(function(item) {
				var sir = item.SpotInstanceRequestId;
				var instId = item.InstanceId;
				
				if (instId) {
					instanceIds.push(instId);
				}
				
				//Didn't find the row so lets add it
				var row = createRow();
				newRows.push(row);
				
				row.spotId = sir;
				row.instanceId = instId;
				row.spotPrice = item.SpotPrice;
				row.spotStatus = item.Status.Code;
				
				item.Tags.forEach(function(tag) {
					if (tag.Key == 'brenda-queue') {
						$scope.queues.addQueue(tag.Value);
						row.queueUrl = tag.Value;
					} else if(tag.Key == 'brenda-dest') {
						$scope.buckets.addBucket(tag.Value);
						row.destinationBucket = tag.Value;
					}
				});
			});
			return instanceIds;
		}).then(function(instanceIds) {
			if (instanceIds.length > 0) {
				return awsService.getInstanceDetails(instanceIds);
			} else {
				return null;
			}
		}).then(function(instances) {
			if (instances) {
				instances.Reservations.forEach(function(reservation) {
					reservation.Instances.forEach(function(instance) {
						var instId = instance.InstanceId;
						var row = newRows.find(function(r) {return instId == r.instanceId;});
						updateInstance(row, instance);
					});
				});
			}
			return instanceDetailsDeferred;
		}).then(function(instances) {
			instances.Reservations.forEach(function(reservation) {
				reservation.Instances.forEach(function(instance) {
					var instId = instance.InstanceId;
					var row = createRow();
					row.instanceId = instId;
					
					updateInstance(row, instance);
					newRows.push(row);
					
					instance.Tags.forEach(function(tag) {
						if (tag.Key == 'brenda-queue') {
							$scope.queues.addQueue(tag.Value);
							row.queueUrl = tag.Value;
						} else if(tag.Key == 'brenda-dest') {
							$scope.buckets.addBucket(tag.Value);
							row.destinationBucket = tag.Value;
						}
					});
				});
			});
			
			$scope.instances.table = newRows;
		}).then($scope.getInstanceStats, function(error) {
			console.log(error);
		});
	};
	
	$scope.getInstanceStats = function() {
		$scope.instances.table.forEach(function(item) {
			if (item.instanceStatus == 'running') {
				(function(row) {
					$http.get('http://' + row.instanceIp + '/uptime.txt', {params: {d: new Date().valueOf()}}).then(function(data){
						var pieces = data.data.split(/\s/);
						row.uptime = parseFloat(pieces[0]);
						var complete = parseFloat(pieces[7]);
						row.tasksCompleted = Number.isNaN(complete) ? 0.0 : complete;
						row.cpuLoad = parseFloat(pieces[2]);
					}, function(err) {
						row.uptime = 'unavailable';
						row.tasksCompleted = 'unavailable';
						row.cpuLoad = 'unavailable';
					});
				}(item));
			}
		});
	};
	
	$scope.updateTable();
	
	var instancesTimer = $interval(function() {
		$scope.updateTable();
	}, 30000);
	
	$scope.$on('$destroy', function() {
		$interval.cancel(instancesTimer);
	});

}]);