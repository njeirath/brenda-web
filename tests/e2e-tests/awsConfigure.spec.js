'use strict';

describe('AWS Configure Page', function() {
	beforeEach(function() {
		browser.driver.manage().window().setSize(1280, 1024);
	})
	
	describe('awsConfigureButton', function() {
		it('appears on landing page', function() {
			browser.get('/app/');
			expect(element(by.id('awsConfigureButton')).isPresent()).toBe(true);
		});
		
		it('appears on setup page', function() {
			browser.get('/app/#/setup');
			expect(element(by.id('awsConfigureButton')).isPresent()).toBe(true);
		});
		
		it('appears on dashboard page', function() {
			browser.get('/app/#/dashboard');
			expect(element(by.id('awsConfigureButton')).isPresent()).toBe(true);
		});
	});

	describe('Configuration Modal', function() {
		beforeEach(function() {
			browser.get('/app/#');
			element(by.id('awsConfigureButton')).click();
		});
		
		it('should have 3 empty text inputs and a set credentials button', function() {
			expect(element(by.id('awsKeyId')).getAttribute('value')).toBe('');
			expect(element(by.id('awsSecret')).getAttribute('value')).toBe('');
			expect(element(by.id('awsRegion')).getAttribute('value')).toBe('');
			
			expect(element(by.id('setCredentialsBtn')).isPresent()).toBe(true);
		});
		
		it('should show 3 errors when clicking set credentials without data', function() {
			element(by.id('setCredentialsBtn')).click();
			
			expect(element(by.css('[ng-messages="awsConfigure.awsKeyId.$error"]')).isPresent()).toBe(true);
			expect(element(by.css('[ng-messages="awsConfigure.awsSecret.$error"]')).isPresent()).toBe(true);
			expect(element(by.css('[ng-messages="awsConfigure.awsRegion.$error"]')).isPresent()).toBe(true);
		});
	});
	
//	beforeEach(function() {
//		browser.get('/app/#/setup');
//		browser.sleep(2000);
//		var configBtn = element(by.id('awsConfigureButton'))
//		configBtn.click();
//	});
//	
	
	
});
