function getAwsServiceMock() {	
	var getKeyPairsSpy = jasmine.createSpy();
	
	var mock= {
		getKeyPairs: getKeyPairsSpy,
		getKeyId: function() {
			return 'accessKey';
		},
		getKeySecret: function() {
			return 'secretKey';
		},
		getQueue: function() {
			return 'sqs/url/queueName';
		},
		requestSpot: function(){},
		requestOndemand: function(){}
	};
		
	spyOn(mock, 'getKeyId').and.callThrough();
	spyOn(mock, 'getKeySecret').and.callThrough();
	spyOn(mock, 'getQueue').and.callThrough();
	spyOn(mock, 'requestSpot');
	spyOn(mock, 'requestOndemand');
		
	return mock;
}
