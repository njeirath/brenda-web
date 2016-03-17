'use strict';

angular.module('awsSetup')
.controller('CreateQueueCtrl', ['$scope', 'awsService', '$uibModalInstance', function($scope, awsService, $uibModalInstance) {
	$scope.queueName = '';
	
	$scope.ok = function () {
    	$uibModalInstance.close($scope.queueName);
	};

	$scope.cancel = function () {
    	$uibModalInstance.dismiss('cancel');
	};
}]);