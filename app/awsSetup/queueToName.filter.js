'use strict';

angular.module('awsSetup')
.filter('queueToName', function() {
    return function(url) {
        return url.split("/").pop();
    };
});
