'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));

	describe('AwsSetupCtrl', function() {
		var awsServiceMock, ctrl;
		var $rootScope, $controller;
		
		beforeEach(inject(function(_$controller_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$controller = _$controller_;
		}));
		
		beforeEach(function() {
			awsServiceMock = getAwsServiceMock();
						
			var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
		});
		
		describe('initialization procedures', function() {
			it('should initialize credentials from awsService', function() {
				expect($rootScope.awsRegion).toBe('region');
				expect($rootScope.awsKeyId).toBe('accessKey');
				expect($rootScope.awsSecret).toBe('secretKey');
				
				expect(awsServiceMock.getRegion).toHaveBeenCalled();
				expect(awsServiceMock.getKeyId).toHaveBeenCalled();
				expect(awsServiceMock.getKeySecret).toHaveBeenCalled();
			});
		});
		
		it('should call reload credentials on brenda-web-credentials-updated broadcast', function() {
			spyOn($rootScope, 'reloadCredentials');
			$rootScope.$broadcast('brenda-web-credentials-updated');
			expect($rootScope.reloadCredentials).toHaveBeenCalled();
		});
	});
});