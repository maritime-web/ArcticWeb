module.exports = function(config) {
	config.set({
		// base path, that will be used to resolve files and exclude
		basePath : '../../../',

		frameworks : [ 'jasmine', 'jasmine-matchers' ],

		// list of files / patterns to load in the browser
		files : [
		        'src/test/jsUnit/polyfills.js',
		        'src/main/webapp/js/ext/cdn.cloudflare/jquery/1.11.0/jquery.js',
		        'src/main/webapp/js/ext/cdn.cloudflare/openlayers/2.13.1/OpenLayers.js',
		        'src/main/webapp/js/ext/cdn.cloudflare/jqueryui/1.9.1/jquery-ui.min.js',
		        'src/main/webapp/js/ext/cdn.googleapis/angularjs/1.2.14/angular.js',
                'src/main/webapp/js/ext/cdn.googleapis/angularjs/1.2.14/angular-cookies.js',
                'src/main/webapp/js/cached/common/cdn.cloudflare/angular-ui-bootstrap/0.11.0/ui-bootstrap-tpls.min.js',
                'src/main/webapp/js/ext/moment.min.js',
				'src/main/webapp/js/ext/*.js',
				'src/main/webapp/js/ext/jquery-file-upload-9.5.7/js/jquery.iframe-transport.js',
                'src/main/webapp/js/ext/jquery-file-upload-9.5.7/js/jquery.fileupload.js',
                'src/main/webapp/js/ext/jquery-file-upload-9.5.7/js/jquery.fileupload-process.js',
                'src/main/webapp/js/ext/jquery-file-upload-9.5.7/js/jquery.fileupload-validate.js',
                'src/main/webapp/js/ext/jquery-file-upload-9.5.7/js/jquery.fileupload-angular.js',
				'src/main/webapp/js/ext/turf.min.js',
				'src/main/webapp/js/cached/map/cdn.cloudflare/pouchdb/5.1.0/pouchdb.min.js',
            	'src/test/lib/angularjs/1.2.14/angular-mocks.js',
                'src/main/webapp/js/utils.js',
				'src/main/webapp/js/embryo-for-test.js',
				'src/main/webapp/menu/menu.js',
                'src/main/webapp/authentication/authentication.js',
                'src/main/webapp/js/control/control.js',
                'src/main/webapp/components/geo/geo-service.js',
				'src/main/webapp/components/sar-deprecated/sar-model.js',
                'src/main/webapp/components/sar-deprecated/sar-service.js',
                'src/main/webapp/js/layer/embryo-layer.js',
                'src/main/webapp/js/layer/metoc-layer.js',
                'src/main/webapp/js/service/greenpos-service.js',
            	'src/main/webapp/js/reporting/validation.js',
                'src/main/webapp/js/reporting/datetimepicker.js',
                'src/main/webapp/js/reporting/reporting-panel.js',
                'src/main/webapp/js/reporting/course.js',
				'src/main/webapp/js/reporting/position.js',
                'src/main/webapp/js/reporting/decimal.js',
				'src/main/webapp/js/reporting/route-upload.js',
				'src/main/webapp/js/layer/embryo-layer.js',
				'src/main/webapp/js/layer/metoc-layer.js',
                'src/main/webapp/js/service/*.js',
                'src/main/webapp/js/control/additional-information.js',
				'src/main/webapp/components/**/route-model-deprecated.js',
				'src/main/webapp/components/**/*-constant.js',
				'src/main/webapp/components/**/*.module.js',
			    'src/main/webapp/components/**/*-model.js',
			    'src/main/webapp/components/**/*-directive.js',
				'src/main/webapp/components/**/*-service.js',
				'src/main/webapp/components/**/*-test.js',
			    'src/test/jsUnit/*Test.js',
			    'src/test/jsUnit/*-test.js'],


		// list of files to exclude
		exclude : [
			'src/main/webapp/js/ext/jquery.fileupload*.js',
            'src/main/webapp/components/openlayer/*',
            'src/main/webapp/components/sar/*',
            'src/main/webapp/components/schedule/*',
            'src/main/webapp/components/vessel/*',
            'src/main/webapp/components/route/route.service*',
            'src/main/webapp/components/route/route.module*',
            'src/main/webapp/components/route/route-model.js'
        ],

		// use dots reporter, as travis terminal does not support escaping
		// sequences
		// possible values: 'dots', 'progress'
		// CLI --reporters progress
		reporters : [ 'progress', 'junit' ],

		junitReporter : {
			// will be resolved to basePath (in the same way as files/exclude
			// patterns)
			outputFile : 'target/surefire-reports/karmaUnit.xml'
		},

		// web server port
		// CLI --port 9876
		port : 6556,

		// enable / disable colors in the output (reporters and logs)
		// CLI --colors --no-colors
		colors : true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR ||
		// config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		// CLI --log-level debug
		logLevel : config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file
		// changes
		// CLI --auto-watch --no-auto-watch
		autoWatch : true,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		// CLI --browsers Chrome,Firefox,Safari
		browsers : [ process.env.TRAVIS ? 'Firefox' : 'Chrome', 'PhantomJS' ],

		// If browser does not capture in given timeout [ms], kill it
		// CLI --capture-timeout 5000
		captureTimeout : 20000,

		// Auto run tests on start (when browsers are captured) and exit
		// CLI --single-run --no-single-run
		singleRun : false,

		// report which specs are slower than 500ms
		// CLI --report-slower-than 500
		reportSlowerThan : 500,

		plugins : [ 'karma-jasmine', 'karma-jasmine-matchers', 'karma-chrome-launcher',
				'karma-firefox-launcher', 'karma-junit-reporter', 'karma-phantomjs-launcher', 'karma-spec-reporter' ]
	});
};