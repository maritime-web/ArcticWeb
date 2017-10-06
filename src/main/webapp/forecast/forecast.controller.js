$(function() {

    var forecastInterval = 60 * 60 * 1000;

    var module = angular.module('embryo.forecast');

    module.controller("ForecastController", [ '$scope','NotifyService', 'ForecastEvents', function($scope, NotifyService, ForecastEvents) {
        NotifyService.notify(ForecastEvents.ForecastFeatureActive);
        $scope.$on("$destroy", function() {
            NotifyService.notify(ForecastEvents.ForecastFeatureInActive);
        });
    } ]);

    module.controller('ForecastCtrl', [ '$scope', 'ForecastService','NotifyService', function ($scope, ForecastService, NotifyService) {
        $scope.service = ForecastService;

        function reloadMap(ctrl) {
            if (ForecastService.forecastSelected) {
                NotifyService.notify(ctrl.showEvent, {forecast: $scope.data, time: $scope.current, mapType: $scope.provider});
            }
        }

        function createSuccess(selected, ctrl) {
            return function success(forecast) {
                $scope.errorMsg = null;
                $scope.data = forecast;
                var time = forecast.metadata.time;
                $scope.start = 0;
                $scope.end = time.length - 1;
                $scope.current = $scope.start;
                $scope.provider = selected.provider;

                $scope.updateCurrentDate = function() {
                    var t = time[$scope.current];
                    $scope.currentDate = formatTime(t);
                    reloadMap(ctrl);
                };
                $scope.$watch('current', $scope.updateCurrentDate);
                ForecastService.forecastSelected = selected.id;
                $scope.updateCurrentDate();
            }
        }

        function error() {
            $scope.errorMsg = error;
        }

        $scope.getForecast = function (selected, $event, ctrl) {
            $event.preventDefault();
            if (selected.id == ForecastService.forecastSelected) {
                ForecastService.forecastSelected = '';
                NotifyService.notify(ForecastEvents.ClearForecasts);
                return;
            }

            ctrl.getForecast(selected.id, createSuccess(selected, ctrl), error);
        };
    } ]);

    module.controller('WaveForecastsCtrl', [ '$scope', 'ForecastService', 'SubscriptionService', 'ForecastEvents', function ($scope, ForecastService, SubscriptionService, ForecastEvents) {
        this.getForecast = ForecastService.getWaveForecast;
        this.showEvent = ForecastEvents.ShowWaves;
        $scope.waveForecasts = [];

        var subscriptionConfig = {
            subscriber: "WaveForecastsCtrl",
            name: "ForecastService.listWaveForecasts",
            fn: ForecastService.listWaveForecasts,
            interval: forecastInterval,
            success: function (forecasts) {
                $scope.errorMsg = null;
                var waveForecasts = [];
                for (var i = 0; i < forecasts.length; i++) {
                    waveForecasts.push(convertForecast(forecasts[i]));
                }
                $scope.waveForecasts = ForecastService.replaceAllButSelected($scope.waveForecasts, waveForecasts);
            },
            error: function (error) {
                $scope.errorMsg = error;
            }
        };
        SubscriptionService.subscribe(subscriptionConfig);
    } ]);

    module.controller('CurrentForecastsCtrl', [ '$scope', 'ForecastService', 'SubscriptionService', 'ForecastEvents', function ($scope, ForecastService, SubscriptionService, ForecastEvents) {
        this.getForecast = ForecastService.getCurrentForecast;
        this.showEvent = ForecastEvents.ShowCurrent;

        $scope.currentForecasts = [];

        var subscriptionConfig = {
            subscriber: "CurrentForecastsCtrl",
            name: "ForecastService.listCurrentForecasts",
            fn: ForecastService.listCurrentForecasts,
            interval: forecastInterval,
            success: function (forecasts) {
                $scope.errorMsg = null;
                var currentForecasts = [];
                for (var i = 0; i < forecasts.length; i++) {
                    currentForecasts.push(convertForecast(forecasts[i]));
                }
                $scope.currentForecasts = ForecastService.replaceAllButSelected($scope.currentForecasts, currentForecasts);
            },
            error: function (error) {
                $scope.errorMsg = error;
            }
        };
        SubscriptionService.subscribe(subscriptionConfig);
    }]);

    module.controller('IceForecastCtrl', [ '$scope', 'ForecastService', 'NotifyService', 'ForecastEvents', function($scope, ForecastService, NotifyService, ForecastEvents) {
        $scope.service = ForecastService;

        $scope.reloadMap = function(wipe) {
            if (ForecastService.forecastSelected && $scope.selectedVariable) {
                NotifyService.notify(ForecastEvents.ShowIce, {forecast: $scope.data, time: $scope.current, mapType: $scope.selectedVariable});
            } else if (wipe === true) {
                NotifyService.notify(ForecastEvents.ClearForecasts);
            }
        };

        $scope.$watch('selectedVariable', $scope.reloadMap);

        $scope.getForecast = function(p, $event) {
            $event.preventDefault();
            if (p.id == ForecastService.forecastSelected) {
                ForecastService.forecastSelected = '';
                $scope.reloadMap(true);
                return;
            }
            ForecastService.getIceForecast(p.id, function(forecast) {
                $scope.errorMsg = null;
                $scope.data = forecast;
                var time = forecast.metadata.time;
                $scope.start = 0;
                $scope.end = time.length - 1;
                $scope.current = $scope.start;
                $scope.selectedVariable = 'iceConcentration';
                
                if(!("Ice concentration" in forecast.variables)) {
                	$scope.noIceConcentration = true;
                }
                if(!("Ice thickness" in forecast.variables)) {
                	$scope.noIceThickness = true;
                }
                if(!("Ice speed north" in forecast.variables) || !("Ice speed east" in forecast.variables)) {
                	$scope.noIceSpeed = true;
                }
                if(!("Ice accretion risk" in forecast.variables)) {
                	$scope.noIceAccretion = true;
                }

                $scope.updateCurrentDate = function() {
                    var t = time[$scope.current];
                    $scope.currentDate = formatTime(t);
                    $scope.reloadMap();
                };
                $scope.$watch('current', $scope.updateCurrentDate);

                ForecastService.forecastSelected = p.id;
                $scope.updateCurrentDate();
            }, function (error) {
                $scope.errorMsg = error;
            });

        };
    } ]);

    module.controller('IceForecastsCtrl', [ '$scope', 'ForecastService', 'SubscriptionService', function ($scope, ForecastService, SubscriptionService) {
        $scope.iceForecasts = [];

        var subscriptionConfig = {
            subscriber: "IceForecastsCtrl",
            name: "ForecastService.listIceForecasts",
            fn: ForecastService.listIceForecasts,
            interval: forecastInterval,
            success: function (forecasts) {
                $scope.errorMsg = null;
                var iceForecasts = [];
                for (var i = 0; i < forecasts.length; i++) {
                    iceForecasts.push(convertForecast(forecasts[i]));
                }
                $scope.iceForecasts = ForecastService.replaceAllButSelected($scope.iceForecasts, iceForecasts);
            },
            error: function (error) {
                $scope.errorMsg = error;
            }
        };
        SubscriptionService.subscribe(subscriptionConfig);
    } ]);
    
    var convertForecast = function(forecast) {
    	forecast.selected = false;
    	forecast.timestamp = formatTime(forecast.timestamp);
    	forecast.size = parseFloat(forecast.size / 1000).toFixed(1) + 'K';
    	return forecast;
    };

});