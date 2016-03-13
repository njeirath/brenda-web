'use strict';

describe('dashboard instances', function() {
	beforeEach(module('dashboard'));

	var $rootScope, $controller, ctrl, awsServiceMock, queueSizeDeferred;
			
	beforeEach(inject(function(_$controller_, _$rootScope_, $q) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		
		awsServiceMock = getAwsServiceMock();
		queueSizeDeferred = $q.defer();
		
		awsServiceMock.getQueueSize = jasmine.createSpy().and.returnValue(queueSizeDeferred.promise);
		
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
	
});