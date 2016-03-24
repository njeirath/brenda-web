'use strict';

describe('dashboard instances', function() {
	beforeEach(module('dashboard'));

	var $rootScope, $controller, ctrl, awsServiceMock, queueSizeDeferred, listObjectsDeferred;
			
	beforeEach(inject(function(_$controller_, _$rootScope_, $q) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		
		awsServiceMock = getAwsServiceMock();
		queueSizeDeferred = $q.defer();
		listObjectsDeferred = $q.defer();
		
		awsServiceMock.getQueueSize = jasmine.createSpy().and.returnValue(queueSizeDeferred.promise);
		awsServiceMock.listObjects = jasmine.createSpy().and.returnValue(listObjectsDeferred.promise);
		awsServiceMock.getObjectUri = jasmine.createSpy().and.returnValue('url');
		
		ctrl = $controller('dashboardParentCtrl', {$scope: $rootScope, awsService: awsServiceMock});
	}));
	
	it('should initialize with an empty queue list', function(){
		expect($rootScope.queues.queues.length).toBe(0);
	});
	
	describe('queue.addQueue', function() {
		it('should add a new queue URL to the queue list', function() {
			$rootScope.queues.addQueue('new URL');
			expect($rootScope.queues.queues.length).toBe(1);
			expect($rootScope.queues.queues[0]).toEqual({url: 'new URL', size: '-'});
		});
		
		it('should not add a queue that is already in the list', function() {
			$rootScope.queues.addQueue('new URL');
			$rootScope.queues.addQueue('new URL');
			expect($rootScope.queues.queues.length).toBe(1);
		});
	});
	
	describe('queue.updateSize', function() {
		beforeEach(function() {
			$rootScope.queues.addQueue('url');
			$rootScope.queues.updateSize();
		});
		
		it('should call to get queue size from aws', function() {
			expect(awsServiceMock.getQueueSize).toHaveBeenCalledWith('url');
		});
		
		it('should set the size when the promise resolves', function() {
			queueSizeDeferred.resolve(4);
			$rootScope.$apply();
			expect($rootScope.queues.queues[0].size).toBe(4);
		});
		
		it('should set the size to error the promise is rejected', function() {
			queueSizeDeferred.reject('err');
			$rootScope.$apply();
			expect($rootScope.queues.queues[0].size).toBe('Error');
		});
	});
	
	it('should initialize with an empty bucket list', function(){
		expect($rootScope.buckets.buckets.length).toBe(0);
	});
	
	describe('buckets.addBucket', function() {
		it('should add a new bucket to the queue list', function() {
			$rootScope.buckets.addBucket('new bucket');
			expect($rootScope.buckets.buckets.length).toBe(1);
			expect($rootScope.buckets.buckets[0]).toEqual({name: 'new bucket', size: '-', files: [], errors: {}});
		});
		
		it('should not add a bucket that is already in the list', function() {
			$rootScope.buckets.addBucket('new bucket');
			$rootScope.buckets.addBucket('new bucket');
			expect($rootScope.buckets.buckets.length).toBe(1);
		});
	});
	
	describe('buckets.updateBucket', function() {
		beforeEach(function() {
			$rootScope.buckets.addBucket('bucket');
			$rootScope.buckets.updateBucket();
		});
		
		it('should call to get bucket objects', function() {
			expect(awsServiceMock.listObjects).toHaveBeenCalledWith('bucket');
		});
		
		it('should set bucket info when promise resolves', function() {
			listObjectsDeferred.resolve({Contents: [{Key: 'file1.png', Size: 100000, LastModified: 'yesterday'}]});
			$rootScope.$apply();
			expect($rootScope.buckets.buckets[0].size).toBe(1);
			expect($rootScope.buckets.buckets[0].files.length).toBe(1);
			expect($rootScope.buckets.buckets[0].files[0]).toEqual({name: 'file1.png', size: 100000, modified: 'yesterday', url: 'url', caption: 'file1.png' });
			expect(awsServiceMock.getObjectUri).toHaveBeenCalledWith('bucket', 'file1.png');
		});
	});
});