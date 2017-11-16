(function () {
    'use strict';

    angular.module('embryo.vessel', [
        'embryo.vessel.vts',
        'embryo.vessel.schedule',
        'embryo.schedule',
        'embryo.components.vessel',
        'embryo.vessel.map',
        'embryo.controller.reporting'
    ]);
})();