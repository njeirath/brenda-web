'use strict';

angular.module('awsSetup')
.controller('AwsSetupCtrl', ['$scope', 'awsService', function($scope, awsService) {
	$scope.errors = {
			noCredentials: false
	}
	
	$scope.reloadCredentials = function() {
		$scope.awsRegion = awsService.getRegion();
		$scope.awsKeyId = awsService.getKeyId();
		$scope.awsSecret = awsService.getKeySecret();
		
		if(!$scope.awsRegion || $scope.awsRegion == '' || !$scope.awsKeyId || $scope.awsKeyId == '' || !$scope.awsSecret || $scope.awsSecret == '') {
			$scope.errors.noCredentials = true;
		} else {
			$scope.errors.noCredentials = false;
		}
	}
	
	$scope.$on('brenda-web-credentials-updated', function() {
		$scope.reloadCredentials();
	});
	
	$scope.reloadCredentials();
	
}]);