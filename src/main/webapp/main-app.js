(function () {
    "use strict";
    angular.module('embryo.main.app', [
        /* Shared modules */
        'embryo.menu',
        'embryo.authentication',
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
        'ui.bootstrap'
    ]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'embryo.main.app' ]);
    });
})();
