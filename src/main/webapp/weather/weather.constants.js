(function () {
    'use strict';

    angular.module('embryo.ice')
        .constant('WeatherEvents', {
            WeatherFeatureActive: 'Weather.FeatureActive',
            WeatherFeatureInActive: 'Weather.FeatureInActive',
            ShowForecast: 'Weather.ShowForecast',
            HideForecast: 'Weather.HideForecast',
            DistrictSelected: 'Weather.DistrictSelected',
            ZoomToDistrict: 'Weather.ZoomToDistrict',
            ShowMetoc: 'Weather.ShowMetoc',
            MetocSelected: 'Weather.MetocSelected',
            ClearMetoc: 'Weather.ClearMetoc',
            ClearMetocSelection: 'Weather.ClearMetocSelection'
        });
})();