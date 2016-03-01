'use strict';

angular.module('awsSetup', [])
.controller('AwsSetupCtrl', ['$scope', 'awsService', function($scope, awsService) {
	$scope.awsRegion = awsService.getRegion();
	$scope.awsKeyId = awsService.getKeyId();
	$scope.awsSecret = awsService.getKeySecret();
	
	if (    ($scope.awsRegion) && ($scope.awsRegion != '') 
	     && ($scope.awsKeyId) && ($scope.awsKeyId != '') 
	     && ($scope.awsSecret) && ($scope.awsSecret != '')) {
	     	awsService.testCredentials();
	     }
	
	$scope.setCredentials = function() {
		awsService.setCredentials($scope.awsKeyId, $scope.awsSecret);
		awsService.setRegion($scope.awsRegion);
		awsService.testCredentials();
	};
}])
.controller('JobSetupCtrl', ['$scope', '$interval', 'awsService', function($scope, $interval, awsService) {
	$scope.queues = [];
	$scope.workQueue = '';
	$scope.queueSize = 'No Queue Selected';
	
	$scope.workTemplate = 'blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a';
	$scope.startFrame = 1;
	$scope.endFrame = 240;
	
	awsService.getQueues();
	
	$scope.updateQueueSize = function() {
		if(($scope.workQueue != '') && ($scope.workQueue != undefined)) {
			awsService.getQueueSize($scope.workQueue, function(size) {
				$scope.queueSize = size;
			});
		} else {
			$scope.queueSize = 'No Queue Selected';
		}
	};
	
	var timer = $interval(function() {
		$scope.updateQueueSize();
	}, 5000);
	
	$scope.$on('destroy', function() {
		$interval.cancel(timer);
	});
	
	$scope.workList = function() {
		var list = [];
		
		for (var i = parseInt($scope.startFrame); i <= parseInt($scope.endFrame); i++) {
			var cmd = $scope.workTemplate.replace("$START", i).replace("$END", i).replace("$STEP", 1);
			list.push(cmd);
		}
		
		return list;
	};
	
	$scope.sendWork = function() {
		awsService.sendToQueue($scope.workQueue, $scope.workList());
	};
	
	$scope.clearQueue = function() {
		awsService.clearQueue($scope.workQueue);
	};
	
	$scope.sendStatus = {
				total: 0,
				success: 0,
				failed: 0,
				inFlight: 0,
	};
	
	$scope.$on('aws-sqs-send-update', function(event, data) {
		$scope.sendStatus = data;
	});
	
	$scope.$on('aws-sqs-success', function(event, args) {
		$scope.queues = [];
		
		args.QueueUrls.forEach(function(entry) {
			$scope.queues.push({id: entry, name: entry.split("/").pop()});
		});
		
		$scope.$digest();
	});
}])
.controller('WorkerSetupCtrl', ['$scope', 'localStorageService', function($scope, localStorageService) {
	$scope.projectSource = localStorageService.get('projectSource');
	$scope.frameDestination = localStorageService.get('frameDestination');
	
	$scope.$watch('projectSource', function(newVal) {
		localStorageService.set('projectSource', newVal);
	});
	
	$scope.$watch('frameDestination', function(newVal) {
		localStorageService.set('frameDestination', newVal);
	});
}])
.directive('awsLoginStatus', [function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.addClass('alert alert-info');
			element.html("<b>Unchecked:</b> Credentials haven't been tested yet");
			
			scope.$on('aws-login-error', function(event, args) {
				element.removeClass('alert-info alert-danger alert-success').addClass('alert-danger');
				element.html('<b>Error:</b> ' + args);
			});
			
			scope.$on('aws-login-success', function(event, args) {
				element.removeClass('alert-info alert-danger alert-success').addClass('alert-success');
				element.html('<b>Success:</b> Credentials look good!');
			});
		}
	};
}])
.factory('awsService', ['$log', '$rootScope', 'localStorageService', 'aws', function($log, $rootScope, localStorageService, aws) {
	var service = {
		setCredentials: function(keyId, secret) {
			aws.config.update({accessKeyId: keyId, secretAccessKey: secret});
			$log.log("Set keyId: " + keyId + " and secret: " + secret);
			localStorageService.set('keyId', keyId);
			localStorageService.set('keySecret', secret);
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
			localStorageService.set('region', region);
		},
		getRegion: function() {
			return aws.config.region;
		},
		testCredentials: function() {
			var ec2 = new aws.EC2();
			ec2.describeKeyPairs({}, function(err, data) {
				if (err) {
					$log.log("Error with credentials: " + err);
					$rootScope.$broadcast('aws-login-error', String(err));
				} else {
					$rootScope.$broadcast('aws-login-success');
				}
			});
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
				
				if ((entries.length == 10) || ( i == (data.length -1))) {
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
					})();
					
					
					entries = [];
				}
			});
		},
		clearQueue: function(queueUrl) {
			var sqs = new aws.SQS();
			
			sqs.purgeQueue({QueueUrl: queueUrl}, function(err, data) {
				
			});
		},
		getQueueSize: function(queueUrl, callback) {
			var sqs = new aws.SQS();
			var params = {
				QueueUrl: queueUrl, 
				AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
			};
			
			sqs.getQueueAttributes(params, function(err, data) {
				if (err) {
					callback(String(err));
				} else {
					callback(data.Attributes.ApproximateNumberOfMessages);
				}
			});
		}
	};
	
	var storedKeyId = localStorageService.get('keyId');
	var storedKeySecret = localStorageService.get('keySecret');
	var storedRegion = localStorageService.get('region');
	
	if ((storedKeyId) && (storedKeyId != '') && (storedKeySecret) && (storedKeySecret != '')) {
		service.setCredentials(storedKeyId, storedKeySecret);
	}
	
	if ((storedRegion) && (storedRegion != '')) {
		service.setRegion(storedRegion);
	}
	
	return service;
}])
.factory('aws', [function() {
	return AWS;
}]);
