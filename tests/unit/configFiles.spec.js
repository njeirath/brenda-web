describe('configFiles', function() {
	beforeEach(module('awsSetup'));
	
	describe('amiList.json', function() {
		var fileContents;
		
		beforeEach(function() {
			fileContents = readJSON('app/amiList.json');
		});
		
		it('should have the required fields set', function() {
			fileContents.amis.forEach(function(ami) {
				expect(ami.ami).toMatch(/^ami-[0-9a-f]{8}$/);
				expect(ami.blenderVersion).toMatch(/^[0-9\.a-b]+$/);
			});
		});
	});
});