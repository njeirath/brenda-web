'use strict';

angular.module('dashboard')
.controller('TerminateConfirmCtrl', ['$scope', '$uibModalInstance', 'instance', function($scope, $uibModalInstance, instance) {
	$scope.spot = instance.spotId;
	$scope.instance = instance.instanceId;
	
	$scope.ok = function() {
		$uibModalInstance.close();
	};
	
	$scope.cancel = function() {
		$uibModalInstance.dismiss();
	}
}]);