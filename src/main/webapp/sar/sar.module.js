(function () {
    'use strict';

    angular.module('embryo.sar', [

        /* Sub modules */
        'embryo.sar.service',
        'embryo.sar.operation.filter',
        'embryo.sar.status.filter',
        'embryo.sar.SearchPattern.filter',
        'embryo.sar.DrawSarSubDocPredicate',
        'embryo.sar.DrawOperationPredicate',
        'embryo.sar.model',
        'embryo.sar.userPouch',

        /* Shared modules */
        'embryo.components.notification',
        'embryo.subscription.service',
        'embryo.components.render',
        'embryo.common.service',
        'embryo.storageServices',
        'embryo.lteq.directive',
        'embryo.gteq.directive',
        'embryo.datepicker',
        'embryo.position',

        /* 3rd-party modules */
        'angular-growl',
        'ui.bootstrap.typeahead',
        'ui.bootstrap.accordion'
    ]);
})();