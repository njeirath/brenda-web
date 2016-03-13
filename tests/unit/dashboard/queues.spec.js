describe('dashboard instances', function() {
	beforeEach(module('dashboard'));

	var $rootScope;
	
	beforeEach(inject(function(_$controller_, _$rootScope_) {
		$rootScope = _$rootScope_;
		$controller = _$controller_;
		
		$rootScope.instances = {
			table: [{
				spotId: '-',
				instanceId: '-',
				spotPrice: '-',
				instanceType: '-',
				spotStatus: '-',
				instanceStatus: 'running',
				instanceDns: '-',
				instanceIp: '-',
				uptime: '60',
				tasksCompleted: '6',
				cpuLoad: '-',
				queueUrl: 'queue1'
			}, {
				spotId: '-',
				instanceId: '-',
				spotPrice: '-',
				instanceType: '-',
				spotStatus: '-',
				instanceStatus: 'running',
				instanceDns: '-',
				instanceIp: '-',
				uptime: '120',
				tasksCompleted: '5',
				cpuLoad: '-',
				queueUrl: 'queue2'
			}]
		};
			
		ctrl = $controller('queuesCtrl', {$scope: $rootScope});
	}));
	
	it('should count workers as filtered by queueUrl', function() {
		expect($rootScope.workerCount('queue1')).toBe(1);
	});
	
	it('should calculate time per task', function() {
		expect($rootScope.timePerFrame('queue1')).toBe(10);
	});
	
});