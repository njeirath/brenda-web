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
.controller('AmiConfigureCtrl', ['$scope', 'awsService', '$rootScope', '$uibModalInstance', 'localStorageService', function($scope, awsService, $rootScope, $uibModalInstance, localStorageService) {
	function init() {
		loadCustomAmis();
		$scope.newCustomAmi = {
			ami: '',
			blenderVersion: '',
			region: ''
		};
	}

	function loadCustomAmis() {
		$scope.customAmis = awsService.getCustomAmiList();
	}
	
	init();
	
	$scope.removeCustomAmi = function(amiName) {
		console.log("ami to remove: " + amiName);
		var tmpAmiList = [];
		$scope.customAmis.forEach(function(ami){
			if(ami.ami != amiName) {
				tmpAmiList.push(ami);
			}
		});
		$scope.customAmis = tmpAmiList;
		awsService.setCustomAmiList($scope.customAmis);
	}

	$scope.addNewAmi = function(form) {
		form.$setSubmitted();
		if (form.$valid) {
			$scope.customAmis.push($scope.newCustomAmi);
			awsService.setCustomAmiList($scope.customAmis);
		}
		init();
	}
	
	$scope.resetNewAmi = function() {
		init();
	}

	$scope.ok = function () {
		console.log("close custom ami modal");
		$uibModalInstance.close();
	};
}])