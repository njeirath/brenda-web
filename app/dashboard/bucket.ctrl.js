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
