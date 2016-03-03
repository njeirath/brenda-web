function getAwsMock() {
	var EC2describeKeyPairsSpy = jasmine.createSpy();
	var EC2requestSpotInstancesSpy = jasmine.createSpy();
	var EC2runInstancesSpy = jasmine.createSpy();
	var SQSlistQueuesSpy = jasmine.createSpy();
	var SQSSendMessageBatchSpy = jasmine.createSpy();
	var SQSpurgeQueueSpy = jasmine.createSpy();
	var SQSgetQueueAttributesSpy = jasmine.createSpy();
	
	awsMock = {
		config: {
			update: jasmine.createSpy(),
			region: undefined,
			credentials: {}
		},
		EC2describeKeyPairs: EC2describeKeyPairsSpy,
		EC2requestSpotInstances: EC2requestSpotInstancesSpy,
		EC2runInstances: EC2runInstancesSpy,
		EC2: function() {
			this.describeKeyPairs = EC2describeKeyPairsSpy;
			this.requestSpotInstances = EC2requestSpotInstancesSpy;
			this.runInstances = EC2runInstancesSpy;
		},
		SQSlistQueues: SQSlistQueuesSpy,
		SQSSendMessageBatch: SQSSendMessageBatchSpy,
		SQSpurgeQueue: SQSpurgeQueueSpy,
		SQSgetQueueAttributes: SQSgetQueueAttributesSpy,
		SQS: function() {
			this.listQueues = SQSlistQueuesSpy;
			this.sendMessageBatch = SQSSendMessageBatchSpy;
			this.purgeQueue = SQSpurgeQueueSpy;
			this.getQueueAttributes = SQSgetQueueAttributesSpy;
		}
	};
	
	return awsMock;
}
