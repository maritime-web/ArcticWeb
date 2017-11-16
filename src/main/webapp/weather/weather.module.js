(function () {
    'use strict';

    angular.module('embryo.weather', [
        /* Shared modules */
        'embryo.components.notification',
        'embryo.subscription.service',
        'embryo.storageServices',
        'embryo.control',
        'embryo.route',

        /* 3rd-party modules */
        'angular-growl',
        'ui.bootstrap.accordion'
    ]);
})();