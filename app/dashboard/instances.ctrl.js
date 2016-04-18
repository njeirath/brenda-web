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

angular.module('dashboard')
.controller('instancesCtrl', ['$scope', 'awsService', '$interval', '$http', '$uibModal', function($scope, awsService, $interval, $http, $uibModal) {
	$scope.condensed = false;
	
	$scope.condenseFilter = function(item) {
		return $scope.condensed ? item.instanceStatus == 'running' : true; 
	}
	
	var sortOrder = ['running', 'pending', 'terminating', 'shutting-down', 'terminated'];
	
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
	
	$scope.terminate = function(instance) {
		$uibModal.open({
			animation: true,
			templateUrl: 'dashboard/terminateConfirm.dialog.html',
			controller: 'TerminateConfirmCtrl',
			resolve: {
				instance: function() {
					return instance;
				}
			}
		}).result.then(function() {
			var spot = instance.spotId;
			var inst = instance.instanceId;
			
			if ((spot !== undefined ) && (spot !== '-')) {
				awsService.cancelSpotRequest(spot);
			}
			
			awsService.terminateInstance(inst).then(function() {
				instance.instanceStatus = 'terminating';
			});
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