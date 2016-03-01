'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('awsService', function() {
		var $rootScope, $controller, localStorageService, awsMock;
			
		beforeEach(function() {
			localStorageService = getLocalStorageMock();
			
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
		
		describe('initialization process', function() {
			var awsService;
			
			it('should attempt to retrieve settings from local storage', function() {				
				inject(function($injector) {
	    			awsService = $injector.get('awsService');
	  			});
	  			
	  			expect(localStorageService.get).toHaveBeenCalled();
	  			expect(localStorageService.get).toHaveBeenCalledWith('keyId');
	  			expect(localStorageService.get).toHaveBeenCalledWith('keySecret');
	  			expect(localStorageService.get).toHaveBeenCalledWith('region');
			});
			
			it('should not initialize AWS if nothing in local storage', function() {
				inject(function($injector) {
	    			awsService = $injector.get('awsService');
	  			});
	  			
	  			expect(awsMock.config.update).not.toHaveBeenCalled();
	  			expect(awsMock.config.region).toBe(undefined);
			});
			
			it('should initialize AWS if all vars are set in local storage', function() {
				localStorageService.set('keyId', '123');
				localStorageService.set('keySecret', '456');
				localStorageService.set('region', 'us-east-1');
				
				inject(function($injector) {
	    			awsService = $injector.get('awsService');
	  			});
	  			
	  			expect(awsMock.config.update).toHaveBeenCalled();
	  			expect(awsMock.config.region).toBe('us-east-1');
			});
		});
		
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
				
				it('should update local storage', function() {
					awsService.setCredentials('key', 'secret');
					
					expect(localStorageService.set).toHaveBeenCalledWith('keyId', 'key');
					expect(localStorageService.set).toHaveBeenCalledWith('keySecret', 'secret');
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
				
				it('should save value to local storage', function() {
					awsService.setRegion('us-east-1');
					
					expect(localStorageService.set).toHaveBeenCalledWith('region', 'us-east-1');
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
				var callback;
				
				beforeEach(function() {
					callback = jasmine.createSpy();
					awsService.getQueueSize('url', callback);
				});
				
				it('should query aws for queue parameters', function() {
					expect(awsMock.SQSgetQueueAttributes).toHaveBeenCalled();
					expect(awsMock.SQSgetQueueAttributes.calls.argsFor(0)[0]).toEqual(
						{
							QueueUrl: 'url', 
							AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
						});
				});
				
				it('should pass along the error message in case an error occurs', function() {
					var awsCallback = awsMock.SQSgetQueueAttributes.calls.argsFor(0)[1];
					awsCallback('error', null);
					expect(callback).toHaveBeenCalledWith('error');
				});
				
				it('should return the queue size upon success', function() {
					var awsCallback = awsMock.SQSgetQueueAttributes.calls.argsFor(0)[1];
					awsCallback(null, {Attributes: {ApproximateNumberOfMessages: 5}});
					expect(callback).toHaveBeenCalledWith(5);
				});
			});
		});
	});
});