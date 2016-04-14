'use strict';

describe('SetupCtrl', function() {
	beforeEach(module('awsSetup'));
	
	var $rootScope, $controller, $httpBackend, $q;
		
	beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _$q_) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		$httpBackend = _$httpBackend_;
		$q = _$q_;
	}));
	
	var ctrl, localStorageService, awsServiceMock;
	
	beforeEach(function() {
		localStorageService = getLocalStorageMock();
		awsServiceMock = getAwsServiceMock();
		localStorageService.data['projectSource'] = 'source location';
		localStorageService.data['frameDestination'] = 'frame dest';
		
		ctrl = $controller('SetupCtrl', {$scope: $rootScope, localStorageService: localStorageService, awsService: awsServiceMock});
	});
	
	it('should get initial values for projectSource and frameDestination from local storage', function() {
		expect(localStorageService.get).toHaveBeenCalledWith('projectSource');
		expect(localStorageService.get).toHaveBeenCalledWith('frameDestination');
		
		expect($rootScope.s3.projectSource).toBe('source location');
		expect($rootScope.s3.frameDestination).toBe('frame dest');
	});
	
	it('should update local storage on projectSource and frameDestination changes', function() {
		$rootScope.s3.projectSource = 'new source';
		$rootScope.s3.frameDestination = 'new dest';
		$rootScope.$digest();
		
		expect(localStorageService.set).toHaveBeenCalledWith('projectSource', 'new source');
		expect(localStorageService.set).toHaveBeenCalledWith('frameDestination', 'new dest');
	});
	
	describe('$scope.s3.isEbsSource', function() {
		it('should return true only for ebs style urls', function() {
			$rootScope.s3.projectSource = 'ebs://snap-123';
			expect($rootScope.s3.isEbsSource()).toBe(true);
			
			$rootScope.s3.projectSource = 'EBS://snap-123';
			expect($rootScope.s3.isEbsSource()).toBe(true);
			
			$rootScope.s3.projectSource = 's3://bucket/file';
			expect($rootScope.s3.isEbsSource()).toBe(false);
		});
	});
	
	describe('$scope.updateQueueSize', function() {
		var $q;
		
		beforeEach(inject(function(_$q_) {
			$q = _$q_;
		}));
		
		it('should display default message if no queue selected', function() {
			$rootScope.workQueue = '';
			$rootScope.updateQueueSize();
			expect($rootScope.queue.queueSize).toBe('-');
			
			$rootScope.workQueue = undefined;
			$rootScope.updateQueueSize();
			expect($rootScope.queue.queueSize).toBe('-');
		});
		
		it('should call awsService if queue is selected', function() {
			var deferred = $q.defer();
			awsServiceMock.getQueueSize = function(queue, callback) {
				expect(queue).toBe('testUrl');
				return deferred.promise;
			};
			
			$rootScope.queue.workQueue = 'testUrl';
			$rootScope.updateQueueSize();
			deferred.resolve(5);
			$rootScope.$apply();
			expect($rootScope.queue.queueSize).toBe(5);
		});
	});
});