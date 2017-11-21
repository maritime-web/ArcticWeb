(function () {
    'use strict';

    angular.module('embryo.ice', [
        /* Shared modules */
        'embryo.components.notification',
        'embryo.storageServices',
        'embryo.subscription.service',
        'embryo.components.render',
        'embryo.shape',
        'embryo.tileSet',

        /* 3rd-party modules */
        'angular-growl',
        'ui.bootstrap.accordion'
    ]);
})();