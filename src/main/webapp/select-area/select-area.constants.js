(function () {
    'use strict';

    angular.module('embryo.areaselect')
        .constant('SelectAreaEvents', {
            SelectAreaActive: 'SelectArea.FeatureActive',
            SelectAreaInActive: 'SelectArea.FeatureInActive',
            ShowArea: 'SelectArea.ShowArea',
            ClearAreas: 'SelectArea.ClearAreas',
            StartEdit: 'SelectArea.StartEdit',
            DoneEdit: 'SelectArea.DoneEdit',
            AreaCreated: 'SelectArea.AreaCreated',
        });
})();