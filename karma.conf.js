module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/components/**/*.js',
      'app/awsSetup/*.js',
      'app/app.js',
      'tests/unit/**/*.js'
    ],
    
    preprocessors: {
    	'app/awsSetup/*.js': ['coverage'],
    	'app/app.js': ['coverage']
    },

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-coverage'
            ],

    junitReporter : {
      outputFile: 'test_out/junit/unit.xml',
      suite: 'unit'
    },
    coverageReporter: {
    	type: 'html',
    	dir: 'test_out/coverage'
	},
	
	reporters: ['progress', 'coverage', 'junit']

  });
};
