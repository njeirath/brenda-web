'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('Controllers', function() {
		var $rootScope, $controller, $httpBackend;
			
		beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_) {
			$rootScope = _$rootScope_;
			$controller = _$controller_;
			$httpBackend = _$httpBackend_;
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
			var awsServiceMock, ctrl;
			
			beforeEach(function() {
				awsServiceMock = {
					getQueuesCalled: false,
					
					getQueues: function() {
						this.getQueuesCalled = true;
					}
				};
				
				ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
			});
			
			it('should initialize array to empty and call getQueues', function() {				
				expect($rootScope.queues.length).toBe(0);
				expect(awsServiceMock.getQueuesCalled).toBe(true);
			});
			
			it('should update array when success event received', function() {
				$rootScope.$emit('aws-sqs-success', {QueueUrls: ['http://queue/url/name1', 'http://queue/url/name2']});
				
				expect($rootScope.queues.length).toBe(2);
				expect($rootScope.queues[0].id).toBe('http://queue/url/name1');
				expect($rootScope.queues[0].name).toBe('name1');
				expect($rootScope.queues[1].id).toBe('http://queue/url/name2');
				expect($rootScope.queues[1].name).toBe('name2');
			});
			
			it('should initialize template, start and end frame', function() {
				expect($rootScope.workTemplate).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a');
				expect($rootScope.startFrame).toBe(1);
				expect($rootScope.endFrame).toBe(240);
			});
			
			describe('$scope.workList', function() {
				it('should generate the work list', function() {
					var workList = $rootScope.workList();
					
					expect(workList.length).toBe(240);
					expect(workList[0]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 1 -e 1 -j 1 -t 0 -a');
					expect(workList[1]).toBe('blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s 2 -e 2 -j 1 -t 0 -a');
				});
			});
			
			describe('$scope.updateQueueSize', function() {
				it('should display default message if no queue selected', function() {
					$rootScope.workQueue = '';
					$rootScope.updateQueueSize();
					expect($rootScope.queueSize).toBe('No Queue Selected');
					
					$rootScope.workQueue = undefined;
					$rootScope.updateQueueSize();
					expect($rootScope.queueSize).toBe('No Queue Selected');
				});
				
				it('should call awsService if queue is selected', function() {
					awsServiceMock.getQueueSize = function(queue, callback) {
						expect(queue).toBe('testUrl');
						callback(5);
					};
					
					$rootScope.workQueue = 'testUrl';
					$rootScope.updateQueueSize();
					expect($rootScope.queueSize).toBe(5);
				});
			});
			
			describe('$scope.sendWork', function() {
				it('should call awsService with queue name and work list', function() {
					awsServiceMock.sendToQueue = function(queueUrl, workList) {
						expect(queueUrl).toBe('testUrl');
						expect(workList.length).toBe(2);
						expect(workList[0]).toBe('job1');
						expect(workList[1]).toBe('job2');
					};
					
					$rootScope.workList = function() {return ['job1', 'job2'];};
					$rootScope.workQueue = 'testUrl';
					$rootScope.sendWork();
				});
			});
			
			describe('$scope.clearQueue', function() {
				it('should call awsService to clear queue', function() {
					awsServiceMock.clearQueue = function(queueUrl) {
						expect(queueUrl).toBe('testUrl');
					};
					
					$rootScope.workQueue = 'testUrl';
					$rootScope.clearQueue();
				});
			});
			
			it('should update sendStatus on receipt of aws-sqs-send-update', function() {
				$rootScope.$emit('aws-sqs-send-update', {
					status: 'test status'
				});
				
				expect($rootScope.sendStatus.status).toBe('test status');
			});
		});
		
		describe('WorkerSetupCtrl', function() {
			var ctrl, localStorageService, amiListHandler, instanceHandler, awsServiceMock;
			
			beforeEach(function() {
				localStorageService = getLocalStorageMock();
				localStorageService.data['projectSource'] = 'source location';
				localStorageService.data['frameDestination'] = 'frame dest';
				
				amiListHandler = $httpBackend.when('GET', 'amiList.json').respond({
					"ami-0529086c": {
						"blenderVersion": "??"
					}	
				});
				
				awsServiceMock = getAwsServiceMock();
				
				instanceHandler = $httpBackend.when('GET', 'instances.json').respond(['c1.xlarge', 'm3.2xlarge']);
				
				ctrl = $controller('WorkerSetupCtrl', {$scope: $rootScope, localStorageService: localStorageService, awsService: awsServiceMock});
			});
			
			it('should get initial values for projectSource and frameDestination from local storage', function() {
				expect(localStorageService.get).toHaveBeenCalledWith('projectSource');
				expect(localStorageService.get).toHaveBeenCalledWith('frameDestination');
				
				expect($rootScope.projectSource).toBe('source location');
				expect($rootScope.frameDestination).toBe('frame dest');
				
				expect($rootScope.instanceType).toBe('spot');
			});
			
			it('should update local storage on projectSource and frameDestination changes', function() {
				$rootScope.projectSource = 'new source';
				$rootScope.frameDestination = 'new dest';
				$rootScope.$digest();
				
				expect(localStorageService.set).toHaveBeenCalledWith('projectSource', 'new source');
				expect(localStorageService.set).toHaveBeenCalledWith('frameDestination', 'new dest');
			});
			
			it('should populate list based on http response and default select first item', function() {
				$httpBackend.flush();
				expect($rootScope.amis.length).toBe(1);
				expect($rootScope.amis[0]).toEqual({id: 0, name: 'ami-0529086c'});
				expect($rootScope.amiSelect).toBe('0');
			});
			
			it('should populate instance list based on http response', function() {
				$httpBackend.flush();
				expect($rootScope.instances.length).toBe(2);
				expect($rootScope.instances[0]).toBe('c1.xlarge');
			});
			
			it('should populate $scope.keys on callback from awsService.getKeyPairs', function() {
				expect(awsServiceMock.getKeyPairs).toHaveBeenCalled();
				var callback = awsServiceMock.getKeyPairs.calls.argsFor(0)[0];
				callback({KeyPairs: [{KeyName: 'key1'}, {KeyName: 'key2'}]});
				expect($rootScope.keys.length).toBe(2);
				expect($rootScope.keys[0]).toBe('key1');
				expect($rootScope.keys[1]).toBe('key2');
			});
			
			describe('generateScript', function() {
				it('should generate the startup script correctly', function() {
					
					var expected = 
						'#!/bin/bash\n' +
						'# run Brenda on the EC2 instance store volume\n' +
						'sudo apt-get update\n' +
						'sudo apt-get -y install nginx\n' +
						'sudo service nginx start\n' +
						'sudo echo "* * * * * root tail -n1000 /mnt/brenda/log > /usr/share/nginx/www/log_tail.txt" >> /etc/crontab\n' +
						'sudo echo "* * * * * root uptime > /usr/share/nginx/www/uptime.txt" >> /etc/crontab\n' +
						'B="/mnt/brenda"\n' +
						'if ! [ -d "$B" ]; then\n' +
						'  for f in brenda.pid log task_count task_last DONE ; do\n' +
						'    ln -s "$B/$f" "/root/$f"\n' +
						'    sudo ln -s "$B/$f" "/usr/share/nginx/www/$f"\n' +
						'  done\n' +
						'fi\n' +
						'export BRENDA_WORK_DIR="."\n' +
						'mkdir -p "$B"\n' +
						'cd "$B"\n' +
						'/usr/local/bin/brenda-node --daemon <<EOF\n' +
						'AWS_ACCESS_KEY=accessKey\n' +
						'AWS_SECRET_KEY=secretKey\n' +
						'BLENDER_PROJECT=source location\n' +
						'WORK_QUEUE=sqs://queueName\n' +
						'RENDER_OUTPUT=frame dest\n' +
						'DONE=shutdown\n' +
						'EOF\n';
					var script = $rootScope.generateScript();
					
					expect(script).toEqual(expected);
				});
			});
			
			describe('$scope.requestInstances', function() {
				beforeEach(function() {
					$rootScope.instanceType = 'spot';
					$rootScope.amiSelect = 'ami_123';
					$rootScope.sshKey = 'key';
					$rootScope.generateScript = function() {
						return 'script';
					};
					$rootScope.instanceSize = 'c3.large';
					$rootScope.spotPrice = '0.02';
					$rootScope.numInstances = 1;
				});
				
				it('should call requestSpot method when spot instances being requested', function() {
					$rootScope.requestInstances();
					expect(awsServiceMock.requestSpot).toHaveBeenCalledWith('ami_123', 'key', 'brenda', 'script', 'c3.large', '0.02', 1, 'one-time', jasmine.any(Function));
				});
				
				it('should call reqstOndemand method when on demand instances being requested', function() {
					$rootScope.instanceType = 'onDemand';
					$rootScope.requestInstances();
					expect(awsServiceMock.requestOndemand).toHaveBeenCalledWith('ami_123', 'key', 'brenda', 'script', 'c3.large', 1, jasmine.any(Function));
				});
			});
			
			describe('$scope.showStatus', function() {
				it('should replace any existing statuses', function() {
					$rootScope.statuses.push({type: 'test', text: 'message'});
					
					$rootScope.showStatus('warning', 'warn message');
					expect($rootScope.statuses.length).toBe(1);
					expect($rootScope.statuses[0]).toEqual({type: 'warning', text: 'warn message'});
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