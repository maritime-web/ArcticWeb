/**
 * Inspired by http://www.codelord.net/2015/05/04/angularjs-notifying-about-changes-from-services-to-controllers/
 */
(function () {
    'use strict';

    angular
        .module('embryo.components.notification')
        .service('NotifyService', NotifyService);

    NotifyService.$inject = ['$rootScope'];

    function NotifyService($rootScope) {

            this.subscribe = function(scope, event, callback) {
                var handler = $rootScope.$on(event, callback);
                scope.$on('$destroy', handler);
                return handler;
            };

            this.notify = function(event, data) {
                $rootScope.$emit(event, data);
            }
    }
})();
