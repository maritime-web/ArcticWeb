(function() {
    "use strict";

    var indexApp = angular.module('embryo.content', [ 'ngRoute' , 'embryo.menu', 'embryo.feedback', 'embryo.user', 'ui.bootstrap', 'embryo.components.version', 'angular-growl']);

    indexApp.config([ '$routeProvider', 'growlProvider', '$locationProvider', function($routeProvider, growlProvider, $locationProvider) {
        $locationProvider.hashPrefix("");
        growlProvider.globalTimeToLive(10000);
        growlProvider.globalPosition('bottom-left');

        $routeProvider.when('/feedback', {
            templateUrl: 'partials/front/feedback.html'
        }).when('/disclaimer', {
            templateUrl: 'partials/front/disclaimer.html'
        }).when('/cookies', {
            templateUrl: 'partials/front/cookies.html'
        }).when('/requestAccess', {
            templateUrl: 'authentication/access.html'
        }).when('/changePassword/:uuid', {
            templateUrl: 'authentication/changepassword.html'
        }).otherwise({
		    controller : function(){
		        window.location.replace('/');
		    }, 
		    template : "<div></div>"
		});
    } ]);

    $(function() {
        embryo.authentication.currentPageRequiresAuthentication = false;
    });
})();

