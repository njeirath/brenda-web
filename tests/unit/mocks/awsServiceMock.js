function getAwsServiceMock() {
	var EC2getKeyPairsSpy = jasmine.createSpy();
	
	return {
		getKeyPairs: EC2getKeyPairsSpy
	};
}
