'use strict';

describe('Brenda Web', function() {

	describe('awsSetup page', function() {
		beforeEach(function() {
			browser.get('/app/#/awsSetup');
		});
		
		it('should have no values set by default', function() {
			expect(element(by.id('awsKeyId')).getText()).toBe('');
			expect(element(by.id('awsSecret')).getText()).toBe('');
			expect(element(by.id('awsRegion')).getText()).toBe('');
		});
		
		it('should save credentials when set button clicked', function() {
			element(by.id('awsKeyId')).sendKeys('abc');
			element(by.id('awsSecret')).sendKeys('def');
			element(by.id('awsRegion')).sendKeys('us-east-1');
			
			element(by.id('setCredentialsBtn')).click();
			
			browser.sleep(1000);
			
			expect(element(by.id('loginStatus')).getText()).toBe('Error: AuthFailure: AWS was not able to validate the provided access credentials');
			
			browser.get('/app/#/awsSetup');

			expect(element(by.id('awsKeyId')).getAttribute('value')).toBe('abc');
			expect(element(by.id('awsSecret')).getAttribute('value')).toBe('def');
			expect(element(by.id('awsRegion')).getAttribute('value')).toBe('us-east-1');
		});
	});
	
	describe('jobSetup page', function() {
		beforeEach(function() {
			browser.get('/app/#/jobSetup');
		});
		
		it('should have only start/end frames set by default', function() {
			expect(element(by.id('workTemplate')).getAttribute('value'))
				.toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a');
			expect(element(by.id('startFrame')).getAttribute('value')).toBe('1');
			expect(element(by.id('endFrame')).getAttribute('value')).toBe('240');
		});
	});
	
	describe('workerSetup page', function() {
		beforeEach(function() {
			browser.get('/app/#/workerSetup');
		});
		
		it('should have the fields presented with defaults', function() {
			expect(element(by.id('projectSource')).getAttribute('value')).toBe('');
			expect(element(by.id('frameDestination')).getAttribute('value')).toBe('');
		});
		
		it('should retain values if source/destination are changed', function() {
			element(by.id('projectSource')).sendKeys('abc');
			element(by.id('frameDestination')).sendKeys('def');
			
			browser.get('/app/#/workerSetup');
			
			expect(element(by.id('projectSource')).getAttribute('value')).toBe('abc');
			expect(element(by.id('frameDestination')).getAttribute('value')).toBe('def');
		});
	});
});
