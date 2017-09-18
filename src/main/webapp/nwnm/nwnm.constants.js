(function () {
    'use strict';

    angular.module('embryo.nwnm')
        .constant('NWNMEvents', {
            NWNMFeatureActive: 'NWNM.FeatureActive',
            NWNMFeatureInActive: 'NWNM.FeatureInActive',
            MessagesUpdated: 'NWNM.MessagesUpdated',
            AreaChosen: 'NWNM.AreaChosen',
            MessageSelected: 'NWNM.MessageSelected'
        });
})();