'use strict';

angular.module('awsSetup')
.run(['localStorageService', 'awsService', function(localStorageService, awsService) {
	var storedKeyId = localStorageService.get('keyId');
	var storedKeySecret = localStorageService.get('keySecret');
	var storedRegion = localStorageService.get('region');
	
	if ((storedKeyId) && (storedKeyId != '') && (storedKeySecret) && (storedKeySecret != '')) {
		awsService.setCredentials(storedKeyId, storedKeySecret);
	}
	
	if ((storedRegion) && (storedRegion != '')) {
		awsService.setRegion(storedRegion);
	}
}]);