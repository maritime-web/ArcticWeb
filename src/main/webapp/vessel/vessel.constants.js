(function () {
    'use strict';

    angular.module('embryo.vessel')
        .constant('Events', {
            VesselsLoaded: 'VesselsLoaded',
            VesselClicked: 'VesselClicked',
            VesselSelected: 'VesselSelected',
            ShowNearestVessels: 'ShowNearestVessels',
            HideNearestVessels: 'HideNearestVessels',
            HideExtraVesselsInfo: 'HideExtraVesselsInfo',
            ShowDistanceCircles: 'ShowDistanceCircles',
            HideDistanceCircles: 'HideDistanceCircles'
        });
})();