'use strict';

describe('JobSetupCtrl', function() {
	beforeEach(module('awsSetup'));
	
	var $rootScope, $controller, $httpBackend, $q;
		
	beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _$q_) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		$httpBackend = _$httpBackend_;
		$q = _$q_;
	}));
	
	var awsServiceMock, ctrl, uibModalMock, modalDeferred, localStoreMock;
	
	beforeEach(function() {
		awsServiceMock = getAwsServiceMock();
		localStoreMock = getLocalStorageMock();
		
		//Setup inherited scope var
		$rootScope.queue = {
			workQueue: ''
		};
		
		modalDeferred = $q.defer();
		uibModalMock = {
			open: function() {}
		};
		
		spyOn(uibModalMock, 'open').and.returnValue({result: modalDeferred.promise});
		
		ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock, $uibModal: uibModalMock, localStorageService: localStoreMock});
	});
	
	it('should initialize array to empty and call getQueues', function() {				
		expect($rootScope.queues.length).toBe(0);
		expect(awsServiceMock.getQueues).toHaveBeenCalled();
	});
	
	it('should update array when success event received', function() {
		$rootScope.$emit('aws-sqs-success', {QueueUrls: ['http://queue/url/name1', 'http://queue/url/name2']});
		
		expect($rootScope.queues.length).toBe(2);
		expect($rootScope.queues[0]).toBe('http://queue/url/name1');
		expect($rootScope.queues[1]).toBe('http://queue/url/name2');
	});
	
	it('should initialize template, start and end frame', function() {
		expect($rootScope.workTemplate).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a');
		expect($rootScope.startFrame).toBe(1);
		expect($rootScope.endFrame).toBe(240);
	});
	
	describe('$scope.workList', function() {
		it('should generate the work list', function() {
			var workList = $rootScope.workList();
			
			expect(workList.length).toBe(240);
			expect(workList[0]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 1 -e 1 -j 1 -t 0 -a');
			expect(workList[1]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 2 -e 2 -j 1 -t 0 -a');
		});
	});
				
	describe('$scope.sendWork', function() {
		it('should call awsService with queue name and work list', function() {
			awsServiceMock.sendToQueue = function(queueUrl, workList) {
				expect(queueUrl).toBe('testUrl');
				expect(workList.length).toBe(2);
				expect(workList[0]).toBe('job1');
				expect(workList[1]).toBe('job2');
			};
			
			$rootScope.workList = function() {return ['job1', 'job2'];};
			$rootScope.queue.workQueue = 'testUrl';
			$rootScope.sendWork();
		});
	});
	
	describe('$scope.clearQueue', function() {
		it('should call awsService to clear queue', function() {
			awsServiceMock.clearQueue = function(queueUrl) {
				expect(queueUrl).toBe('testUrl');
			};
			
			$rootScope.queue.workQueue = 'testUrl';
			$rootScope.clearQueue();
		});
	});
	
	it('should update sendStatus on receipt of aws-sqs-send-update', function() {
		$rootScope.$emit('aws-sqs-send-update', {
			status: 'test status'
		});
		
		expect($rootScope.sendStatus.status).toBe('test status');
	});
	
	it('should get queues when refreshQueues called', function() {
		$rootScope.refreshQueues();
		expect(awsServiceMock.getQueues).toHaveBeenCalled();
	});
	
	describe('$scope.closeAlert', function() {
		it('should remove correct alert when dismissed', function() {
			$rootScope.queueAlerts = [1, 2, 3];
			$rootScope.closeAlert(1);
			expect($rootScope.queueAlerts).toEqual([1,3]);
		});
	});
	
	describe('$scope.addQueue', function() {
		it('should open dialog', function() {
			$rootScope.addQueue();
			expect(uibModalMock.open).toHaveBeenCalledWith({
				animation: true,
				templateUrl: 'awsSetup/createQueue.html',
				controller: 'CreateQueueCtrl'
			});
		});
	});
});