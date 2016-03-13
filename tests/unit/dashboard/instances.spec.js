'use strict';

describe('dashboard instances', function() {
	beforeEach(module('dashboard'));

	var $rootScope, $controller, $httpBackend, ctrl, awsServiceMock, instanceDeferred, spotDeferred, addQueueSpy;
	var spotRet = {SpotInstanceRequests: [
		{
			SpotInstanceRequestId: 'sir_1',
			InstanceId: 'i_1',
			SpotPrice: 0.02,
			Status: {Code: 'fulfilled'},
			Tags: [{Key: 'brenda-queue', Value: 'queueUrl'}]
		}
		]};
		
	var instRet = {Reservations: [
		{
			Instances: [
			{
				InstanceId: 'i_1',
				InstanceType: 'c3.large',
				State: {Name: 'starting'},
				Tags: [{Key: 'brenda-queue', Value: 'queueUrl'}]
			}]
		}
	]};
			
	beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, $q) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		$httpBackend = _$httpBackend_;
		
		awsServiceMock = getAwsServiceMock();
		
		instanceDeferred = $q.defer();
		spotDeferred = $q.defer();
		
		spyOn(awsServiceMock, 'getInstanceDetails').and.returnValue(instanceDeferred.promise);
		spyOn(awsServiceMock, 'getSpotRequests').and.returnValue(spotDeferred.promise);
		
		$rootScope.queues = {addQueue: function(){}};
		spyOn($rootScope.queues, 'addQueue');
	
		ctrl = $controller('instancesCtrl', {$scope: $rootScope, awsService: awsServiceMock});
	}));
	
	it('should start with empty set of instance table', function() {
		expect($rootScope.instances.table.length).toBe(0);
	});
	
	it('should start calls to get on demand and spot instances', function() {
		expect(awsServiceMock.getInstanceDetails).toHaveBeenCalled();
		expect(awsServiceMock.getSpotRequests).toHaveBeenCalled();
	});
	
	it('should call to get instance details with instance list when spot call resolves', function() {
		spotDeferred.resolve(spotRet);
		$rootScope.$apply();
		
		expect(awsServiceMock.getInstanceDetails).toHaveBeenCalledWith(['i_1']);
		expect($rootScope.queues.addQueue).toHaveBeenCalledWith('queueUrl');
	});
	
	it('should update table with returned data', function() {
		spotDeferred.resolve(spotRet);
		$rootScope.$apply();
		
		instanceDeferred.resolve(instRet);
		$rootScope.$apply();
		
		expect($rootScope.instances.table[0]).toEqual({
			spotId: 'sir_1',
			instanceId: 'i_1',
			spotPrice: 0.02,
			instanceType: 'c3.large',
			spotStatus: 'fulfilled',
			instanceStatus: 'starting',
			instanceDns: undefined,
			instanceIp: undefined,
			uptime: '-',
			tasksCompleted: '-',
			cpuLoad: '-',
			queueUrl: 'queueUrl'
		});
		
		expect($rootScope.instances.table[1]).toEqual({
			spotId: '-',
			instanceId: 'i_1',
			spotPrice: '-',
			instanceType: 'c3.large',
			spotStatus: '-',
			instanceStatus: 'starting',
			instanceDns: undefined,
			instanceIp: undefined,
			uptime: '-',
			tasksCompleted: '-',
			cpuLoad: '-',
			queueUrl: 'queueUrl'
		});
		
		expect($rootScope.queues.addQueue).toHaveBeenCalledWith('queueUrl');
	});
	
	describe('$rootScope.getInstanceStats', function() {
		beforeEach(function() {
			$rootScope.instances.table = [{
				spotId: 'sir_1',
				instanceId: 'i_1',
				spotPrice: 0.02,
				instanceType: 'c3.large',
				spotStatus: 'fulfilled',
				instanceStatus: 'running',
				instanceDns: '1.2.3.4.com',
				instanceIp: '1.2.3.4',
				uptime: '-',
				tasksCompleted: '-',
				cpuLoad: '-'
			}];
		});
		
		it('should call individual servers for status', function() {
			$httpBackend.expectGET(/http:\/\/1.2.3.4\/uptime.txt\?d=(.+)/).respond("20.3 10.5\n1.9 1.5 1.1 1/5 9\n3");
			
			$rootScope.getInstanceStats();
			$httpBackend.flush();
			
			expect($rootScope.instances.table[0]).toEqual({
				spotId: 'sir_1',
				instanceId: 'i_1',
				spotPrice: 0.02,
				instanceType: 'c3.large',
				spotStatus: 'fulfilled',
				instanceStatus: 'running',
				instanceDns: '1.2.3.4.com',
				instanceIp: '1.2.3.4',
				uptime: 20.3,
				tasksCompleted: 3,
				cpuLoad: 1.9
			});
		});
		
		it('should set unknown values when error occurs', function() {
			$httpBackend.expectGET(/http:\/\/1.2.3.4\/uptime.txt\?d=(.+)/).respond(500, '');
			
			$rootScope.getInstanceStats();
			$httpBackend.flush();
			
			expect($rootScope.instances.table[0]).toEqual({
				spotId: 'sir_1',
				instanceId: 'i_1',
				spotPrice: 0.02,
				instanceType: 'c3.large',
				spotStatus: 'fulfilled',
				instanceStatus: 'running',
				instanceDns: '1.2.3.4.com',
				instanceIp: '1.2.3.4',
				uptime: 'unavailable',
				tasksCompleted: 'unavailable',
				cpuLoad: 'unavailable'
			});
		});
	});
});