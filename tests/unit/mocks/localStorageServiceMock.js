function getLocalStorageMock() {
	var localStorageServiceMock = {
		data: {},
		get: function(name) {
			return this.data[name];
		},
		set: function(name, value) {
			this.data[name] = value;
		},
		clearAll: function() {
			this.data = {};
		}
	};
	
	spyOn(localStorageServiceMock, 'get').and.callThrough();
	spyOn(localStorageServiceMock, 'set').and.callThrough();
	spyOn(localStorageServiceMock, 'clearAll').and.callThrough();
	
	return localStorageServiceMock;
}