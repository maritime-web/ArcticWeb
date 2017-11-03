(function () {
    "use strict";
    angular.module('embryo.core', [

        /* Shared modules */
        'embryo.authentication',
        'embryo.user',
        'embryo.components.openlayer',
        'embryo.components.notification',
        'embryo.storageServices',

        /* 3rd-party modules */
        'angular-growl'
    ]);
})();
