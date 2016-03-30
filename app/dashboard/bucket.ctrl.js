'use strict';

angular.module('dashboard')
.controller('BucketCtrl', ['$scope', 'Lightbox', '$uibModal', function($scope, Lightbox, $uibModal) {
	$scope.openLightbox = function(bucketName, index) {
		var images = $scope.buckets.buckets.find(function(item) {
			return item.name == bucketName;
		});
		Lightbox.openModal(images.files, index);
	};
	
	$scope.downloadModal = function(bucketName) {
		console.log(bucketName);
		$uibModal.open({
			animation: true,
			templateUrl: 'dashboard/download.modal.html',
			resolve: {
				bucket: function() {
					return bucketName;
				}
			},
			size: 'lg',
			controller: ['$scope', '$uibModalInstance', 'bucket', function($scope, $uibModalInstance, bucket) {
				$scope.bucket = bucket;
				
				$scope.ok = function () {
					$uibModalInstance.close();
				};
			}]
		});
	};
}]);
