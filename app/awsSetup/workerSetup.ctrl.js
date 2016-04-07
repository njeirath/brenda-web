'use strict';

angular.module('awsSetup')
.controller('WorkerSetupCtrl', ['$scope', 'localStorageService', '$http', 'awsService', '$q', function($scope, localStorageService, $http, awsService, $q) {	
	//Get list of AMIs to choose from
	$scope.amis = [];
	
	$http.get('amiList.json').then(function(response) {
		var i = 0;
		Object.keys(response.data).forEach(function(item) {
			$scope.amis[i] = {id: i, name: item, version: response.data[item]['blenderVersion']}; 
			i++;
		});
		
		$scope.amiSelect = '';	
	});
	
	$scope.setAmi = function(name) {
		$scope.amiSelect = name;
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
	
	$scope.updateTypes = function() {
		$q.all([$http.get('instances.json'), awsService.getAvailabilityZones()])
		.then(function(results) {
			$scope.instances = [];
			var instances = results[0];
			var azList = results[1];
			
			instances.data.forEach(function(instance) {
				var prices = {};
				
				azList.forEach(function(az) {
					prices[az] = undefined;
				})
				
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
		return 	'#!/bin/bash\n' +
				'# run Brenda on the EC2 instance store volume\n' +
				'B="/mnt/brenda"\n' +
				'sudo apt-get update\n' +
				'sudo apt-get -y install nginx\n' +
				"sudo sed -i '29 i\\ add_header 'Access-Control-Allow-Origin' '*';' /etc/nginx/sites-enabled/default\n" +
				'sudo echo "* * * * * root tail -n1000 /mnt/brenda/log > /usr/share/nginx/www/log_tail.txt" >> /etc/crontab\n' +
				'sudo echo "* * * * * root cat /proc/uptime /proc/loadavg $B/task_count > /usr/share/nginx/www/uptime.txt" >> /etc/crontab\n' +
				'if ! [ -d "$B" ]; then\n' +
				'  for f in brenda.pid log task_count task_last DONE ; do\n' +
				'    ln -s "$B/$f" "/root/$f"\n' +
				'    sudo ln -s "$B/$f" "/usr/share/nginx/www/$f"\n' +
				'  done\n' +
				'fi\n' +
				'sudo service nginx start\n' +
				'export BRENDA_WORK_DIR="."\n' +
				'mkdir -p "$B"\n' +
				'cd "$B"\n' +
				'/usr/local/bin/brenda-node --daemon <<EOF\n' +
				'AWS_ACCESS_KEY=' + awsService.getKeyId() + '\n' +
				'AWS_SECRET_KEY=' + awsService.getKeySecret() + '\n' +
				'BLENDER_PROJECT=' + $scope.s3.projectSource + '\n' +
				'WORK_QUEUE=sqs://' + $scope.queue.workQueue.split('/').pop() + '\n' +
				'RENDER_OUTPUT=' + $scope.s3.frameDestination + '\n' +
				'DONE=shutdown\n' +
				'EOF\n';

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
		if ($scope.instanceType === 'spot') {
			awsService.requestSpot($scope.amiSelect, $scope.sshKey, 'brenda-web', $scope.generateScript(), $scope.instance.size, $scope.spotPrice, $scope.numInstances, 'one-time', $scope.queue.workQueue, $scope.s3.frameDestination.split('//').pop(), $scope.showStatus);
		} else {
			//requestOndemand: function(ami, keyPair, securityGroup, userData, instanceType, count)
			awsService.requestOndemand($scope.amiSelect, $scope.sshKey, 'brenda-web', $scope.generateScript(), $scope.instance.size, $scope.numInstances, $scope.queue.workQueue, $scope.s3.frameDestination.split('//').pop(), $scope.showStatus);
		}
	};
	
	$scope.updateTypes();
	$scope.refreshKeyPairs();
}]);
