(function () {
    'use strict';

    angular.module('embryo.vessel', [
        'embryo.vessel.vts',
        'embryo.vessel.schedule',
        'embryo.schedule.services',
        'embryo.vessel.service',
        'embryo.vessel.map',
        'embryo.controller.reporting'
    ]);
})();