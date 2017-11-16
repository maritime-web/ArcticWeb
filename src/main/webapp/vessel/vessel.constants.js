(function () {
    'use strict';

    angular.module('embryo.vessel')
        .constant('VesselEvents', {
            VesselFeatureActive: 'Vessel.FeatureActive',
            VesselFeatureInActive: 'Vessel.FeatureInActive',
            VesselClicked: 'Vessel.VesselClicked',
            VesselSelected: 'Vessel.VesselSelected',
            ShowNearestVessels: 'Vessel.ShowNearestVessels',
            HideNearestVessels: 'Vessel.HideNearestVessels',
            HideExtraVesselsInfo: 'Vessel.HideExtraVesselsInfo',
            ShowDistanceCircles: 'Vessel.ShowDistanceCircles',
            HideDistanceCircles: 'Vessel.HideDistanceCircles',
            ShowRoute: 'Vessel.ShowRoute',
            ShowRoutes: 'Vessel.ShowRoutes',
            HideRoute: 'Vessel.HideRoute'
        });
})();