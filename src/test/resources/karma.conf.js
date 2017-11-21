module.exports = function(config) {
    var libFiles = [
        'src/**/js/ext/cdn.cloudflare/jquery/1.11.0/jquery.js',
        'src/**/js/ext/cdn.cloudflare/jqueryui/1.9.1/jquery-ui.min.js',
        'src/**/js/cached/openlayer-map/cdn.cloudflare/openlayers/4.4.2/ol-debug.js',
        'src/**/js/cached/openlayer-map/cdn.cloudflare/pouchdb/6.3.4/pouchdb.js',
        'src/**/js/cached/openlayer-map/cdn.googleapis/angularjs/1.6.4/angular.js',
        'src/**/js/cached/openlayer-map/cdn.googleapis/angularjs/1.6.4/!(*min*).js',
        'src/**/js/cached/common/cdn.cloudflare/angular-ui-bootstrap/0.11.0/ui-bootstrap-tpls.min.js',
        'src/**/js/ext/angular-pouchdb-5.0.1.js',
        'src/**/js/ext/moment.min.js',
        'src/**/js/ext/cdn.cloudflare/turf/4.6.1/turf.min.js',
        'src/**/js/ext/arc.js',
        'src/**/js/ext/bootstrap-datetimepicker.js',
        'src/**/libs/growl2-lib/*.min.js'
    ];
    var testUtilityFiles = [
        'src/test/**/utilities/*.js'
    ];
    var testDataFiles = [
        'src/test/**/testData/*.js'
    ];
    var polyfills = [
        'src/**/js/cached/openlayer-map/cdn.cloudflare/core-js/2.5.0/*.js'
    ];
    var srcFiles = [
        'src/**/js/embryo-for-test.js',
        'src/**/*.module.js',
        'src/**/components/**/*.js',
        'src/**/authentication/**/*.js',
        'src/**/core/**/*.js',
        'src/**/forecast/**/*.js',
        'src/**/ice/**/*.js',
        'src/**/menu/**/*.js',
        'src/**/nwnm/**/*.js',
        'src/**/webapp/sar/**/*.js',
        'src/**/select-area/**/*.js',
        'src/**/user/**/*.js',
        'src/**/vessel/**/*.js',
        'src/**/vrmt/vrmt-app.module.js',
        'src/**/vrmt/**/*.js',
        'src/**/weather/**/*.js',
    ];

    config.set({
		// base path, that will be used to resolve files and exclude
		basePath : '../../../',

		frameworks : [ 'jasmine', 'jasmine-matchers' ],


		// list of files / patterns to load in the browser
		files : libFiles.concat(testUtilityFiles).concat(polyfills).concat(srcFiles).concat(testDataFiles),


		// list of files to exclude
		exclude : [
			'src/main/webapp/js/ext/jquery.fileupload*.js',
            'src/main/webapp/components/sar-deprecated/*',
            'src/main/webapp/components/utils/embryo.js',
            'src/main/webapp/vrmt/app.js',
            'src/main/webapp/main-app.module.js',
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
		// logLevel : config.LOG_DEBUG,

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