module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-messages/angular-messages.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/angular-bootstrap-lightbox/dist/angular-bootstrap-lightbox.min.js',
      'app/brenda-help/*.js',
      'app/components/**/*.js',
      'app/awsSetup/awsSetup.module.js',
      'app/awsSetup/awsSetup.js',
      'app/dashboard/dashboard.js',
      'app/dashboard/*.js',
      'app/app.js',
      'tests/unit/**/*.js'
    ],
    
    preprocessors: {
    	'app/awsSetup/*.js': ['coverage'],
    	'app/dashboard/*.js': ['coverage'],
    	'app/brenda-help/*.js': ['coverage'],
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
