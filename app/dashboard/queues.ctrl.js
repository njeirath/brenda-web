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

"use strict";

angular.module("dashboard")
.controller("queuesCtrl", ["$scope", function($scope) {
	
	function filteredTable(queueUrl) {
		return $scope.instances.table.filter(function(item) {
			return ((item.queueUrl === queueUrl) && (item.instanceStatus === "running"));
		});
	}
	
	$scope.workerCount = function(queueUrl) {
		return filteredTable(queueUrl).length;
	};
	
	$scope.totalCost = function(queueUrl) {
		var cost = 0;
		filteredTable(queueUrl).forEach(function(item) {
			cost += parseFloat(item.spotPrice);
		});
		
		return cost;
	}
	
	$scope.timePerFrame = function(queueUrl) {
		var fps = 0.0;
		
		filteredTable(queueUrl).forEach(function(item) {
			fps += item.tasksCompleted / item.uptime;
		});
		
		return 1/fps;
	};
}]);