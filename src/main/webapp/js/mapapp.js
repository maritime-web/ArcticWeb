(function () {
    "use strict";
    angular.module('embryo.mapapp', [
        /* Shared modules */
        'embryo.components.version',
        'embryo.map',
        'embryo.menu',
        'embryo.authentication',
        'embryo.zoom',

        /* Feature areas */
        'embryo.yourvessel.control',
        'embryo.vessel.controller',
        'embryo.vessel.control',
        'embryo.reporting.control',
        'embryo.greenpos',
        'embryo.ice.control',
        'embryo.nwnm.controllers',
        'embryo.routeUpload',
        'embryo.schedule',
        'embryo.routeEdit',
        'embryo.decimal',
        'embryo.shape',
        'embryo.metoc',
        'embryo.weather.control',
        'embryo.controller.reporting',
        'embryo.aisinformation',
        'embryo.forecast.control',
        'embryo.satellite-ice.control',
        'embryo.areaselect.control',
        'embryo.sar.controllers',
        'embryo.sar.views',

        /* 3rd-party modules */
        'ui.bootstrap'
    ]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'embryo.mapapp' ]);
    });
})();
