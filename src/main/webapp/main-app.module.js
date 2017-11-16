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
        'embryo.decimal',
        'embryo.controller.reporting',

        'vrmt.render',
        'vrmt.map',
        'vrmt.model',
        'vrmt.app',

        'embryo.nwnm',
        'embryo.ice',
        'embryo.weather',
        'embryo.forecast',
        'embryo.sar',
        'embryo.areaselect',

        /* 3rd-party modules */
        'ui.bootstrap',
        'angular-growl'
    ]);

    angular.element(document).ready(function () {
        angular.bootstrap(document, [ 'embryo.main.app' ]);
    });
})();
