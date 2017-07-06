//Brenda-Web -- Frontend for Blender
//Copyright (C) 2016 Nakul Jeirath
//
//Brenda-Web is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.
//
//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//You should have received a copy of the GNU General Public License
//along with this program.  If not, see <http://www.gnu.org/licenses/>. 
'use strict';

angular.module('awsSetup')
.controller('JobSetupCtrl', ['$scope', 'awsService', '$uibModal', '$interval', 'localStorageService', function($scope, awsService, $uibModal, $interval, localStorageService) {
    $scope.setInitialState = function () {
        $scope.queues = [];

        $scope.queueSize = 'No Queue Selected';
        $scope.taskSeperator = '\n';

        $scope.isSubframeRender = false;
        $scope.subframeScript = '-P subframe.py';
        $scope.subframeModel = {};
        $scope.subframeModel.subframesX = 2;
        $scope.subframeModel.subframesY = 2;

        $scope.isMultiframeRender = false;
        $scope.multiframeModel = {};
        $scope.multiframeModel.multiframes = 2;

        $scope.subframeScriptTemplate = [
            'cat >subframe.py <<EOF\n',
            'import bpy\n',
            'bpy.context.scene.render.border_min_x = $SF_MIN_X\n',
            'bpy.context.scene.render.border_max_x = $SF_MAX_X\n',
            'bpy.context.scene.render.border_min_y = $SF_MIN_Y\n',
            'bpy.context.scene.render.border_max_y = $SF_MAX_Y\n',
            'bpy.context.scene.render.use_border = True\n',
            'EOF\n'
        ].join('');

        $scope.workTemplateFullframe = 'blender -b *.blend -F PNG -o $OUTDIR/frame_###### -s $START -e $END -j $STEP -t 0 -a';
        $scope.workTemplateSubframe = 'blender -b *.blend $SCRIPT -F PNG -o $OUTDIR/frame_######_x$SF_MIN_Xto$SF_MAX_Xy$SF_MIN_Yto$SF_MAX_Y -s $START -e $END -j $STEP -t 0 -a';
        $scope.workTemplate = $scope.workTemplateFullframe;
        $scope.startFrame = 1;
        $scope.endFrame = 240;

        $scope.shuffle = Boolean(localStorageService.get('shuffleQ'));
    };
    $scope.setInitialState();

	$scope.$watch('shuffle', function(value) {
		localStorageService.set('shuffleQ', value);
	});
	
	awsService.getQueues();
	
	$scope.$watch('queue.workQueue', function(value) {
		if (value !== '') {
			localStorageService.set('workQueue', value);
		}
	});
	
	$scope.$on('brenda-web-credentials-updated', function(event, data) {
		$scope.refreshQueues();
	});
	
	$scope.refreshQueues = function() {
		awsService.getQueues();
	};
	
	$scope.queueAlerts = [];
	
	$scope.closeAlert = function(index) {
	    $scope.queueAlerts.splice(index, 1);
	};
	
	$scope.addQueue = function() {
		var queueModal = $uibModal.open({
			animation: true,
			templateUrl: 'awsSetup/createQueue.html',
			controller: 'CreateQueueCtrl'
		});
		
		queueModal.result.then(function(queueName) {
			awsService.createQueue(queueName)
			.then(function() {
				$scope.queueAlerts.push({type: 'success', msg: 'Queue ' + queueName + ' successfully created! (Note: may take up to 60 seconds for queue to be available)'});
				
				$interval(awsService.getQueues, 30000, 2);
			}, function(err) {
				$scope.queueAlerts.push({type: 'danger', msg: 'Create ' + queueName + ': ' + String(err)});
			});
		});
	};

	$scope.subframeRenderChanged = function() {
        $scope.isMultiframeRender = false;
        if ($scope.isSubframeRender) {
            $scope.workTemplate = $scope.workTemplateSubframe;
            $scope.taskSeperator = '\n--- Task seperator (not part of the command) ---\n';
		} else {
            $scope.workTemplate = $scope.workTemplateFullframe;
            $scope.taskSeperator = '\n';
		}
	};

    $scope.multiframeRenderChanged = function() {
		$scope.isSubframeRender = false;
        $scope.workTemplate = $scope.workTemplateFullframe;
    };

    function addSubframeTasksToList(parsedSubframeX, parsedSubframeY, blenderCmd, list) {
        var xFraction = 1.0 / parsedSubframeX;
        var yFraction = 1.0 / parsedSubframeY;
        for (var x = 0; x < parsedSubframeX; x++) {
            var minX = x * xFraction;
            var maxX = (x + 1) * xFraction;
            for (var y = 0; y < parsedSubframeY; y++) {
                var minY = y * yFraction;
                var maxY = (y + 1) * yFraction;
                var subframeCmd = $scope.subframeScriptTemplate + blenderCmd;
                subframeCmd = subframeCmd.replace(/\$SF_MIN_X/g, minX).replace(/\$SF_MAX_X/g, maxX).replace(/\$SF_MIN_Y/g, minY).replace(/\$SF_MAX_Y/g, maxY);
                list.push(subframeCmd);
            }
        }
    }

    $scope.workList = function() {
        var list = [];
        var multiframeSteps = 1;
		if ( $scope.isMultiframeRender ) {
            multiframeSteps = $scope.multiframeModel.multiframes;
        }
		for (var i = parseInt($scope.startFrame, 10); i <= parseInt($scope.endFrame, 10); i=i+multiframeSteps) {
            var parsedSubframeX = parseInt($scope.subframeModel.subframesX, 10);
            var parsedSubframeY = parseInt($scope.subframeModel.subframesY, 10);
            if ($scope.isSubframeRender && (parsedSubframeX > 1 || parsedSubframeY > 1)) {
                var blenderCmd = $scope.workTemplate.replace("$SCRIPT", $scope.subframeScript).replace("$START", i).replace("$END", i).replace("$STEP", 1);
                addSubframeTasksToList(parsedSubframeX, parsedSubframeY, blenderCmd, list);
            } else {
            	var endFrame = i+multiframeSteps-1;
            	if (endFrame > $scope.endFrame){
            		endFrame = $scope.endFrame;
				}
                var cmd = $scope.workTemplate.replace("$START", i).replace("$END", endFrame).replace("$STEP", 1);
                list.push(cmd);
            }
        }
		
		return list;
	};
	
	$scope.sendWork = function() {
		var list = $scope.workList();
		
		if ($scope.shuffle) {
			for (var i = list.length - 1; i >= 0; i--) {
				var randomIndex = Math.floor(Math.random()*(i+1));
				
				var iItem = list[randomIndex];
				list[randomIndex] = list[i];
				list[i] = iItem;
			}
		}
		
		awsService.sendToQueue($scope.queue.workQueue, list);
	};
	
	$scope.clearQueue = function() {
		awsService.clearQueue($scope.queue.workQueue);
	};
	
	$scope.sendStatus = {
				total: 0,
				success: 0,
				failed: 0,
				inFlight: 0
	};
	
	$scope.$on('aws-sqs-send-update', function(event, data) {
		$scope.sendStatus = data;
	});
	
	$scope.$on('aws-sqs-success', function(event, args) {
		$scope.queues = [];
		
		args.QueueUrls.forEach(function(entry) {
			$scope.queues.push(entry);
		});
		
		$scope.queue.workQueue = localStorageService.get('workQueue');
		$scope.$digest();
	});
}]);
