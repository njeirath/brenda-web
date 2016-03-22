'use strict';

describe('dashboard instances', function() {
	beforeEach(module('dashboard'));

	var $rootScope, $controller, ctrl, LightboxMock;
	
	beforeEach(inject(function(_$controller_, _$rootScope_, $q) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		
		//Seed some rootscope data
		$rootScope.buckets = {
			buckets: [{name: 'bucketName', files: [
					{name: 'file1.png'}
				]
			}]
		};
		
		LightboxMock = jasmine.createSpyObj('LightboxMock', ['openModal']);
		
		ctrl = $controller('BucketCtrl', {$scope: $rootScope, Lightbox: LightboxMock});
	}));
	
	it('should open lightbox modal when called', function() {
		$rootScope.openLightbox('bucketName', 0);
		expect(LightboxMock.openModal).toHaveBeenCalledWith([{name: 'file1.png'}], 0);
	});
});