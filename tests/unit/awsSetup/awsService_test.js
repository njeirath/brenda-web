'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('awsService', function() {
		var $rootScope, $controller, localStorageService, awsMock;
			
		beforeEach(function() {
			localStorageService = getLocalStorageMock();
			awsMock = getAwsMock();
			
			module(function($provide) {
				$provide.value('localStorageService', localStorageService);
				$provide.value('aws', awsMock);
			});
		});
			
		beforeEach(inject(function(_$controller_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$controller = _$controller_;
			
			spyOn($rootScope, '$broadcast');
		}));
		
		describe('service functionality', function() {
			var awsService;
			
			beforeEach(function() {
				inject(function($injector) {
	    			awsService = $injector.get('awsService');
	  			});
			});
			
			describe('setCredentials', function() {
				it('should update aws config', function() {
					awsService.setCredentials('key', 'secret');
					
					expect(awsMock.config.update).toHaveBeenCalled();
					expect(awsMock.config.update).toHaveBeenCalledWith({accessKeyId: 'key', secretAccessKey: 'secret'});
				});
			});
			
			describe('getKeyId', function() {
				it('should return credentials if set', function() {
					awsMock.config.credentials.accessKeyId = 'keyId';
					
					expect(awsService.getKeyId()).toBe('keyId');
				});
				
				it('should return empty string if not set', function() {
					awsMock.config.credentials = undefined;
					
					expect(awsService.getKeyId()).toBe('');
				});
			});
			
			describe('getKeySecret', function() {
				it('should return credentials if set', function() {
					awsMock.config.credentials.secretAccessKey = 'keySecret';
					
					expect(awsService.getKeySecret()).toBe('keySecret');
				});
				
				it('should return empty string if not set', function() {
					awsMock.config.credentials = undefined;
					
					expect(awsService.getKeySecret()).toBe('');
				});
			});
			
			describe('setRegion', function() {
				it('should update aws config', function() {
					awsService.setRegion('us-east-1');
					
					expect(awsMock.config.region).toBe('us-east-1');
				});
			});
			
			describe('getRegion', function() {
				it('should return region when called', function() {
					awsMock.config.region = 'us-west-1';
					
					expect(awsService.getRegion()).toBe('us-west-1');
				});
			});
			
			describe('testCredentials', function() {
				var callback;
				
				beforeEach(function() {
					awsService.testCredentials();
					callback = awsMock.EC2describeKeyPairs.calls.argsFor(0)[1];
				});
				
				it('should call describeKeyPairs', function() {
					expect(awsMock.EC2describeKeyPairs).toHaveBeenCalled();
				});
				
				it('should broadcast aws-login-error in case of error response', function() {
					callback('Error message', null);
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-login-error', 'Error message');
				});
				
				it('should broadcast aws-login-success in case of success response', function() {
					callback(null, '');
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-login-success');
				});
			});
			
			describe('getQueues', function() {
				var callback;
				
				beforeEach(function() {
					awsService.getQueues();
					callback = awsMock.SQSlistQueues.calls.argsFor(0)[1];
				});
				
				it('should call listQueues', function() {
					expect(awsMock.SQSlistQueues).toHaveBeenCalled();
				});
				
				it('should broadcast aws-sqs-error in case of error response', function() {
					callback('Error', null);
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-sqs-error', 'Error');
				});
				
				it('should broadcast aws-sqs-success in case of success', function() {
					var queueList = ['Q1', 'Q2'];
					callback(null, queueList);
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-sqs-success', queueList);
				});
			});
			
			describe('sendToQueue', function() {
				beforeEach(function() {
					awsService.sendToQueue('url', ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12']);
				});
				
				it('should store the queue url to localstorage', function() {
					expect(localStorageService.set).toHaveBeenCalledWith('awsQueue', 'url');
				});
				
				it('should broadcast aws-sqs-send-update with status changes', function() {
					expect($rootScope.$broadcast.calls.count()).toBe(3);
					var call1 = $rootScope.$broadcast.calls.argsFor(0);
					
					expect($rootScope.$broadcast.calls.argsFor(0)).toEqual(['aws-sqs-send-update', {total: 12, success: 0, failed: 0, inFlight: 0}]);
					expect($rootScope.$broadcast.calls.argsFor(1)).toEqual(['aws-sqs-send-update', {total: 12, success: 0, failed: 0, inFlight: 10}]);
					expect($rootScope.$broadcast.calls.argsFor(2)).toEqual(['aws-sqs-send-update', {total: 12, success: 0, failed: 0, inFlight: 12}]);
				});
				
				it('should call sendMessageBatch appropriately', function() {
					expect(awsMock.SQSSendMessageBatch.calls.count()).toBe(2);
					var call1Args = awsMock.SQSSendMessageBatch.calls.argsFor(0);
					var call2Args = awsMock.SQSSendMessageBatch.calls.argsFor(1);
					
					var expected1 = {
						Entries: [
							{MessageBody: btoa('t1'), Id: '0'},
							{MessageBody: btoa('t2'), Id: '1'},
							{MessageBody: btoa('t3'), Id: '2'},
							{MessageBody: btoa('t4'), Id: '3'},
							{MessageBody: btoa('t5'), Id: '4'},
							{MessageBody: btoa('t6'), Id: '5'},
							{MessageBody: btoa('t7'), Id: '6'},
							{MessageBody: btoa('t8'), Id: '7'},
							{MessageBody: btoa('t9'), Id: '8'},
							{MessageBody: btoa('t10'), Id: '9'}
						],
						QueueUrl: 'url'
					};
					
					var expected2 = {
						Entries: [
							{MessageBody: btoa('t11'), Id: '10'},
							{MessageBody: btoa('t12'), Id: '11'}
						],
						QueueUrl: 'url'
					};
					
					expect(call1Args[0]).toEqual(expected1);
					expect(call2Args[0]).toEqual(expected2);
				});
				
				it('should broadcast aws-sqs-send-update appropriately when errors from callback', function() {
					var callback1 = awsMock.SQSSendMessageBatch.calls.argsFor(0)[1];
					var callback2 = awsMock.SQSSendMessageBatch.calls.argsFor(1)[1];
					
					callback2('Error', null);
					callback1('Error', null);
					
					expect($rootScope.$broadcast.calls.argsFor(3)).toEqual(['aws-sqs-send-update', {total: 12, success: 0, failed: 2, inFlight: 10}]);
					expect($rootScope.$broadcast.calls.argsFor(4)).toEqual(['aws-sqs-send-update', {total: 12, success: 0, failed: 12, inFlight: 0}]);
				});
				
				it('should broadcast aws-sqs-send-update appropriately when success from callback', function() {
					var callback1 = awsMock.SQSSendMessageBatch.calls.argsFor(0)[1];
					var callback2 = awsMock.SQSSendMessageBatch.calls.argsFor(1)[1];
					
					callback2(null, {Successful: new Array(2), Failed: []});
					callback1(null, {Successful: new Array(10), Failed: []});
					
					expect($rootScope.$broadcast.calls.argsFor(3)).toEqual(['aws-sqs-send-update', {total: 12, success: 2, failed: 0, inFlight: 10}]);
					expect($rootScope.$broadcast.calls.argsFor(4)).toEqual(['aws-sqs-send-update', {total: 12, success: 12, failed: 0, inFlight: 0}]);
				});
				
				it('should broadcast aws-sqs-send-update appropriately when mixed results from callback', function() {
					var callback1 = awsMock.SQSSendMessageBatch.calls.argsFor(0)[1];
					var callback2 = awsMock.SQSSendMessageBatch.calls.argsFor(1)[1];
					
					callback2(null, {Successful: new Array(1), Failed: new Array(1)});
					callback1("error", null);
					
					expect($rootScope.$broadcast.calls.argsFor(3)).toEqual(['aws-sqs-send-update', {total: 12, success: 1, failed: 1, inFlight: 10}]);
					expect($rootScope.$broadcast.calls.argsFor(4)).toEqual(['aws-sqs-send-update', {total: 12, success: 1, failed: 11, inFlight: 0}]);
				});
			});
			
			describe('getQueue', function() {
				it('should retrieve queue url from local storage', function() {
					localStorageService.set('awsQueue', 'test url');
					expect(awsService.getQueue()).toBe('test url');
					expect(localStorageService.get).toHaveBeenCalledWith('awsQueue');
				});
			});
			
			describe('clearQueue', function() {
				beforeEach(function() {
					awsService.clearQueue('url');
				});
				
				it('should purge the queue when called', function() {
					expect(awsMock.SQSpurgeQueue).toHaveBeenCalled();
					expect(awsMock.SQSpurgeQueue.calls.argsFor(0)[0]).toEqual({QueueUrl: 'url'});
				});
			});
			
			describe('getQueueSize', function() {
				var promise, awsCallback;
				
				beforeEach(function() {
					promise = awsService.getQueueSize('url');
					awsCallback = awsMock.SQSgetQueueAttributes.calls.argsFor(0)[1];
				});
				
				it('should query aws for queue parameters', function() {
					expect(awsMock.SQSgetQueueAttributes).toHaveBeenCalled();
					expect(awsMock.SQSgetQueueAttributes.calls.argsFor(0)[0]).toEqual(
						{
							QueueUrl: 'url', 
							AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
						});
					awsCallback('error', null);
					$rootScope.$apply();
				});
				
				it('should pass along the error message in case an error occurs', function() {
					awsCallback('error', null);
					
					var msg = '';
					promise.then(function(data){
					}, function(err){
						msg = err;
					});
					$rootScope.$apply();
					
					expect(msg).toBe('error');
				});
				
				it('should return the queue size upon success', function() {
					awsCallback(null, {Attributes: {ApproximateNumberOfMessages: 5}});
					
					var size = -1;
					promise.then(function(data) {
						size = data;
					});
					
					$rootScope.$apply();
					
					expect(size).toBe(5);
				});
			});
			
			describe('getKeyPairs', function() {
				var callback;
				
				beforeEach(function() {
					callback = jasmine.createSpy();
					awsService.getKeyPairs(callback);
				});
				
				it('should request keypairs from EC2', function() {
					expect(awsMock.EC2describeKeyPairs).toHaveBeenCalled();
					expect(awsMock.EC2describeKeyPairs.calls.argsFor(0)[0]).toEqual({});
				});
				
				it('should broadcast aws-ec2-error on errors', function() {
					var awsCallback = awsMock.EC2describeKeyPairs.calls.argsFor(0)[1];
					awsCallback('error', null);
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-ec2-error', 'error');
				});
				
				it('should call supplied callback on success', function() {
					var awsCallback = awsMock.EC2describeKeyPairs.calls.argsFor(0)[1];
					awsCallback(null, 'some datas');
					expect(callback).toHaveBeenCalledWith('some datas');
				});
			});
			
			describe('getLaunchSpecification', function() {
				var expectedResponse, snapshots;
				
				beforeEach(function() {
					snapshots = undefined;
					
					expectedResponse = {
						ImageId: 'ami_123',
						KeyName: 'brendaKey',
						SecurityGroups: ['brendaSG'],
						UserData: btoa('bunches of stuff here'),
						InstanceType: 'c3.large'
					};
				});
				
				afterEach(function() {
					expect(awsService.getLaunchSpecification('ami_123', 'brendaKey', 'brendaSG', 'bunches of stuff here', 'c3.large', snapshots))
					.toEqual(expectedResponse);
				});
				
				it('should construct the ec2 lauch specification correctly', function() {
					
				});
				
				it('should add in EBS volume if only one provided', function() {
					snapshots = ['snap-123'];
					
					expectedResponse.BlockDeviceMappings = [{
						DeviceName: '/dev/sdf',
						Ebs: {
							SnapshotId: 'snap-123',
							DeleteOnTermination: true
						}
					}];
				});
				
				it('should add in EBS volumes if multiple provided', function() {
					snapshots = ['snap-123', 'snap-456'];
					
					expectedResponse.BlockDeviceMappings = [{
						DeviceName: '/dev/sdf',
						Ebs: {
							SnapshotId: 'snap-123',
							DeleteOnTermination: true
						}
					},{
						DeviceName: '/dev/sdg',
						Ebs: {
							SnapshotId: 'snap-456',
							DeleteOnTermination: true
						}
					}];
				});
			});
			
			describe('requestSpot', function() {
				var callback, serviceCallback;
				
				beforeEach(function() {
					callback = jasmine.createSpy();
					awsService.requestSpot('ami_123', 'brendaKey', 'brendaSG', 'bunches of stuff here', 'c3.large', null, 0.02, 1, 'one-time', 'queueName', 'frame dest', callback);
					serviceCallback = awsMock.EC2requestSpotInstances.calls.argsFor(0)[1];
				});
				
				it('should make a request to ec2 with appropriate parameters', function() {
					expect(awsMock.EC2requestSpotInstances).toHaveBeenCalled();
					expect(awsMock.EC2requestSpotInstances.calls.argsFor(0)[0]).toEqual({
						SpotPrice: '0.02', 
						InstanceCount: 1,
						Type: 'one-time', 
						LaunchSpecification: { 
							ImageId: 'ami_123', 
							KeyName: 'brendaKey', 
							SecurityGroups: ['brendaSG'], 
							UserData: 'YnVuY2hlcyBvZiBzdHVmZiBoZXJl', 
							InstanceType: 'c3.large'
						}
					});
				});
				
				it('should make a request with EBS volumes if provided', function() {
					awsService.requestSpot('ami_123', 'brendaKey', 'brendaSG', 'bunches of stuff here', 'c3.large', ['snap-123'], 0.02, 1, 'one-time', 'queueName', 'frame dest', callback);
					expect(awsMock.EC2requestSpotInstances.calls.argsFor(1)[0].LaunchSpecification.BlockDeviceMappings).toEqual([{
						DeviceName: '/dev/sdf',
						Ebs: {
							DeleteOnTermination: true,
							SnapshotId: 'snap-123'
						}
					}]);
				});
				
				it('should call callback with danger and message on error', function() {
					serviceCallback('Error message', null);
					expect(callback).toHaveBeenCalledWith('danger', 'Error message');
				});
				
				it('should call to set tags on request instances', function() {
					serviceCallback(null, {
						SpotInstanceRequests: [{SpotInstanceRequestId: 'requestId1'}]
					});
					expect(awsMock.EC2createTags).toHaveBeenCalledWith({
						Resources: ['requestId1'],
						Tags: [{Key: 'brenda-queue', Value: 'queueName'}, {Key: 'brenda-dest', Value: 'frame dest'}]
					}, jasmine.any(Function));
				});
				
				describe('setTags callback', function() {
					var setTagsCallback;
					
					beforeEach(function() {
						serviceCallback(null, {
							SpotInstanceRequests: [{SpotInstanceRequestId: 'requestId1'}]
						});
						
						setTagsCallback = awsMock.EC2createTags.calls.argsFor(0)[1];
					});
					
					it('should call status callback with warning on tagging error', function() {
						setTagsCallback('Error happened', null);
						expect(callback).toHaveBeenCalledWith('warning', 'Spot instances requested but could not set tags (may affect dashboard)');
					});
					
					it('should call status callback with success on tagging success', function() {
						setTagsCallback(null, 'success');
						expect(callback).toHaveBeenCalledWith('success', 'Spot instances requested');
					});
				});
			});
			
			describe('requestOndemand', function() {
				var callback, serviceCallback;
				
				beforeEach(function() {
					callback = jasmine.createSpy();
					awsService.requestOndemand('ami_123', 'brendaKey', 'brendaSG', 'bunches of stuff here', 'c3.large', null, 1, 'queueName', 'frame dest', callback);
					serviceCallback = awsMock.EC2runInstances.calls.argsFor(0)[1];
				});
				
				it('should make a request to ec2 with appropriate parameters', function() {
					expect(awsMock.EC2runInstances).toHaveBeenCalled();
					expect(awsMock.EC2runInstances.calls.argsFor(0)[0]).toEqual({
						ImageId: 'ami_123', 
						KeyName: 'brendaKey', 
						SecurityGroups: ['brendaSG'], 
						UserData: 'YnVuY2hlcyBvZiBzdHVmZiBoZXJl', 
						InstanceType: 'c3.large',
						MinCount: 1,
						MaxCount: 1,
						InstanceInitiatedShutdownBehavior: 'terminate'
					});
				});
				
				it('should include block mappings if snapshots provided', function() {
					awsService.requestOndemand('ami_123', 'brendaKey', 'brendaSG', 'bunches of stuff here', 'c3.large', ['snap-123'], 1, 'queueName', 'frame dest', callback);
					expect(awsMock.EC2runInstances.calls.argsFor(1)[0].BlockDeviceMappings).toEqual([{
						DeviceName: '/dev/sdf',
						Ebs: {
							DeleteOnTermination: true,
							SnapshotId: 'snap-123'
						}
					}]);
				})
				
				it('should call callback with danger and error message on error', function() {
					serviceCallback('Error message', null);
					expect(callback).toHaveBeenCalledWith('danger', 'Error message');
				});
				
				it('should call to set tags on new instances', function() {
					serviceCallback(null, {
						Instances: [{InstanceId: 'instanceId1'}]
					});
					expect(awsMock.EC2createTags).toHaveBeenCalledWith({
						Resources: ['instanceId1'],
						Tags: [{Key: 'brenda-queue', Value: 'queueName'}, {Key: 'brenda-dest', Value: 'frame dest'}]
					}, jasmine.any(Function));
				});
				
				describe('setTags callback', function() {
					var setTagsCallback;
					
					beforeEach(function() {
						serviceCallback(null, {
							Instances: [{InstanceId: 'instanceId1'}]
						});
						
						setTagsCallback = awsMock.EC2createTags.calls.argsFor(0)[1];
					});
					
					it('should call status callback with warning on tagging error', function() {
						setTagsCallback('Error happened', null);
						expect(callback).toHaveBeenCalledWith('warning', 'On demand instances requested but could not set tags (may affect dashboard)');
					});
					
					it('should call status callback with success on tagging success', function() {
						setTagsCallback(null, 'success');
						expect(callback).toHaveBeenCalledWith('success', 'On demand instances requested');
					});
				});
			});
			
			describe('getSpotRequests', function() {
				var promise, serviceCallback;
				
				beforeEach(function() {
					promise = awsService.getSpotRequests();
					serviceCallback = awsMock.EC2describeSpotInstanceRequests.calls.argsFor(0)[1];
				});
				
				it('should request spot instances from aws', function() {
					expect(awsMock.EC2describeSpotInstanceRequests)
						.toHaveBeenCalledWith({Filters: [{Name: 'tag-key', Values: ['brenda-queue']}]}, jasmine.any(Function));
				});
				
				it('should reject promise on error', function() {
					serviceCallback('error message', null);
					
					var msg = '';
					promise.then(function(data) {
					}, function(error) {
						msg = error;
					});
					
					$rootScope.$apply();
					
					expect(msg).toBe('error message');
				});
				
				it('should resolve the promise on success', function() {
					serviceCallback(null, 'success datas');
					
					var msg = '';
					promise.then(function(data) {
						msg = data;
					});
					
					$rootScope.$apply();
					expect(msg).toBe('success datas');
				});
			});
			
			describe('getInstanceDetails', function() {
				var promise, serviceCallback;
				
				beforeEach(function() {
					promise = awsService.getInstanceDetails();
					serviceCallback = awsMock.EC2describeInstances.calls.argsFor(0)[1];
				});
				
				it('should request instances from aws by tag if no params passed in', function() {
					expect(awsMock.EC2describeInstances)
						.toHaveBeenCalledWith({Filters: [{Name: 'tag-key', Values: ['brenda-queue']}]}, jasmine.any(Function));
				});
				
				it('should request specific instances if a list is provided', function() {
					promise = awsService.getInstanceDetails(['i_1', 'i_2']);
					
					expect(awsMock.EC2describeInstances)
						.toHaveBeenCalledWith({InstanceIds: ['i_1', 'i_2']}, jasmine.any(Function));
				});
				
				it('should reject promise on error', function() {
					serviceCallback('error message', null);
					
					var msg = '';
					promise.then(function(data) {
					}, function(error) {
						msg = error;
					});
					
					$rootScope.$apply();
					
					expect(msg).toBe('error message');
				});
				
				it('should resolve the promise on success', function() {
					serviceCallback(null, 'success datas');
					
					var msg = '';
					promise.then(function(data) {
						msg = data;
					});
					
					$rootScope.$apply();
					expect(msg).toBe('success datas');
				});
			});
			
			describe('getSecurityGroups', function() {
				var promise, serviceCallback;
				
				beforeEach(function() {
					promise = awsService.getSecurityGroups('brenda-web');
					serviceCallback = awsMock.EC2describeSecurityGroups.calls.argsFor(0)[1];
				});
				
				it('should call to describe security groups', function() {
					expect(awsMock.EC2describeSecurityGroups).toHaveBeenCalledWith({GroupNames: ['brenda-web']}, jasmine.any(Function));
				});
				
				it('should reject if error received', function() {
					serviceCallback('err msg', null);
					
					var msg = '';
					promise.then(function(data){}, function(err) {
						msg = err;
					});
					$rootScope.$apply();
					
					expect(msg).toBe('err msg');
				});
				
				it('should resolve if success', function() {
					serviceCallback(null, 'success');
					
					var msg = '';
					promise.then(function(data) {
						msg = data;
					});
					$rootScope.$apply();
					
					expect(msg).toBe('success');
				});
			});
			
			describe('createSecurityGroup', function() {
				var promise, createSGcallback, errResp, dataResp;
				
				beforeEach(function() {
					promise = awsService.createSecurityGroup();
					createSGcallback = awsMock.EC2createSecurityGroup.calls.argsFor(0)[1];
					
					promise.then(function(data) {
						dataResp = data;
					}, function(err) {
						errResp = err;
					});
				});
				
				it('should call to create SG', function() {
					expect(awsMock.EC2createSecurityGroup).toHaveBeenCalledWith({
						GroupName: 'brenda-web',
						Description: 'Security group used by brenda-web.com'
					}, jasmine.any(Function));
				});
				
				it('should reject if error creating SG', function() {
					createSGcallback('SG err', null);
					$rootScope.$apply();
					expect(errResp).toBe('SG err');
				});
				
				it('should call to setup ingress on create SG success', function() {
					createSGcallback(null, {GroupId: 'sg_123'});
					expect(awsMock.EC2authorizeSecurityGroupIngress).toHaveBeenCalledWith({
						IpPermissions: [
							{FromPort: 22, IpProtocol: 'tcp', IpRanges: [{CidrIp: '0.0.0.0/0'}], ToPort: 22}, 
							{FromPort: 80, IpProtocol: 'tcp', IpRanges: [{CidrIp: '0.0.0.0/0'}], ToPort: 80}, 
							{FromPort: -1, IpProtocol: 'icmp', IpRanges: [{CidrIp: '0.0.0.0/0'}], ToPort: -1}
						],
						GroupId: 'sg_123'
					}, jasmine.any(Function));
				});
			});
			
			describe('createQueue', function() {
				var promise, serviceCallback, errResp, dataResp;
				
				beforeEach(function() {
					promise = awsService.createQueue('brenda-web');
					serviceCallback = awsMock.SQScreateQueue.calls.argsFor(0)[1];
					
					promise.then(function(data) {
						dataResp = data;
					}, function(err) {
						errResp = err;
					});
				});
				
				it('should call to create queue', function() {
					expect(awsMock.SQScreateQueue).toHaveBeenCalledWith({
						QueueName: 'brenda-web',
						Attributes: {
							VisibilityTimeout: '120'
						}
					}, jasmine.any(Function));
				});
				
				it('should reject on error', function() {
					serviceCallback('err msg', null);
					$rootScope.$apply();
					expect(errResp).toBe('err msg');
				});
				
				it('should resolve on success', function() {
					serviceCallback(null, 'success');
					$rootScope.$apply();
					expect(dataResp).toBe('success');
				});
			});
			
			describe('listObjects', function() {
				var promise, errResp, dataResp;
				
				beforeEach(function() {
					promise = awsService.listObjects('bucketName');
					
					promise.then(function(data) {
						dataResp = data;
					}, function(err) {
						errResp = err;
					});
				});
				
				it('should call to list objects', function() {
					expect(awsMock.S3listObjects).toHaveBeenCalledWith({Bucket: 'bucketName'}, jasmine.any(Function));
				});
			});
			
			describe('getObjectUri', function() {
				beforeEach(function() {
					awsMock.S3getSignedUrl.and.returnValue('signed url');
				});
				
				it('should call to get a signed url', function() {
					awsService.getObjectUri('bucket', 'key');
					expect(awsMock.S3getSignedUrl).toHaveBeenCalledWith('getObject', {Bucket: 'bucket', Key: 'key', Expires: 3600});
					expect(awsService.uriCache['bucket-key']).toEqual({url: 'signed url', expiration: jasmine.any(Object)});
				});
				
				it('should return a cached url if a valid one exists', function() {
					awsService.uriCache['bucket-key'] = {url: 'cached url', expiration: new Date(new Date().valueOf() + 3600*1000)};
					expect(awsService.getObjectUri('bucket', 'key')).toBe('cached url');
				});
				
				it('should return a new url if the cached one is expired', function() {
					awsService.uriCache['bucket-key'] = {url: 'cached url', expiration: new Date(new Date().valueOf() - 3600*1000)};
					expect(awsService.getObjectUri('bucket', 'key')).toBe('signed url');
				});
			});
			
			describe('getAvailabilityZones', function() {
				var promise, serviceCallback, errResp, dataResp;
				
				beforeEach(function() {
					promise = awsService.getAvailabilityZones();
					serviceCallback = awsMock.EC2describeAvailabilityZones.calls.argsFor(0)[1];
					
					promise.then(function(data) {
						dataResp = data;
					}, function(err) {
						errResp = err;
					});
				});
				
				it('should call to get AZs from aws', function() {
					expect(awsMock.EC2describeAvailabilityZones).toHaveBeenCalled();
				});
				
				it('should reject promise on error', function() {
					serviceCallback('error', null);
					$rootScope.$apply();
					expect(errResp).toBe('error');
				});
				
				it('should resolve and return array on success', function() {
					serviceCallback(null, {AvailabilityZones: [{ZoneName: 'zone1'}, {ZoneName: 'zone2'}]});
					$rootScope.$apply();
					expect(dataResp).toEqual(['zone1', 'zone2']);
				});
			});
			
			describe('getSpotPrices', function() {
				var serviceCallback;
				
				beforeEach(function() {
					awsService.getSpotPrices();
					serviceCallback = awsMock.EC2describeSpotPriceHistory.calls.argsFor(0)[1];
				});
				
				it('should request spot price history from aws', function() {
					expect(awsMock.EC2describeSpotPriceHistory).toHaveBeenCalledWith({Filters: [{Name: 'product-description', Values: ['Linux/UNIX']}], StartTime: jasmine.any(Object)}, jasmine.any(Function));
				});
				
				it('should set next token on request if provided', function() {
					awsService.getSpotPrices('abc123');
					expect(awsMock.EC2describeSpotPriceHistory).toHaveBeenCalledWith({NextToken: 'abc123', Filters: [{Name: 'product-description', Values: ['Linux/UNIX']}], StartTime: jasmine.any(Object)}, jasmine.any(Function));
				});
				
				it('should broadcast aws-spotprice-update on success', function() {
					serviceCallback(null, 'datas');
					expect($rootScope.$broadcast).toHaveBeenCalledWith('aws-spotprice-update', 'datas')
				});
			});
			
			describe('cancelSpotRequest', function() {
				it('should call to cancel spot requests', function() {
					awsService.cancelSpotRequest('sid_123');
					expect(awsMock.EC2cancelSpotInstanceRequests).toHaveBeenCalledWith({
						SpotInstanceRequestIds: ['sid_123']
					}, jasmine.any(Function));
				});
			});
			
			describe('terminateInstance', function() {
				it('should call to terminate instances', function() {
					awsService.terminateInstance('i_abc');
					expect(awsMock.EC2terminateInstances).toHaveBeenCalledWith({
						InstanceIds: ['i_abc']
					}, jasmine.any(Function));
				});
			});
			
			describe('deferredWrapper', function() {
				var errResp, dataResp, handlerCallback;
				
				beforeEach(function() {
					var promise = awsService.terminateInstance('i_abc');
					handlerCallback = awsMock.EC2terminateInstances.calls.argsFor(0)[1];
					
					promise.then(function(data) {
						dataResp = data;
					}, function(err) {
						errResp = err;
					});
				});
				
				it('should resolve with data on success', function() {
					handlerCallback(null, 'data');
					$rootScope.$apply();
					expect(dataResp).toBe('data');
				});
				
				it('should reject with error on failure', function() {
					handlerCallback('err', null);
					$rootScope.$apply();
					expect(errResp).toBe('err');
				});
			});
		});
	});
});