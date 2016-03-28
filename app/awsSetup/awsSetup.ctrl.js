'use strict';

angular.module('awsSetup')
.controller('AwsSetupCtrl', ['$scope', 'awsService', function($scope, awsService) {
	
	$scope.reloadCredentials = function() {
		$scope.awsRegion = awsService.getRegion();
		$scope.awsKeyId = awsService.getKeyId();
		$scope.awsSecret = awsService.getKeySecret();
	}
	
	$scope.$on('brenda-web-credentials-updated', function() {
		$scope.reloadCredentials();
	});
	
	$scope.reloadCredentials();
	
}]);