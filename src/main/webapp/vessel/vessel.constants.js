(function () {
    'use strict';

    angular.module('embryo.vessel')
        .constant('VesselEvents', {
            VesselsLoaded: 'VesselsLoaded',
            VesselClicked: 'VesselClicked',
            VesselSelected: 'VesselSelected',
            ShowNearestVessels: 'ShowNearestVessels',
            HideNearestVessels: 'HideNearestVessels',
            HideExtraVesselsInfo: 'HideExtraVesselsInfo',
            ShowDistanceCircles: 'ShowDistanceCircles',
            HideDistanceCircles: 'HideDistanceCircles',
            ShowRoute: 'ShowRoute',
            ShowRoutes: 'ShowRoutes',
            HideRoute: 'HideRoute'
        });
})();