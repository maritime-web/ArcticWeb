(function () {
    "use strict";

    angular.module('vrmt.app',
        [
            'ngAnimate',
            'ngSanitize',
            'ui.bootstrap',
            'ui.bootstrap.accordion',
            'ui.bootstrap.tooltip',

            'vrmt.render',
            'vrmt.map',
            'vrmt.model',

            'embryo.components.render',
            'embryo.authentication',
            'embryo.routeService',
            'embryo.vessel.service',
            'embryo.scheduleService',
            'embryo.pouchdb.services',
            'embryo.components.notification',

            'angular-growl'
        ])
})();