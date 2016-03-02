function getAwsMock() {
	var EC2describeKeyPairsSpy = jasmine.createSpy();
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
		EC2: function() {
			this.describeKeyPairs = EC2describeKeyPairsSpy;
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
