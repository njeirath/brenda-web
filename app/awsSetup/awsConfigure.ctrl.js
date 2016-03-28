'use strict';

angular.module('awsSetup')
.controller('AwsConfigureCtrl', ['$scope', 'awsService', '$rootScope', '$uibModalInstance', 'localStorageService', function($scope, awsService, $rootScope, $uibModalInstance, localStorageService) {
	$scope.credentials = {
			awsRegion: awsService.getRegion(),
			awsKeyId: awsService.getKeyId(),
			awsSecret: awsService.getKeySecret()
	};
	
	$scope.credentialCheck = {
		status: 'info', 
		msg: 'AWS credentials not checked yet'
	};
	$scope.securityGroupCheck = {
		status: 'info', 
		msg: 'Security group not checked yet'
	};
	
	$scope.awsChecks = function() {
		$scope.credentialCheck.status = 'info';
		$scope.credentialCheck.msg = 'AWS credentials being checked...';
		$scope.securityGroupCheck.status = 'info';
		$scope.securityGroupCheck.msg = 'Security group being checked...';
		
		awsService.testCredentials()
		.then(function() {
			$scope.credentialCheck.status = 'success';
			$scope.credentialCheck.msg = 'AWS credentials look good!';
		}, function(err) {
			$scope.credentialCheck.status = 'danger';
			$scope.credentialCheck.msg = "AWS credentials couldn't be validated: " + err;
			throw "Credentials not valid";
		}).then(function() {
			return awsService.getSecurityGroups('brenda-web');
		}).then(function() {
			$scope.securityGroupCheck.status = 'success';
			$scope.securityGroupCheck.msg = 'Security group found!';
			$rootScope.$broadcast('brenda-web-credentials-updated');
		}, function(err) {
			$scope.securityGroupCheck.status = 'danger';
			$scope.securityGroupCheck.msg = 'Security group check failed: ' + err;
		});
	};
	
	$scope.createSG = function() {
		awsService.createSecurityGroup()
		.then(function() {
			$scope.awsChecks();
		}, function(err) {
			$scope.securityGroupCheck.status = 'danger';
			$scope.securityGroupCheck.msg = 'Security group creation failed: ' + err;
		});
	};
	
	if (    ($scope.credentials.awsRegion) && ($scope.credentials.awsRegion != '') 
	     && ($scope.credentials.awsKeyId) && ($scope.credentials.awsKeyId != '') 
	     && ($scope.credentials.awsSecret) && ($scope.credentials.awsSecret != '')) {
 		$scope.awsChecks();
     }
		
	$scope.setCredentials = function() {
		awsService.setCredentials($scope.credentials.awsKeyId, $scope.credentials.awsSecret);
		localStorageService.set('keyId', $scope.credentials.awsKeyId);
		localStorageService.set('keySecret', $scope.credentials.awsSecret);
		
		awsService.setRegion($scope.credentials.awsRegion);
		localStorageService.set('region', $scope.credentials.awsRegion);
		
		$scope.awsChecks();
	};
	
	$scope.ok = function () {
		$uibModalInstance.close();
	};
}])