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