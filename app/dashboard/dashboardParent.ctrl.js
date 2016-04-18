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

angular.module('dashboard')
.controller('dashboardParentCtrl', ['$scope', 'awsService', '$interval', function($scope, awsService, $interval) {
	$scope.queues = {
		queues: [],
		
		addQueue: function(queueUrl) {
			var queue = this.queues.find(function(queue) {
				return queue.url == queueUrl;
			});
			if (!queue) {
				this.queues.push({url: queueUrl, size: '-'});
				this.updateSize();
			}
		},
		updateSize: function() {
			this.queues.forEach(function(item) {
				(function(q) {
					awsService.getQueueSize(q.url).then(function(size) {
						q.size = size;
					}, function(err) {
						q.size = 'Error';
					});
				}(item));
			});
		}
	};
	
	$scope.buckets = {
		buckets: [],
		
		addBucket: function(bucketName) {
			var bucket = this.buckets.find(function(bucket) {
				return bucket.name == bucketName;
			});
			if (!bucket) {
				this.buckets.push({name: bucketName, size: '-', files: [], errors: {}});
				this.updateBucket();
			}
		},
		updateBucket: function() {
			this.buckets.forEach(function(item) {
				(function(b) {
					awsService.listObjects(b.name)
					.then(function(data) {
						b.errors = {};
						b.files = [];
						b.size = data.Contents.length;
						data.Contents.forEach(function(obj) {
							var url = awsService.getObjectUri(b.name, obj.Key);
							b.files.push({name: obj.Key, size: obj.Size, modified: obj.LastModified, url: url, caption: obj.Key});
						});
					}, function(err) {
						b.errors.error = String(err);
					});
				}(item));
			});
		}
	};
	
	$scope.instances = {
		table: []
	};
	
	var queueTimer = $interval(function() {
		$scope.queues.updateSize();
	}, 15000);
	
	var bucketTimer = $interval(function() {
		$scope.buckets.updateBucket();
	}, 15000);
	
	$scope.$on('$destroy', function() {
		$interval.cancel(queueTimer);
		$interval.cancel(bucketTimer);
	});
}]);
