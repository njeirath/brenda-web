'use strict'

describe('timeFilter', function() {
	beforeEach(module('dashboard'));
	
	it('should format seconds appropriately', inject(function(secondsToDateTimeFilter) {
		expect(secondsToDateTimeFilter('error')).toBe('-');
		expect(secondsToDateTimeFilter(5)).toBe('00:00:05');
		expect(secondsToDateTimeFilter(75)).toBe('00:01:15');
		expect(secondsToDateTimeFilter(120)).toBe('00:02:00');
		expect(secondsToDateTimeFilter(3600)).toBe('01:00:00');
		expect(secondsToDateTimeFilter(86400)).toBe('1d 00:00:00');
		expect(secondsToDateTimeFilter(86407)).toBe('1d 00:00:07');
	}));
	
});
