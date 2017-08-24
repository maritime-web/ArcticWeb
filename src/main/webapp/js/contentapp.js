(function() {
    "use strict";

    var indexApp = angular.module('embryo.content', [ 'ngRoute' , 'embryo.menu', 'embryo.feedback', 'ui.bootstrap', 'embryo.components.version', 'angular-growl']);

    indexApp.config([ '$routeProvider', 'growlProvider', function($routeProvider, growlProvider) {
        growlProvider.globalTimeToLive(10000);
        growlProvider.globalPosition('bottom-left');

        $routeProvider.when('/feedback', {
            templateUrl: 'partials/front/feedback.html'
        }).when('/disclaimer', {
            templateUrl: 'partials/front/disclaimer.html'
        }).when('/cookies', {
            templateUrl: 'partials/front/cookies.html'
        }).when('/requestAccess', {
            templateUrl: 'partials/common/access.html'
        }).when('/changePassword/:uuid', {
            templateUrl: 'partials/common/changepassword.html'
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

