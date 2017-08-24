(function () {
    "use strict";
    angular.module('embryo.main.app', [
        /* Shared modules */
        'embryo.menu',
        'embryo.authentication',
        'embryo.user',
        'embryo.components.openlayer',
        'embryo.components.notification',
        'embryo.control',

        /* Feature areas */
        'embryo.vessel',
        'embryo.yourvessel.control',
        'embryo.vessel.controller',
        'embryo.vessel.control',
        'embryo.vessel.map',
        'embryo.reporting.control',
        'embryo.greenpos',
        'embryo.routeUpload',
        'embryo.schedule',
        'embryo.routeEdit',
        'embryo.decimal',
        'embryo.controller.reporting',
        'embryo.aisinformation',
        'embryo.areaselect.control',

        /* 3rd-party modules */
        'ui.bootstrap',
        'angular-growl'
    ]);

    angular.module('embryo.main.app').config(['growlProvider', function (growlProvider) {
        growlProvider.globalTimeToLive(10000);
        growlProvider.globalPosition('bottom-left');
    }]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'embryo.main.app' ]);
    });
})();
