'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('Controllers', function() {
		var $rootScope, $controller;
			
		beforeEach(inject(function(_$controller_, _$rootScope_) {
			$rootScope = _$rootScope_.$new();
			$controller = _$controller_;
		}));
		
		
		describe('AwsSetupCtrl', function() {
			var awsServiceMock;
			
			beforeEach(function() {
				awsServiceMock = {
					region: '',
					keyId: '',
					secret: '',
					testCredsCalled: false,
					getRegion: function() {
						return this.region;
					},
					getKeyId: function() {
						return this.keyId;
					},
					getKeySecret: function() {
						return this.secret;
					},
					testCredentials: function() {
						this.testCredsCalled = true;
					},
					setCredentials: function(id, keySecret) {
						this.keyId = id;
						this.secret = keySecret;
					},
					setRegion: function(reg) {
						this.region = reg;
					}
				};
			});
			
			describe('initialization procedures', function() {
				it('should start with empty scope vars, and not call testCredentials', function() {
					var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
					
					expect($rootScope.awsRegion).toBe('');
					expect($rootScope.awsKeyId).toBe('');
					expect($rootScope.awsSecret).toBe('');
					
					expect(awsServiceMock.testCredsCalled).toBe(false);
				});
				
				it('should initialize scope based on awsService, and call testCredentials', function() {
					awsServiceMock.region = 'region';
					awsServiceMock.keyId = 'ID';
					awsServiceMock.secret = 'secret';
					
					var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
					
					expect($rootScope.awsRegion).toBe('region');
					expect($rootScope.awsKeyId).toBe('ID');
					expect($rootScope.awsSecret).toBe('secret');
					
					expect(awsServiceMock.testCredsCalled).toBe(true);
				});
			});
			
			describe('$scope.setCredentials()', function() {
				it('should call into awsService with scope vars', function() {			
					var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
					
					$rootScope.awsRegion = 'reg';
					$rootScope.awsKeyId = 'id';
					$rootScope.awsSecret = 'shh';
					
					$rootScope.setCredentials();
					
					expect(awsServiceMock.region).toBe('reg');
					expect(awsServiceMock.keyId).toBe('id');
					expect(awsServiceMock.secret).toBe('shh');
					
					expect(awsServiceMock.testCredsCalled).toBe(true);
				});
			});
		});
		
		describe('JobSetupCtrl', function() {
			var awsServiceMock;
			
			beforeEach(function() {
				awsServiceMock = {
					getQueuesCalled: false,
					
					getQueues: function() {
						this.getQueuesCalled = true;
					}
				};
			});
			
			it('should initialize array to empty and call getQueues', function() {
				var ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				expect($rootScope.queues.length).toBe(0);
				expect(awsServiceMock.getQueuesCalled).toBe(true);
			});
			
			it('should update array when success event received', function() {
				var ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				$rootScope.$emit('aws-sqs-success', {QueueUrls: ['http://queue/url/name1', 'http://queue/url/name2']});
				
				expect($rootScope.queues.length).toBe(2);
				expect($rootScope.queues[0].id).toBe('http://queue/url/name1');
				expect($rootScope.queues[0].name).toBe('name1');
				expect($rootScope.queues[1].id).toBe('http://queue/url/name2');
				expect($rootScope.queues[1].name).toBe('name2');
			});
			
			it('should initialize template, start and end frame', function() {
				var ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
				
				expect($rootScope.workTemplate).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a');
				expect($rootScope.startFrame).toBe(1);
				expect($rootScope.endFrame).toBe(240);
			});
			
			describe('$scope.workList', function() {
				it('should generate the work list', function() {
					var ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
					
					var workList = $rootScope.workList();
					
					expect(workList.length).toBe(240);
					expect(workList[0]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 1 -e 1 -j 1 -t 0 -a');
					expect(workList[1]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 2 -e 2 -j 1 -t 0 -a');
				});
			});
		});
	});
	
	
	describe('awsLoginStatus', function() {
		var $compile, $rootScope, element;
		
		beforeEach(inject(function(_$compile_, _$rootScope_){
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			element = $compile('<div aws-login-status></div>')($rootScope);
		}));
		
		it('initializes to the unknown state and message', function() {
			expect(element.html()).toBe("<b>Unchecked:</b> Credentials haven't been tested yet");
		});
		
		it('sets success message on receiving success event', function() {
			$rootScope.$emit('aws-login-success');
			expect(element.html()).toBe("<b>Success:</b> Credentials look good!");
		});
		
		it('sets error message on receiving error event', function() {
			$rootScope.$emit('aws-login-error', 'Invalid password');
			expect(element.html()).toBe("<b>Error:</b> Invalid password");
		});
	});
	
	
});