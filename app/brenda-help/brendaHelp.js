'use strict';

// Declare app level module which depends on views, and components
angular.module('brendaHelper', [])
.directive('brendaHelp', ['$uibModal', function($uibModal) {
	
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var helpTemplate = attrs.brendaHelp;
			
			element.bind('click', function() {
				$uibModal.open({
					animation: true,
					templateUrl: helpTemplate,
					size: 'lg',
					controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
						$scope.ok = function () {
							$uibModalInstance.close();
						};
					}]
				});
			});
		}
	};
}]);