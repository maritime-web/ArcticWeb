(function () {
    "use strict";
    angular.module('embryo.main.app', [
        /* Shared modules */
        'embryo.core',
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

        'vrmt.render',
        'vrmt.map',
        'vrmt.model',
        'vrmt.app',

        'embryo.nwnm',
        'embryo.ice',
        'embryo.weather',
        'embryo.forecast',
        'embryo.sar',

        /* 3rd-party modules */
        'ui.bootstrap',
        'angular-growl'
    ]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'embryo.main.app' ]);
    });
})();
