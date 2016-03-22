'use strict';

angular.module('dashboard')
.controller('BucketCtrl', ['$scope', 'Lightbox', function($scope, Lightbox) {
	$scope.openLightbox = function(bucketName, index) {
		var images = $scope.buckets.buckets.find(function(item) {
			return item.name == bucketName;
		});
		Lightbox.openModal(images.files, index);
	};
}]);
