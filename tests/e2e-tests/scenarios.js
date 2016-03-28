'use strict';

describe('Brenda Web', function() {

	describe('awsSetup page', function() {
		beforeEach(function() {
			browser.get('/app/#/setup');
		});
	});
	
	describe('jobSetup page', function() {
		beforeEach(function() {
			browser.get('/app/#/setup');
		});
		
		it('should have only start/end frames set by default', function() {
			expect(element(by.id('workTemplate')).getAttribute('value'))
				.toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a');
			expect(element(by.id('startFrame')).getAttribute('value')).toBe('1');
			expect(element(by.id('endFrame')).getAttribute('value')).toBe('240');
		});
	});
	
	describe('s3 page', function() {
		beforeEach(function() {
			browser.get('/app/#/setup');
		});
		
		it('should have the fields presented with defaults', function() {
			expect(element(by.id('projectSource')).getAttribute('value')).toBe('');
			expect(element(by.id('frameDestination')).getAttribute('value')).toBe('');
		});
		
		it('should retain values if source/destination are changed', function() {
			element(by.id('projectSource')).sendKeys('abc');
			element(by.id('frameDestination')).sendKeys('def');
			
			browser.get('/app/#/setup');
			
			expect(element(by.id('projectSource')).getAttribute('value')).toBe('abc');
			expect(element(by.id('frameDestination')).getAttribute('value')).toBe('def');
		});
	});
});
