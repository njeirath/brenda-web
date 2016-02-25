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
.controller('JobSetupCtrl', ['$scope', 'awsService', function($scope, awsService) {
	$scope.queues = [];
	
	awsService.getQueues();
	
	$scope.$on('aws-sqs-success', function(event, args) {
		$scope.queues = [];
		
		args.QueueUrls.forEach(function(entry) {
			$scope.queues.push({id: entry, name: entry.split("/").pop()});
		});
		
		$scope.$digest();
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
.factory('awsService', ['$log', '$rootScope', 'localStorageService', function($log, $rootScope, localStorageService) {
	var service = {
		setCredentials: function(keyId, secret) {
			AWS.config.update({accessKeyId: keyId, secretAccessKey: secret});
			$log.log("Set keyId: " + keyId + " and secret: " + secret);
			localStorageService.set('keyId', keyId);
			localStorageService.set('keySecret', secret);
		},
		getKeyId: function() {
			if (AWS.config.credentials) {
				return AWS.config.credentials.accessKeyId;
			} else {
				return '';
			}
		},
		getKeySecret: function() {
			if (AWS.config.credentials) {
				return AWS.config.credentials.secretAccessKey;
			} else {
				return '';
			}
		},
		setRegion: function(region) {
			AWS.config.region = region;
			$log.log("Set region: " + region);
			localStorageService.set('region', region);
		},
		getRegion: function() {
			return AWS.config.region;
		},
		testCredentials: function() {
			var ec2 = new AWS.EC2();
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
			var sqs = new AWS.SQS();
			sqs.listQueues({}, function(err, data) {
				if (err) {
					$rootScope.$broadcast('aws-sqs-error', String(err));
				} else {
					$rootScope.$broadcast('aws-sqs-success', data);
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
}]);