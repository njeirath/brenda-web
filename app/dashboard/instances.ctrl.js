'use strict';

angular.module('dashboard')
.controller('instancesCtrl', ['$scope', 'awsService', '$interval', '$http', function($scope, awsService, $interval, $http) {
	var sortOrder = ['running', 'terminated'];
	
	$scope.statusMapper = function(item) {
		var index = sortOrder.indexOf(item.instanceStatus)
		
		if (index !== -1) {
			return index;
		} else {
			return sortOrder.length;
		}
	};
	
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
	
	$scope.resetErrors = function() {
		$scope.errors = {
				ConfigError: false,
				CredentialsError: false,
				OtherError: false
		};	
	};
	
	function handleTags(row, tags) {
		tags.forEach(function(tag) {
			if (tag.Key === 'brenda-queue') {
				$scope.queues.addQueue(tag.Value);
				row.queueUrl = tag.Value;
			} else if(tag.Key === 'brenda-dest') {
				$scope.buckets.addBucket(tag.Value);
				row.destinationBucket = tag.Value;
			}
		});
	}
	
	$scope.updateTable = function() {
		$scope.resetErrors();
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
				
				handleTags(row, item.Tags);
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
					
					handleTags(row, instance.Tags);
				});
			});
			
			$scope.instances.table = newRows;
		}).then($scope.getInstanceStats, function(error) {
			if(error.code === 'ConfigError') {
				$scope.errors.ConfigError = error.message;
			} else if(error.code === 'CredentialsError') {
				$scope.errors.CredentialsError = error.message;
			} else {
				$scope.errors.OtherError = String(error);
			}
		});
	};
	
	function getInstanceFile(ip, file) {
		return $http.get('http://' + ip + '/' + file, {params: {d: new Date().valueOf()}});
	}
	
	$scope.getInstanceStats = function() {
		$scope.instances.table.forEach(function(item) {
			if (item.instanceStatus === 'running') {
				(function(row) {
					getInstanceFile(row.instanceIp, 'uptime.txt')
					.then(function(data){
						var pieces = data.data.split(/\s/);
						row.uptime = parseFloat(pieces[0]);
						var complete = parseFloat(pieces[7]);
						row.tasksCompleted = Number.isNaN(complete) ? 0.0 : complete;
						row.cpuLoad = parseFloat(pieces[2]);
						
						return getInstanceFile(row.instanceIp, 'log_tail.txt');
					})
					.then(function(data) {
						var lines = data.data.split("\n");
						var partial = 0;
						
						lines.forEach(function(line) {
							var match = line.match(/Path Tracing Tile (\d+)\/(\d+)/);
							if (match) {
								partial = match[1] / match[2];
							}
						});
						
						row.tasksCompleted += partial;
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
	
	$scope.$on('brenda-web-credentials-updated', function() {
		$scope.updateTable();
	});

}]);