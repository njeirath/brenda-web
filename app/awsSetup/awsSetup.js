'use strict';

angular.module('awsSetup')
.controller('S3Ctrl', ['$scope', 'localStorageService', function($scope, localStorageService) {
	
}])
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
}])
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
}])
.factory('awsService', ['$log', '$rootScope', 'localStorageService', 'aws', '$q', function($log, $rootScope, localStorageService, aws, $q) {	
	var startDate = startDate = new Date(new Date() - 6*60*60*1000);
	
	var service = {
		setCredentials: function(keyId, secret) {
			aws.config.update({accessKeyId: keyId, secretAccessKey: secret});
			$log.log("Set keyId: " + keyId + " and secret: " + secret);
		},
		getKeyId: function() {
			if (aws.config.credentials) {
				return aws.config.credentials.accessKeyId;
			} else {
				return '';
			}
		},
		getKeySecret: function() {
			if (aws.config.credentials) {
				return aws.config.credentials.secretAccessKey;
			} else {
				return '';
			}
		},
		setRegion: function(region) {
			aws.config.region = region;
			$log.log("Set region: " + region);
		},
		getRegion: function() {
			return aws.config.region;
		},
		testCredentials: function() {
			var ec2 = new aws.EC2();
			
			var deferred = $q.defer();
			
			ec2.describeKeyPairs({}, function(err, data) {
				if (err) {
					deferred.reject(String(err));
					$log.log("Error with credentials: " + err);
					$rootScope.$broadcast('aws-login-error', String(err));
				} else {
					deferred.resolve();
					$rootScope.$broadcast('aws-login-success');
				}
			});
			
			return deferred.promise;
		},
		getQueues: function() {
			var sqs = new aws.SQS();
			sqs.listQueues({}, function(err, data) {
				if (err) {
					$rootScope.$broadcast('aws-sqs-error', String(err));
				} else {
					$rootScope.$broadcast('aws-sqs-success', data);
				}
			});
		},
		sendToQueue: function(queueUrl, data) {
			localStorageService.set('awsQueue', queueUrl);
			var sqs = new aws.SQS();
			
			var sendStatus = {
				total: data.length,
				success: 0,
				failed: 0,
				inFlight: 0,
				copy: function() {
					return {
						total: this.total,
						success: this.success,
						failed: this.failed,
						inFlight: this.inFlight 
					};
				}
			};
			
			$rootScope.$broadcast('aws-sqs-send-update', sendStatus.copy());
			
			var entries = [];
			
			data.forEach(function(item, i) {
				entries.push( {
					MessageBody: btoa(item),
					Id: String(i)
				});
				
				if ((entries.length === 10) || ( i === (data.length -1))) {
					sendStatus.inFlight += entries.length;
					$rootScope.$broadcast('aws-sqs-send-update', sendStatus.copy());
					
					(function() {
						var params = {
							Entries: entries,
							QueueUrl: queueUrl
						};
						
						sqs.sendMessageBatch(params, function(err, data) {
							if (err) {
								sendStatus.failed += params.Entries.length;
								sendStatus.inFlight -= params.Entries.length;
							} else {
								sendStatus.success += data.Successful.length;
								sendStatus.failed += data.Failed.length;
								sendStatus.inFlight -= data.Successful.length;
								sendStatus.inFlight -= data.Failed.length;
							}
							
							$rootScope.$broadcast('aws-sqs-send-update', sendStatus.copy());
						});
					}());
					
					
					entries = [];
				}
			});
		},
		getQueue: function() {
			return localStorageService.get('awsQueue');
		},
		clearQueue: function(queueUrl) {
			var sqs = new aws.SQS();
			
			sqs.purgeQueue({QueueUrl: queueUrl}, function(err, data) {
				
			});
		},
		getQueueSize: function(queueUrl) {
			var sqs = new aws.SQS();
			var params = {
				QueueUrl: queueUrl, 
				AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
			};
			
			var deferred = $q.defer();
			
			sqs.getQueueAttributes(params, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data.Attributes.ApproximateNumberOfMessages);
				}
			});
			
			return deferred.promise;
		},
		getKeyPairs: function(callback) {
			var ec2 = new aws.EC2();
			ec2.describeKeyPairs({}, function(err, data) {
				if (err) {
					$log.log(err);
					$rootScope.$broadcast('aws-ec2-error', String(err));
				} else {
					return callback(data);
				}
			});
		},
		getLaunchSpecification: function(ami, keyPair, securityGroup, userData, instanceType) {
			return {
				ImageId: ami,
				KeyName: keyPair,
				SecurityGroups: [securityGroup],
				UserData: btoa(userData),
				InstanceType: instanceType
			};
		},
		setTags: function(instances, tags, callback) {
			var params = {
				Resources: instances,
				Tags: tags
			};
			
			var ec2 = new aws.EC2();
			ec2.createTags(params, callback);
		},
		requestSpot: function(ami, keyPair, securityGroup, userData, instanceType, spotPrice, count, type, queueName, s3Destination, statusCallback) {
			var spec = this.getLaunchSpecification(ami, keyPair, securityGroup, userData, instanceType);
			
			var params = {
				// DryRun: true,
				SpotPrice: String(spotPrice),
				InstanceCount: parseInt(count, 10),
				LaunchSpecification: spec,
				Type: type
			};
			
			var self = this;
			
			var ec2 = new aws.EC2();
			ec2.requestSpotInstances(params, function(err, data) {
				if (err) {
					$log.log(err);
					statusCallback('danger', String(err));
				} else {
					$log.log(data);
					var spotRequests = data.SpotInstanceRequests.map(function(item) {
						return item.SpotInstanceRequestId;
					});
					self.setTags(spotRequests, [{Key: 'brenda-queue', Value: queueName}, {Key: 'brenda-dest', Value: s3Destination}], function(err, data) {
						if (err) {
							statusCallback('warning', 'Spot instances requested but could not set tags (may affect dashboard)');
						} else {
							statusCallback('success', 'Spot instances requested');
						}
					});
					
				}
			});
		},
		requestOndemand: function(ami, keyPair, securityGroup, userData, instanceType, count, queueName, s3Destination, statusCallback) {
			var spec = this.getLaunchSpecification(ami, keyPair, securityGroup, userData, instanceType);
			spec.MinCount = count;
			spec.MaxCount = count;
			spec.InstanceInitiatedShutdownBehavior = 'terminate';
			// spec.DryRun = true;
			
			var self = this;
			
			var ec2 = new aws.EC2();
			ec2.runInstances(spec, function(err, data) {
				if (err) {
					$log.log(err);
					statusCallback('danger', String(err));
				} else {
					$log.log(data);
					var instanceIds = data.Instances.map(function(item) {
						return item.InstanceId;
					});
					self.setTags(instanceIds, [{Key: 'brenda-queue', Value: queueName}, {Key: 'brenda-dest', Value: s3Destination}], function(err, data) {
						if (err) {
							statusCallback('warning', 'On demand instances requested but could not set tags (may affect dashboard)');
						} else {
							statusCallback('success', 'On demand instances requested');
						}
					});
				}
			});
		},
		getSpotRequests: function() {
			var ec2 = new aws.EC2();
			
			var deferred = $q.defer();
			ec2.describeSpotInstanceRequests({Filters: [{Name: 'tag-key', Values: ['brenda-queue']}]}, function(err, data) {
				if (err) {
					deferred.reject(err);
				} else {
					deferred.resolve(data);
				}
			});
			
			return deferred.promise;
		},
		getInstanceDetails: function(instanceList) {
			var ec2 = new aws.EC2();
			
			var deferred = $q.defer();
			var params = {};
			if (instanceList) {
				params.InstanceIds = instanceList;
			} else {
				params.Filters = [{Name: 'tag-key', Values: ['brenda-queue']}];
			}
			
			ec2.describeInstances(params, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data);
				}
			});
			
			return deferred.promise;
		},
		getSecurityGroups: function(groupName) {
			var ec2 = new aws.EC2();
			
			var deferred = $q.defer();
			ec2.describeSecurityGroups({GroupNames: [groupName]}, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data);
				}
			});
			
			return deferred.promise;
		},
		createSecurityGroup: function() {
			var ec2 = new aws.EC2();
			
			var deferred = $q.defer();
			
			var sgParams = {
				GroupName: 'brenda-web',
				Description: 'Security group used by brenda-web.com'
			};
			
			var ingressParams = {
				IpPermissions: [{
					FromPort: 22,
					IpProtocol: 'tcp',
					IpRanges: [{
						CidrIp: '0.0.0.0/0'
					}],
					ToPort: 22
				}, {
					FromPort: 80,
					IpProtocol: 'tcp',
					IpRanges: [{
						CidrIp: '0.0.0.0/0'
					}],
					ToPort: 80
				}, {
					FromPort: -1,
					IpProtocol: 'icmp',
					IpRanges: [{
						CidrIp: '0.0.0.0/0'
					}],
					ToPort: -1
				}]
			};
			
			
			ec2.createSecurityGroup(sgParams, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					ingressParams.GroupId = data.GroupId;
					ec2.authorizeSecurityGroupIngress(ingressParams, function(err, data) {
						if (err) {
							deferred.reject(String(err));
						} else {
							deferred.resolve();
						}
					});
					
				}
			});
			
			return deferred.promise;
		},
		createQueue: function(queueName) {
			var params = {
				QueueName: queueName,
				Attributes: {
					VisibilityTimeout: '120'
				}
			};
			
			var sqs = new aws.SQS();
			var deferred = $q.defer();
			
			sqs.createQueue(params, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data);
				}
			});
			
			return deferred.promise;
		},
		listObjects: function(bucket) {
			var deferred = $q.defer();
			var s3 = new aws.S3();
			
			s3.listObjects({Bucket: bucket}, function(err, data) {
				if (err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data);
				}
			});
			
			return deferred.promise;
		},
		getObjectUri: function(bucket, key) {
			var s3 = new aws.S3();
			return s3.getSignedUrl('getObject', {Bucket: bucket, Key: key});
		},
		getAvailabilityZones: function() {
			var deferred = $q.defer();
			var ec2 = new aws.EC2();
			
			ec2.describeAvailabilityZones({}, function(err, data) {
				if(err) {
					deferred.reject(String(err));
				} else {
					deferred.resolve(data.AvailabilityZones.map(function(item) {return item.ZoneName}));
				}
			})
			
			return deferred.promise;
		},
		getSpotPrices: function(nextToken) {
			var ec2 = new aws.EC2();
			
			var params = {
					Filters: [{Name: 'product-description', Values: ['Linux/UNIX']}],
					StartTime: startDate
			};
			
			if (nextToken) {
				params.NextToken = nextToken;
			}
			
			ec2.describeSpotPriceHistory(params, function(err, data) {
				if (err) {
					
				} else {
					$rootScope.$broadcast('aws-spotprice-update', data);
				}
			});
		}
	};
	
	return service;
}])
.factory('aws', [function() {
	return AWS;
}])
.filter('queueToName', function() {
    return function(url) {
        return url.split("/").pop();
    };
});
