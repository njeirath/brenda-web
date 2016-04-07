'use strict';

describe('dashboard instances', function() {
	beforeEach(module('dashboard'));
	
	var $rootScope, $controller, modalInstanceMock;
	
	beforeEach(inject(function(_$controller_, _$rootScope_) {
		$controller = _$controller_;
		$rootScope = _$rootScope_;
		
		modalInstanceMock = jasmine.createSpyObj('modalInstanceMock', ['close', 'dismiss'])
		
		ctrl = $controller('TerminateConfirmCtrl', {$scope: $rootScope, $uibModalInstance: modalInstanceMock, instance: {spotId: 'sid_123', instanceId: 'i_abc'}});
	}));
	
	it('should initialize scope', function() {
		expect($rootScope.spot).toBe('sid_123');
		expect($rootScope.instance).toBe('i_abc');
	});
	
	describe('$scope.ok', function() {
		it('should call close on OK', function() {
			$rootScope.ok();
			expect(modalInstanceMock.close).toHaveBeenCalled();
		});
	});
	
	describe('$scope.cancel', function() {
		it('should call dismiss on cancel', function() {
			$rootScope.cancel();
			expect(modalInstanceMock.dismiss).toHaveBeenCalled();
		});
	})
});