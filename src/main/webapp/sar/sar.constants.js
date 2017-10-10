(function () {
    'use strict';

    angular.module('embryo.sar')
        .constant('SarEvents', {
            SarFeatureActive: 'Sar.FeatureActive',
            SarFeatureInActive: 'Sar.FeatureInActive',
            DrawSarDocuments: 'Sar.DrawSarDocuments',
            ZoneUpdated: 'Sar.ZoneUpdated',
            ZoomToOperation: 'Sar.ZoomToOperation',
            EffortAllocationZoneModified: 'Sar.EffortAllocationZoneModified',
            ActivatePositionSelection: 'Sar.ActivatePositionSelection',
            DeactivatePositionSelection: 'Sar.DeactivatePositionSelection',
            PositionSelected: 'Sar.PositionSelected',
            CreateTemporarySearchPattern: 'Sar.CreateTemporarySearchPattern',
            RemoveTemporarySearchPattern: 'Sar.RemoveTemporarySearchPattern',
            ActivateTrackLinePositioning: 'Sar.ActivateTrackLinePositioning',
            DeactivateTrackLinePositioning: 'Sar.DeactivateTrackLinePositioning',
            TrackLinePositionModified: 'Sar.TrackLinePositionModified',

        });
})();