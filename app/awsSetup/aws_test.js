'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('AwsSetupCtrl', function() {
		var $rootScope, $controller;
		
		beforeEach(inject(function(_$controller_, _$rootScope_) {
			$rootScope = _$rootScope_.$new();
			$controller = _$controller_;
		}));
		
		var awsServiceMock;
			
		beforeEach(function() {
			awsServiceMock = {
				region: '',
				keyId: '',
				secret: '',
				testCredsCalled: false,
				getRegion: function() {
					return this.region;
				},
				getKeyId: function() {
					return this.keyId;
				},
				getKeySecret: function() {
					return this.secret;
				},
				testCredentials: function() {
					this.testCredsCalled = true;
				},
				setCredentials: function(id, keySecret) {
					this.keyId = id;
					this.secret = keySecret;
				},
				setRegion: function(reg) {
					this.region = reg;
				}
			};
		});
		
		describe('initialization procedures', function() {
			it('should start with empty scope vars, and not call testCredentials', function() {
				var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				expect($rootScope.awsRegion).toBe('');
				expect($rootScope.awsKeyId).toBe('');
				expect($rootScope.awsSecret).toBe('');
				
				expect(awsServiceMock.testCredsCalled).toBe(false);
			});
			
			it('should initialize scope based on awsService, and call testCredentials', function() {
				awsServiceMock.region = 'region';
				awsServiceMock.keyId = 'ID';
				awsServiceMock.secret = 'secret';
				
				var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				expect($rootScope.awsRegion).toBe('region');
				expect($rootScope.awsKeyId).toBe('ID');
				expect($rootScope.awsSecret).toBe('secret');
				
				expect(awsServiceMock.testCredsCalled).toBe(true);
			});
		});
		
		describe('$scope.setCredentials()', function() {
			it('should call into awsService with scope vars', function() {			
				var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				$rootScope.awsRegion = 'reg';
				$rootScope.awsKeyId = 'id';
				$rootScope.awsSecret = 'shh';
				
				$rootScope.setCredentials();
				
				expect(awsServiceMock.region).toBe('reg');
				expect(awsServiceMock.keyId).toBe('id');
				expect(awsServiceMock.secret).toBe('shh');
				
				expect(awsServiceMock.testCredsCalled).toBe(true);
			});
		});
	});
	
	describe('awsLoginStatus', function() {
		var $compile, $rootScope, element;
		
		beforeEach(inject(function(_$compile_, _$rootScope_){
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			element = $compile('<div aws-login-status></div>')($rootScope);
		}));
		
		it('initializes to the unknown state and message', function() {
			expect(element.html()).toBe("<b>Unchecked:</b> Credentials haven't been tested yet");
		});
		
		it('sets success message on receiving success event', function() {
			$rootScope.$emit('aws-login-success');
			expect(element.html()).toBe("<b>Success:</b> Credentials look good!");
		});
		
		it('sets error message on receiving error event', function() {
			$rootScope.$emit('aws-login-error', 'Invalid password');
			expect(element.html()).toBe("<b>Error:</b> Invalid password");
		});
	});
});