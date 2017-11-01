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
.controller('WorkerSetupCtrl', ['$scope', 'localStorageService', '$http', 'awsService', '$q', '$analytics', function($scope, localStorageService, $http, awsService, $q, $analytics) {	
	//Get list of AMIs to choose from
	$scope.amis = [];

	$http.get('amiList.json').then(function(response) {
		
		response.data.amis.filter(function(item) {
			return item.region === awsService.getRegion()
		}).forEach(function(item) {
			var ami = {name: item.ami, version: item.blenderVersion}
			$scope.amis.push(ami); 
		});
		
		$scope.amiSelect = '';
	});
	
	$scope.setAmi = function(ami) {
		$scope.amiSelect = ami.name;
	};
	
	$scope.instanceType = 'spot';
	
	//Get list of instance types to choose from
	$scope.instances = [];
	
	$scope.getSelectedInstance = function() {
		return $scope.instances.find(function(inst) {
			return inst.name === $scope.instance.size
		})
	};
	
	$scope.$on('aws-spotprice-update', function(event, data) {
		data.SpotPriceHistory.forEach(function(price) {
			var instance = $scope.instances.find(function(inst) {
				return inst.name === price.InstanceType;
			});
			
			if (!instance) {
				console.log(price.InstanceType + " not found");
			} else {
				if (!instance.spotPrices[price.AvailabilityZone] || instance.spotPrices[price.AvailabilityZone].tstamp < price.Timestamp) {
					instance.spotPrices[price.AvailabilityZone] = {price: price.SpotPrice, tstamp: price.Timestamp};
				}
			}
		});
		
		if (data.NextToken) {
			awsService.getSpotPrices(data.NextToken);
		}
	});
	
	$scope.spotErrors = {};
	
	$scope.$on('aws-spotprice-error', function(event, data) {
		$scope.spotErrors.error = data;
	});
	
	$scope.updateTypes = function() {
		$q.all([$http.get('instances.json'), awsService.getAvailabilityZones()])
		.then(function(results) {
			$scope.instances = [];

			var instanceOrder = ["nano", "micro", "small", "medium", "large", "xlarge", "2xlarge", "4xlarge", "8xlarge", "10xlarge", "16xlarge", "32xlarge"];
			var instances = results[0].data.filter(function (i) {
				return i.location === awsService.getRegion();
            }).map(function (i) {
				return i.instanceType;
            }).sort(function (a, b) {
				var aPrefix = a.split(".")[0];
				var bPrefix = b.split(".")[0];
				if (aPrefix !== bPrefix) {
					return aPrefix.localeCompare(bPrefix);
				} else {
					var aSize = instanceOrder.indexOf(a.split(".")[1])
                    var bSize = instanceOrder.indexOf(b.split(".")[1])
					return aSize - bSize;
				}
            });
			var azList = results[1];
			
			instances.forEach(function(instance) {
				var prices = {};
				
				azList.forEach(function(az) {
					prices[az] = undefined;
				});
				
				$scope.instances.push({name: instance, spotPrices: prices});
			});
			
			awsService.getSpotPrices();
		});
	};
	
	$scope.numInstances = 1;
	
	//Get EC2 keypairs to choose from
	$scope.keys = [];
	
	$scope.refreshKeyPairs = function() {
		awsService.getKeyPairs(function(data) {
			$scope.keys = [];
			
			data.KeyPairs.forEach(function(keyPair) {
				$scope.keys.push(keyPair.KeyName);
			});
		});	
	};
	
	$scope.$on('brenda-web-credentials-updated', function(event, data) {
		$scope.updateTypes();
		$scope.refreshKeyPairs();
	});
	
	$scope.generateScript = function() {
		var script = '#!/bin/bash\n' +
				'# run Brenda on the EC2 instance store volume\n' +
				'B="/mnt/brenda"\n';
		
		if ($scope.s3.isEbsSource()) {
			script += 'sudo ln /dev/xvdf /dev/xvdf1\n' 
		}
		
		script += 'sudo apt-get update\n' +
				'sudo apt-get -y install nginx\n' +
				'sudo mkdir /root/www\n' +
				'chmod +x /root && chmod +x /root/www\n' +
				"sudo wget http://brenda-web.com/resources/nginx/default -O /etc/nginx/sites-enabled/default\n" +
				'sudo echo "* * * * * root tail -n1000 /mnt/brenda/log > /root/www/log_tail.txt" >> /etc/crontab\n' +
				'sudo echo "* * * * * root cat /proc/uptime /proc/loadavg $B/task_count > /root/www/uptime.txt" >> /etc/crontab\n' +
				'if ! [ -d "$B" ]; then\n' +
				'  for f in brenda.pid log task_count task_last DONE ; do\n' +
				'    ln -s "$B/$f" "/root/$f"\n' +
				'    sudo ln -s "$B/$f" "/root/www/$f"\n' +
				'  done\n' +
				'fi\n' +
				'sudo service nginx restart\n' +
				'export BRENDA_WORK_DIR="."\n' +
				'mkdir -p "$B"\n' +
				'cd "$B"\n' +
				'/usr/local/bin/brenda-node --daemon <<EOF\n' +
				'AWS_ACCESS_KEY=' + awsService.getKeyId() + '\n' +
				'AWS_SECRET_KEY=' + awsService.getKeySecret() + '\n' +
				'S3_REGION=' + awsService.getRegion() + '\n' +
            	'SQS_REGION=' + awsService.getRegion() + '\n' +
            	'EC2_REGION=' + awsService.getRegion() + '\n' +
				'BLENDER_PROJECT=' + $scope.s3.projectSource + '\n' +
				'WORK_QUEUE=sqs://' + $scope.queue.workQueue.split('/').pop() + '\n' +
				'RENDER_OUTPUT=' + $scope.s3.frameDestination + '\n' +
				'DONE=shutdown\n' +
				'EOF\n';
		
		return script;

	};
	
	$scope.statuses = [];
	
	$scope.showStatus = function (status, message) {
		$scope.statuses.pop();
		$scope.statuses.push({type: status, text: message});
		$scope.$digest();
	};
	
	$scope.instance = {
		size: ''
	}
	
	$scope.requestInstances = function() {
		//ami, keyPair, securityGroup, userData, instanceType, spotPrice, count, type
		$analytics.eventTrack('launchInstances', {instanceType: $scope.instanceType, instanceCount: $scope.numInstances})
		var snapshots = null;
		if ($scope.s3.isEbsSource()) {
			snapshots = [$scope.s3.projectSource.split('//').pop()];
		}
			
		if ($scope.instanceType === 'spot') {
			awsService.requestSpot($scope.amiSelect, $scope.sshKey, 'brenda-web', $scope.generateScript(), $scope.instance.size, snapshots, $scope.spotPrice, $scope.numInstances, 'one-time', $scope.queue.workQueue, $scope.s3.frameDestination.split('//').pop(), $scope.showStatus);
		} else {
			//requestOndemand: function(ami, keyPair, securityGroup, userData, instanceType, count)
			awsService.requestOndemand($scope.amiSelect, $scope.sshKey, 'brenda-web', $scope.generateScript(), $scope.instance.size, snapshots, $scope.numInstances, $scope.queue.workQueue, $scope.s3.frameDestination.split('//').pop(), $scope.showStatus);
		}
	};
	
	$scope.updateTypes();
	$scope.refreshKeyPairs();
}]);
