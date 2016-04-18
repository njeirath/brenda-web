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