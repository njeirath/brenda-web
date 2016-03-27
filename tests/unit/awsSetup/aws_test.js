'use strict';

describe('awsSetup', function() {
	beforeEach(module('awsSetup'));
	
	describe('Controllers', function() {
		var $rootScope, $controller, $httpBackend, $q;
			
		beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _$q_) {
			$rootScope = _$rootScope_;
			$controller = _$controller_;
			$httpBackend = _$httpBackend_;
			$q = _$q_;
		}));
		
		
		describe('AwsSetupCtrl', function() {
			var awsServiceMock, ctrl, testCredentialsDeferred, getSgDeferred;
			
			beforeEach(function() {
				awsServiceMock = getAwsServiceMock();
				testCredentialsDeferred = $q.defer();
				awsServiceMock.testCredentials.and.returnValue(testCredentialsDeferred.promise);
				
				getSgDeferred = $q.defer();
				awsServiceMock.getSecurityGroups.and.returnValue(getSgDeferred.promise);
				
				//Mock out inherited objects
				$rootScope.credentials = {
					awsRegion: '',
					awsKeyId: '',
					awsSecret: ''
				};
				
				var ctrl = $controller('AwsSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock});
			});
			
			describe('initialization procedures', function() {
				it('should start with empty scope vars, and not call testCredentials', function() {
					expect($rootScope.credentials.awsRegion).toBe('');
					expect($rootScope.credentials.awsKeyId).toBe('');
					expect($rootScope.credentials.awsSecret).toBe('');
					
					expect(awsServiceMock.testCredentials).not.toHaveBeenCalled();
				});
			});
			
			describe('$scope.setCredentials()', function() {
				it('should call into awsService with scope vars', function() {					
					$rootScope.credentials = {
						awsRegion: 'reg',
						awsKeyId: 'id',
						awsSecret: 'shh'
					};
					
					$rootScope.setCredentials();
					
					expect(awsServiceMock.setCredentials).toHaveBeenCalledWith('id', 'shh');
					expect(awsServiceMock.setRegion).toHaveBeenCalledWith('reg');
					expect(awsServiceMock.testCredentials).toHaveBeenCalled();
				});
			});
			
			describe('$scope.awsChecks', function() {
				beforeEach(function() {
					$rootScope.awsChecks();
				});
				
				it('should make a call to testCredentials', function() {
					expect(awsServiceMock.testCredentials).toHaveBeenCalled();
				});
				
				it('should update model when testCredentials resolves', function() {
					testCredentialsDeferred.resolve();
					$rootScope.$apply();
					
					expect($rootScope.credentialCheck).toEqual({status: 'success', msg: 'AWS credentials look good!'});
					expect(awsServiceMock.getSecurityGroups).toHaveBeenCalledWith('brenda-web');
				});
				
				it('should update model when testCredentials are rejected', function() {
					testCredentialsDeferred.reject('error message');
					expect($rootScope.$apply).toThrow();
					
					expect($rootScope.credentialCheck).toEqual({status: 'danger', msg: "AWS credentials couldn't be validated: error message"});
					expect(awsServiceMock.getSecurityGroups).not.toHaveBeenCalled();
				});
				
				it('should update model when SG check resolves', function() {
					testCredentialsDeferred.resolve();
					getSgDeferred.resolve();
					$rootScope.$apply();
					
					expect($rootScope.securityGroupCheck).toEqual({status: 'success', msg: 'Security group found!'});
				});
				
				it('should update model with SG check is rejected', function() {
					testCredentialsDeferred.resolve();
					getSgDeferred.reject('SG error');
					$rootScope.$apply();
					
					expect($rootScope.securityGroupCheck).toEqual({status: 'danger', msg: 'Security group check failed: SG error'});
				});
			});
			
			describe('$scope.createSG', function() {
				var createSgDeferred; 
				
				beforeEach(function() {
					createSgDeferred = $q.defer();
					awsServiceMock.createSecurityGroup.and.returnValue(createSgDeferred.promise);
					spyOn($rootScope, 'awsChecks');
					
					$rootScope.createSG();
				});
				
				it('should trigger AWS checks when resolved', function() {
					createSgDeferred.resolve();
					$rootScope.$apply();
					
					expect($rootScope.awsChecks).toHaveBeenCalled();
				});
				
				it('should update model when rejected', function() {
					createSgDeferred.reject('err msg');
					$rootScope.$apply();
					
					expect($rootScope.securityGroupCheck).toEqual({status: 'danger', msg: 'Security group creation failed: err msg'});
				});
			});
		});
		
		describe('JobSetupCtrl', function() {
			var awsServiceMock, ctrl, uibModalMock, modalDeferred, localStoreMock;
			
			beforeEach(function() {
				awsServiceMock = getAwsServiceMock();
				localStoreMock = getLocalStorageMock();
				
				//Setup inherited scope var
				$rootScope.queue = {
					workQueue: ''
				};
				
				modalDeferred = $q.defer();
				uibModalMock = {
					open: function() {}
				};
				
				spyOn(uibModalMock, 'open').and.returnValue({result: modalDeferred.promise});
				
				ctrl = $controller('JobSetupCtrl', {$scope: $rootScope, awsService: awsServiceMock, $uibModal: uibModalMock, localStorageService: localStoreMock});
			});
			
			it('should initialize array to empty and call getQueues', function() {				
				expect($rootScope.queues.length).toBe(0);
				expect(awsServiceMock.getQueues).toHaveBeenCalled();
			});
			
			it('should update array when success event received', function() {
				$rootScope.$emit('aws-sqs-success', {QueueUrls: ['http://queue/url/name1', 'http://queue/url/name2']});
				
				expect($rootScope.queues.length).toBe(2);
				expect($rootScope.queues[0]).toBe('http://queue/url/name1');
				expect($rootScope.queues[1]).toBe('http://queue/url/name2');
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
						
			describe('$scope.sendWork', function() {
				it('should call awsService with queue name and work list', function() {
					awsServiceMock.sendToQueue = function(queueUrl, workList) {
						expect(queueUrl).toBe('testUrl');
						expect(workList.length).toBe(2);
						expect(workList[0]).toBe('job1');
						expect(workList[1]).toBe('job2');
					};
					
					$rootScope.workList = function() {return ['job1', 'job2'];};
					$rootScope.queue.workQueue = 'testUrl';
					$rootScope.sendWork();
				});
			});
			
			describe('$scope.clearQueue', function() {
				it('should call awsService to clear queue', function() {
					awsServiceMock.clearQueue = function(queueUrl) {
						expect(queueUrl).toBe('testUrl');
					};
					
					$rootScope.queue.workQueue = 'testUrl';
					$rootScope.clearQueue();
				});
			});
			
			it('should update sendStatus on receipt of aws-sqs-send-update', function() {
				$rootScope.$emit('aws-sqs-send-update', {
					status: 'test status'
				});
				
				expect($rootScope.sendStatus.status).toBe('test status');
			});
			
			it('should get queues when refreshQueues called', function() {
				$rootScope.refreshQueues();
				expect(awsServiceMock.getQueues).toHaveBeenCalled();
			});
			
			describe('$scope.closeAlert', function() {
				it('should remove correct alert when dismissed', function() {
					$rootScope.queueAlerts = [1, 2, 3];
					$rootScope.closeAlert(1);
					expect($rootScope.queueAlerts).toEqual([1,3]);
				});
			});
			
			describe('$scope.addQueue', function() {
				it('should open dialog', function() {
					$rootScope.addQueue();
					expect(uibModalMock.open).toHaveBeenCalledWith({
						animation: true,
						templateUrl: 'awsSetup/createQueue.html',
						controller: 'CreateQueueCtrl'
					});
				});
			});
		});
		
		describe('SetupCtrl', function() {
			var ctrl, localStorageService, awsServiceMock;
			
			beforeEach(function() {
				localStorageService = getLocalStorageMock();
				awsServiceMock = getAwsServiceMock();
				localStorageService.data['projectSource'] = 'source location';
				localStorageService.data['frameDestination'] = 'frame dest';
				
				ctrl = $controller('SetupCtrl', {$scope: $rootScope, localStorageService: localStorageService, awsService: awsServiceMock});
			});
			
			it('should get initial values for projectSource and frameDestination from local storage', function() {
				expect(localStorageService.get).toHaveBeenCalledWith('projectSource');
				expect(localStorageService.get).toHaveBeenCalledWith('frameDestination');
				
				expect($rootScope.s3.projectSource).toBe('source location');
				expect($rootScope.s3.frameDestination).toBe('frame dest');
			});
			
			it('should update local storage on projectSource and frameDestination changes', function() {
				$rootScope.s3.projectSource = 'new source';
				$rootScope.s3.frameDestination = 'new dest';
				$rootScope.$digest();
				
				expect(localStorageService.set).toHaveBeenCalledWith('projectSource', 'new source');
				expect(localStorageService.set).toHaveBeenCalledWith('frameDestination', 'new dest');
			});
			
			it('should initialize scope based on awsService, and call testCredentials', function() {				
				expect($rootScope.credentials.awsRegion).toBe('region');
				expect($rootScope.credentials.awsKeyId).toBe('accessKey');
				expect($rootScope.credentials.awsSecret).toBe('secretKey');
			});
			
			describe('$scope.updateQueueSize', function() {
				var $q;
				
				beforeEach(inject(function(_$q_) {
					$q = _$q_;
				}));
				
				it('should display default message if no queue selected', function() {
					$rootScope.workQueue = '';
					$rootScope.updateQueueSize();
					expect($rootScope.queue.queueSize).toBe('-');
					
					$rootScope.workQueue = undefined;
					$rootScope.updateQueueSize();
					expect($rootScope.queue.queueSize).toBe('-');
				});
				
				it('should call awsService if queue is selected', function() {
					var deferred = $q.defer();
					awsServiceMock.getQueueSize = function(queue, callback) {
						expect(queue).toBe('testUrl');
						return deferred.promise;
					};
					
					$rootScope.queue.workQueue = 'testUrl';
					$rootScope.updateQueueSize();
					deferred.resolve(5);
					$rootScope.$apply();
					expect($rootScope.queue.queueSize).toBe(5);
				});
			});

			
		});
		
		describe('WorkerSetupCtrl', function() {
			var ctrl, localStorageService, amiListHandler, instanceHandler, awsServiceMock;
			
			beforeEach(function() {
				amiListHandler = $httpBackend.when('GET', 'amiList.json').respond({
					"ami-0529086c": {
						"blenderVersion": "2.69"
					}	
				});
				
				awsServiceMock = getAwsServiceMock();
				
				awsServiceMock.getAvailabilityZones.and.returnValue(['zone1', 'zone2']);
				
				instanceHandler = $httpBackend.when('GET', 'instances.json').respond(['c1.xlarge', 'm3.2xlarge']);
				
				//Mock up inherited scope objects
				$rootScope.s3 = {
					projectSource: 'source location',
					frameDestination: 'frame dest'
				};
				
				$rootScope.queue = {
					workQueue: 'queueName'
				};
				
				ctrl = $controller('WorkerSetupCtrl', {$scope: $rootScope, localStorageService: localStorageService, awsService: awsServiceMock});
				$rootScope.$broadcast('brenda-web-credentials-updated');
			});
			
			it('should start with spot selected as default', function() {
				expect($rootScope.instanceType).toBe('spot');
			});
			
			it('should populate list based on http response and default select first item', function() {
				$httpBackend.flush();
				expect($rootScope.amis.length).toBe(1);
				expect($rootScope.amis[0]).toEqual({id: 0, name: 'ami-0529086c', version: '2.69'});
				expect($rootScope.amiSelect).toBe('');
			});
			
			it('should populate instance list based on http response', function() {
				$httpBackend.flush();
				expect($rootScope.instances.length).toBe(2);
				expect($rootScope.instances[0]).toEqual({name: 'c1.xlarge', spotPrices: {zone1: undefined, zone2: undefined}});
				expect(awsServiceMock.getSpotPrices).toHaveBeenCalled();
			});
			
			describe('$scope.$on(aws-spotprice-update', function() {
				beforeEach(function() {
					$httpBackend.flush();
				});
				
				it('should update prices on data received', function() {
					var curDate = new Date();
					$rootScope.$broadcast('aws-spotprice-update', {SpotPriceHistory: 
						[
						 	{InstanceType: 'c1.xlarge', AvailabilityZone: 'zone1', Timestamp: curDate, SpotPrice: 0.023},
						 	{InstanceType: 'c1.xlarge', AvailabilityZone: 'zone1', Timestamp: new Date(curDate - 100), SpotPrice: 0.025}	//Older data should be ignored
					 	]});
					
					expect($rootScope.instances[0].spotPrices).toEqual({zone1: {price: 0.023, tstamp: curDate}, zone2: undefined});
				})
				
				it('should call for next data if next token present', function() {
					$rootScope.$broadcast('aws-spotprice-update', {SpotPriceHistory: [], NextToken: '123abc'});
					
					expect(awsServiceMock.getSpotPrices).toHaveBeenCalledWith('123abc');
				})
			});
			
			it('should return the currently selected instance when getSelectedInstance is called', function() {
				$httpBackend.flush();
				$rootScope.instance.size = 'c1.xlarge';
				expect($rootScope.getSelectedInstance()).toEqual({name: 'c1.xlarge', spotPrices: {zone1: undefined, zone2: undefined}});
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
						'B="/mnt/brenda"\n' +
						'sudo apt-get update\n' +
						'sudo apt-get -y install nginx\n' +
						"sudo sed -i '29 i\\ add_header 'Access-Control-Allow-Origin' '*';' /etc/nginx/sites-enabled/default\n" +
						'sudo echo "* * * * * root tail -n1000 /mnt/brenda/log > /usr/share/nginx/www/log_tail.txt" >> /etc/crontab\n' +
						'sudo echo "* * * * * root cat /proc/uptime /proc/loadavg $B/task_count > /usr/share/nginx/www/uptime.txt" >> /etc/crontab\n' +
						'if ! [ -d "$B" ]; then\n' +
						'  for f in brenda.pid log task_count task_last DONE ; do\n' +
						'    ln -s "$B/$f" "/root/$f"\n' +
						'    sudo ln -s "$B/$f" "/usr/share/nginx/www/$f"\n' +
						'  done\n' +
						'fi\n' +
						'sudo service nginx start\n' +
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
					$rootScope.instance = {size: 'c3.large'};
					$rootScope.spotPrice = '0.02';
					$rootScope.numInstances = 1;
				});
				
				it('should call requestSpot method when spot instances being requested', function() {
					$rootScope.requestInstances();
					expect(awsServiceMock.requestSpot).toHaveBeenCalledWith('ami_123', 'key', 'brenda-web', 'script', 'c3.large', '0.02', 1, 'one-time', 'queueName', 'frame dest', jasmine.any(Function));
				});
				
				it('should call reqstOndemand method when on demand instances being requested', function() {
					$rootScope.instanceType = 'onDemand';
					$rootScope.requestInstances();
					expect(awsServiceMock.requestOndemand).toHaveBeenCalledWith('ami_123', 'key', 'brenda-web', 'script', 'c3.large', 1, 'queueName', 'frame dest', jasmine.any(Function));
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
});