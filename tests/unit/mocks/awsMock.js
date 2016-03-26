function getAwsMock() {
	var EC2describeKeyPairsSpy = jasmine.createSpy();
	var EC2requestSpotInstancesSpy = jasmine.createSpy();
	var EC2runInstancesSpy = jasmine.createSpy();
	var EC2createTagsSpy = jasmine.createSpy();
	var EC2describeSpotInstanceRequestsSpy = jasmine.createSpy();
	var EC2describeInstancesSpy = jasmine.createSpy();
	var EC2describeSecurityGroupsSpy = jasmine.createSpy();
	var EC2createSecurityGroupSpy = jasmine.createSpy();
	var EC2authorizeSecurityGroupIngressSpy = jasmine.createSpy();
	var EC2describeAvailabilityZonesSpy = jasmine.createSpy();
	var EC2describeSpotPriceHistorySpy = jasmine.createSpy();
	var SQSlistQueuesSpy = jasmine.createSpy();
	var SQSSendMessageBatchSpy = jasmine.createSpy();
	var SQSpurgeQueueSpy = jasmine.createSpy();
	var SQSgetQueueAttributesSpy = jasmine.createSpy();
	var SQScreateQueueSpy = jasmine.createSpy();
	var S3listObjectsSpy = jasmine.createSpy();
	var S3getSignedUrlSpy = jasmine.createSpy();
	
	awsMock = {
		config: {
			update: jasmine.createSpy(),
			region: undefined,
			credentials: {}
		},
		EC2describeKeyPairs: EC2describeKeyPairsSpy,
		EC2requestSpotInstances: EC2requestSpotInstancesSpy,
		EC2runInstances: EC2runInstancesSpy,
		EC2createTags: EC2createTagsSpy,
		EC2describeSpotInstanceRequests: EC2describeSpotInstanceRequestsSpy,
		EC2describeInstances: EC2describeInstancesSpy,
		EC2describeSecurityGroups: EC2describeSecurityGroupsSpy,
		EC2createSecurityGroup: EC2createSecurityGroupSpy,
		EC2authorizeSecurityGroupIngress: EC2authorizeSecurityGroupIngressSpy,
		EC2describeAvailabilityZones: EC2describeAvailabilityZonesSpy,
		EC2describeSpotPriceHistory: EC2describeSpotPriceHistorySpy,
		EC2: function() {
			this.describeKeyPairs = EC2describeKeyPairsSpy;
			this.requestSpotInstances = EC2requestSpotInstancesSpy;
			this.runInstances = EC2runInstancesSpy;
			this.createTags = EC2createTagsSpy;
			this.describeSpotInstanceRequests = EC2describeSpotInstanceRequestsSpy;
			this.describeInstances = EC2describeInstancesSpy;
			this.describeSecurityGroups = EC2describeSecurityGroupsSpy;
			this.createSecurityGroup = EC2createSecurityGroupSpy;
			this.authorizeSecurityGroupIngress = EC2authorizeSecurityGroupIngressSpy;
			this.describeAvailabilityZones = EC2describeAvailabilityZonesSpy;
			this.describeSpotPriceHistory = EC2describeSpotPriceHistorySpy;
		},
		SQSlistQueues: SQSlistQueuesSpy,
		SQSSendMessageBatch: SQSSendMessageBatchSpy,
		SQSpurgeQueue: SQSpurgeQueueSpy,
		SQSgetQueueAttributes: SQSgetQueueAttributesSpy,
		SQScreateQueue: SQScreateQueueSpy,
		SQS: function() {
			this.listQueues = SQSlistQueuesSpy;
			this.sendMessageBatch = SQSSendMessageBatchSpy;
			this.purgeQueue = SQSpurgeQueueSpy;
			this.getQueueAttributes = SQSgetQueueAttributesSpy;
			this.createQueue = SQScreateQueueSpy;
		},
		S3listObjects: S3listObjectsSpy,
		S3getSignedUrl: S3getSignedUrlSpy,
		S3: function() {
			this.listObjects = S3listObjectsSpy;
			this.getSignedUrl = S3getSignedUrlSpy;
		}
	};
	
	return awsMock;
}
