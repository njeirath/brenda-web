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
.controller('AwsConfigureCtrl', ['$scope', 'awsService', '$rootScope', '$uibModalInstance', 'localStorageService', function($scope, awsService, $rootScope, $uibModalInstance, localStorageService) {
	function init() {
		$scope.credentials = {
				awsRegion: awsService.getRegion(),
				awsKeyId: awsService.getKeyId(),
				awsSecret: awsService.getKeySecret()
		};
		
		$scope.storeCredentials = Boolean(localStorageService.get('storeCredentials'));
		
		$scope.credentialCheck = {
			status: 'info', 
			msg: 'AWS credentials not checked yet'
		};
		$scope.securityGroupCheck = {
			status: 'info', 
			msg: 'Security group not checked yet'
		};
	}
	
	init();
	
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
			$scope.securityGroupCheck.msg = 'Security group check failed: ' + String(err);
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
		
	$scope.setCredentials = function(form) {
		form.$setSubmitted();
		if (form.$valid) {
			awsService.setCredentials($scope.credentials.awsKeyId, $scope.credentials.awsSecret);
			awsService.setRegion($scope.credentials.awsRegion);
			
			if ($scope.storeCredentials) {
				localStorageService.set('keyId', $scope.credentials.awsKeyId);
				localStorageService.set('keySecret', $scope.credentials.awsSecret);
				localStorageService.set('region', $scope.credentials.awsRegion);
				localStorageService.set('storeCredentials', true);
			}
			
			$scope.awsChecks();
		}
	};
	
	$scope.clearStorage = function() {
		localStorageService.clearAll();
		awsService.setCredentials('', '');
		awsService.setRegion('');
		
		init();
	}
	
	$scope.ok = function () {
		$uibModalInstance.close();
	};
}])