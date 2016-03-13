'use strict';

angular.module('dashboard')
.filter('secondsToDateTime', ['dateFilter', function(dateFilter) {
    return function(seconds) {    	
    	if (isNaN(seconds)) {
    		return '-';
    	}
    	
    	if (!Number.isFinite(seconds)) {
    		return '-';
    	}
    	
    	var d = new Date(0,0,0,0,0,0,0);
        d.setSeconds(seconds);
        
        var days = Math.floor(seconds / (24*60*60));
        
        if (days == 0) {
        	return dateFilter(d, 'HH:mm:ss');
        } else {
        	return days + 'd ' + dateFilter(d, 'HH:mm:ss');
        }
            	
    };
}]);