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
			Tags: [{Key: 'brenda-queue', Value: 'queueUrl'}, {Key: 'brenda-dest', Value: 'dest bucket'}]
		}
		]};
		
	var instRet = {Reservations: [
		{
			Instances: [
			{
				InstanceId: 'i_1',
				InstanceType: 'c3.large',
				State: {Name: 'starting'},
				Tags: [{Key: 'brenda-queue', Value: 'queueUrl'}, {Key: 'brenda-dest', Value: 'dest bucket'}]
			}]
		}
	]};
			
	beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, $q) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		$httpBackend = _$httpBackend_;
		
		//Seed scope with normally inherited object
		$rootScope.instances = {
			table: []
		};
		
		awsServiceMock = getAwsServiceMock();
		
		instanceDeferred = $q.defer();
		spotDeferred = $q.defer();
		
		spyOn(awsServiceMock, 'getInstanceDetails').and.returnValue(instanceDeferred.promise);
		spyOn(awsServiceMock, 'getSpotRequests').and.returnValue(spotDeferred.promise);
		
		$rootScope.queues = {addQueue: function(){}};
		$rootScope.buckets = {addBucket: function(){}};
		spyOn($rootScope.queues, 'addQueue');
		spyOn($rootScope.buckets, 'addBucket');
	
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
			queueUrl: 'queueUrl',
			destinationBucket: 'dest bucket'
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
			queueUrl: 'queueUrl',
			destinationBucket: 'dest bucket'
		});
		
		expect($rootScope.queues.addQueue).toHaveBeenCalledWith('queueUrl');
		expect($rootScope.buckets.addBucket).toHaveBeenCalledWith('dest bucket');
	});
	
	it('should set ConfigError if rejected for that reason', function() {
		spotDeferred.reject({code: 'ConfigError', message: 'config error'});
		$rootScope.$apply();
		expect($rootScope.errors.ConfigError).toBe('config error');
	});
	
	it('should set CredentialsError if rejected for that reason', function() {
		spotDeferred.reject({code: 'CredentialsError', message: 'creds error'});
		$rootScope.$apply();
		expect($rootScope.errors.CredentialsError).toBe('creds error');
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
			$httpBackend.expectGET(/http:\/\/1.2.3.4\/log_tail.txt\?d=(.+)/).respond("Fra:1 Mem:7.69M (39.55M, Peak 47.82M) | Mem:0.89M, Peak:0.89M | Scene, RenderLayer | Path Tracing Tile 51/510");
			
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
				tasksCompleted: 3.1,
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
	
	describe('$scope.statusMapper', function() {
		it('should return correct index for matched statuses', function() {
			expect($rootScope.statusMapper({instanceStatus: 'running'})).toBe(0);
			expect($rootScope.statusMapper({instanceStatus: 'terminated'})).toBe(1);
		});
		
		it('should return max index for unmatched status', function() {
			expect($rootScope.statusMapper({instanceStatus: 'unknown'})).toBe(2);
		});
	});
});