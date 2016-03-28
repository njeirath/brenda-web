'use strict';

angular.module('awsSetup')
.directive('awsConfigure', ['$uibModal', function($uibModal) {
	
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.bind('click', function() {
				$uibModal.open({
					animation: true,
					templateUrl: 'awsSetup/awsConfigure.modal.html',
					size: 'lg',
					controller: 'AwsConfigureCtrl'
				});
			});
		}
	};
}]);