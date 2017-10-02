(function () {
    'use strict';

    angular.module('embryo.ice')
        .constant('IceEvents', {
            IceFeatureActive: 'Ice.FeatureActive',
            IceFeatureInActive: 'Ice.FeatureInActive',
            ShowSatelliteMapTiles: 'Ice.ShowSatelliteMapTiles',
            HideSatelliteMapTiles: 'Ice.HideSatelliteMapTiles',
            ShowSatelliteMapBoundingBoxes: 'Ice.ShowSatelliteMapBoundingBoxes',
            HideSatelliteMapBoundingBoxes: 'Ice.HideSatelliteMapBoundingBoxes',
            ZoomToSatelliteMap: 'Ice.ZoomToSatelliteMap',
            TileSetAreaSelected: 'Ice.TileSetAreaSelected',
            ShowInshoreReports: 'Ice.ShowInshoreReports',
            InshoreReportsSelected: 'Ice.InshoreReportsSelected',
            ZoomToReport: 'Ice.ZoomToReport',
            ShowChart: 'Ice.ShowChart',
            HideChart: 'Ice.HideChart',
            ZoomToChart: 'Ice.ZoomToChart',
            ObservationSelected: 'Ice.ObservationSelected',
            ShowIcebergs: 'Ice.ShowIcebergs',
            HideIcebergs: 'Ice.HideIcebergs',
            ZoomToIceberg: 'Ice.ZoomToIceberg',
            IcebergSelected: 'Ice.IcebergSelected'
        });
})();