(function () {
    'use strict';

    angular.module('embryo.forecast')
        .constant('ForecastEvents', {
            ForecastFeatureActive: 'Forecast.FeatureActive',
            ForecastFeatureInActive: 'Forecast.FeatureInActive',
            ClearForecasts: 'Forecast.ClearForecasts',
            ShowWaves: 'Forecast.ShowWaves',
            ShowCurrent: 'Forecast.ShowCurrent',
            ShowIce: 'Forecast.ShowIce'
        });
})();