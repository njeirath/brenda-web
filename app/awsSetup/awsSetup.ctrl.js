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