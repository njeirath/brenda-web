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