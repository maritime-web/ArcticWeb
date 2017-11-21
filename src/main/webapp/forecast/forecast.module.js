(function () {
    'use strict';

    angular.module('embryo.forecast', [
        /* Shared modules */
        'embryo.components.notification',
        'embryo.subscription.service',
        'embryo.components.render',

        /* 3rd-party modules */
        'angular-growl',
        'ui.bootstrap.accordion'
    ]);
})();