'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));

	describe('AwsConfigureCtrl', function() {
		var awsServiceMock, localStorageMock, modalMock, ctrl, testCredentialsDeferred, getSgDeferred;
		var $rootScope, $controller, $q, $scope;
		
		beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
			$rootScope = _$rootScope_;
			$controller = _$controller_;
			$q = _$q_;
		}));
		
		beforeEach(function() {
			awsServiceMock = getAwsServiceMock();
			localStorageMock = getLocalStorageMock();
			modalMock = {};
			testCredentialsDeferred = $q.defer();
			awsServiceMock.testCredentials.and.returnValue(testCredentialsDeferred.promise);
			
			getSgDeferred = $q.defer();
			awsServiceMock.getSecurityGroups.and.returnValue(getSgDeferred.promise);
			
			$scope = $rootScope.$new();
			var ctrl = $controller('AwsConfigureCtrl', {$scope: $scope, $rootScope: $rootScope, awsService: awsServiceMock, localStorageService: localStorageMock, $uibModalInstance: modalMock});
		});
		
		describe('initialization procedures', function() {
			it('should initialize credentials from awsService', function() {
				expect($scope.credentials.awsRegion).toBe('region');
				expect($scope.credentials.awsKeyId).toBe('accessKey');
				expect($scope.credentials.awsSecret).toBe('secretKey');
			});
		});
		
		describe('$scope.setCredentials()', function() {
			it('should call into awsService with scope vars and set local storage values', function() {					
				$scope.credentials = {
					awsRegion: 'reg',
					awsKeyId: 'id',
					awsSecret: 'shh'
				};
				
				$scope.setCredentials();
				
				expect(awsServiceMock.setCredentials).toHaveBeenCalledWith('id', 'shh');
				expect(awsServiceMock.setRegion).toHaveBeenCalledWith('reg');
				expect(awsServiceMock.testCredentials).toHaveBeenCalled();
				
				expect(localStorageMock.set).toHaveBeenCalledWith('keyId', 'id');
				expect(localStorageMock.set).toHaveBeenCalledWith('keySecret', 'shh');
				expect(localStorageMock.set).toHaveBeenCalledWith('region', 'reg');
			});
		});
		
		describe('$scope.awsChecks', function() {
			beforeEach(function() {
				$scope.awsChecks();
			});
			
			it('should make a call to testCredentials', function() {
				expect(awsServiceMock.testCredentials).toHaveBeenCalled();
			});
			
			it('should update model when testCredentials resolves', function() {
				testCredentialsDeferred.resolve();
				$scope.$apply();
				
				expect($scope.credentialCheck).toEqual({status: 'success', msg: 'AWS credentials look good!'});
				expect(awsServiceMock.getSecurityGroups).toHaveBeenCalledWith('brenda-web');
			});
			
			it('should update model when testCredentials are rejected', function() {
				testCredentialsDeferred.reject('error message');
				expect($scope.$apply).toThrow();
				
				expect($scope.credentialCheck).toEqual({status: 'danger', msg: "AWS credentials couldn't be validated: error message"});
				expect(awsServiceMock.getSecurityGroups).not.toHaveBeenCalled();
			});
			
			it('should update model when SG check resolves', function() {
				spyOn($rootScope, '$broadcast');
				testCredentialsDeferred.resolve();
				getSgDeferred.resolve();
				$scope.$apply();
				
				expect($scope.securityGroupCheck).toEqual({status: 'success', msg: 'Security group found!'});
				expect($rootScope.$broadcast).toHaveBeenCalledWith('brenda-web-credentials-updated');
			});
			
			it('should update model with SG check is rejected', function() {
				testCredentialsDeferred.resolve();
				getSgDeferred.reject('SG error');
				$scope.$apply();
				
				expect($scope.securityGroupCheck).toEqual({status: 'danger', msg: 'Security group check failed: SG error'});
			});
		});
		
		describe('$scope.createSG', function() {
			var createSgDeferred; 
			
			beforeEach(function() {
				createSgDeferred = $q.defer();
				awsServiceMock.createSecurityGroup.and.returnValue(createSgDeferred.promise);
				spyOn($scope, 'awsChecks');
				
				$scope.createSG();
			});
			
			it('should trigger AWS checks when resolved', function() {
				createSgDeferred.resolve();
				$scope.$apply();
				
				expect($scope.awsChecks).toHaveBeenCalled();
			});
			
			it('should update model when rejected', function() {
				createSgDeferred.reject('err msg');
				$scope.$apply();
				
				expect($scope.securityGroupCheck).toEqual({status: 'danger', msg: 'Security group creation failed: err msg'});
			});
		});
	});
});