$(function() {


    var interval = 1 * 60 * 1000 * 60;

    var module = angular.module('embryo.weather');

    module.controller("WeatherController", [ '$scope', function($scope) {
        $scope.selected = {};

        $scope.$on("$destroy", function() {
            embryo.controllers.settings.close();
        });
    } ]);

    module.controller("SelectedMetocController", [ '$scope', 'NotifyService', 'WeatherEvents', function($scope, NotifyService, WeatherEvents) {

        $scope.ms2Knots = function(ms) {
            return Math.round(ms2Knots(ms) * 100) / 100;
        };

        NotifyService.subscribe($scope, WeatherEvents.MetocSelected, function (e, forecast) {
            $scope.selected.open = !!forecast;
            $scope.selected.forecast = forecast;
            $scope.selected.type = "msi";
        });

        $scope.formatTs = function(ts) {
            return formatTime(ts);
        };
    } ]);

    module.controller("MetocController", [ '$scope', 'RouteService', 'MetocService', 'Subject', 'NotifyService', 'WeatherEvents', 'growl', function($scope, RouteService, MetocService, Subject, NotifyService, WeatherEvents, growl) {
        $scope.routes = [];
        $scope.selectedOpen = false;

        function available(route) {
            return (Math.abs(route.etaDep - Date.now()) < 1000 * 3600 * 55) || Date.now() < route.eta;
        }

        if (Subject.getDetails().shipMmsi) {
            $scope.routes.push({
                name : 'Active route',
                available : false,
                ids : []
            });

            RouteService.getActiveMeta(embryo.authentication.shipMmsi, function(route) {
                if (route && route.id) {
                    $scope.routes[0].available = true;
                    $scope.routes[0].ids = [ route.id ];
                }
            }, function (error) {
                if (error.status === 404) {
                    growl.info("Please set an active route to get forecast on route");
                }
            });
        }

        $scope.routes.push({
            name : 'Selected routes',
            available : false,
            ids : []
        });

        $scope.$watch(RouteService.getSelectedRoutes, function(newValue, oldValue) {
            var routes = RouteService.getSelectedRoutes();

            for ( var index in routes) {
                if (available(routes[index])) {
                    $scope.routes[$scope.routes.length - 1].available = true;
                    $scope.routes[$scope.routes.length - 1].ids.push(routes[index].id);
                }
            }
        });

        $scope.$watch(function() {
            return MetocService.getDefaultWarnLimits();
        }, function() {
            if ($scope.metocs) {
                NotifyService.notify(WeatherEvents.ShowMetoc, $scope.metocs);
            }
        }, true);

        function clearScope() {
            $scope.shown = null;
            $scope.selectedForecast = null;
            $scope.metocs = null;
        }

        $scope.toggleShowMetoc = function($event, route) {
            $event.preventDefault();

            NotifyService.notify(WeatherEvents.ClearMetoc);

            if (!$scope.shown || $scope.shown.name !== route.name) {
                MetocService.listMetoc(route.ids, function(metocs) {
                    if (MetocService.forecastCount(metocs) > 0) {
                        $scope.shown = route;
                        $scope.metocs = metocs;
                        NotifyService.notify(WeatherEvents.ShowMetoc, metocs);
                    } else {
                        clearScope();
                    }
                });
            } else {
                clearScope();
            }
        };

    } ]);

    module.controller("WeatherForecastLayerControl", [ '$scope', 'ShapeService', 'WeatherService', 'SubscriptionService', 'NotifyService', 'WeatherEvents', function ($scope, ShapeService, WeatherService, SubscriptionService, NotifyService, WeatherEvents) {
        NotifyService.notify(WeatherEvents.WeatherFeatureActive);

        function merge(shapes, weather) {
            for ( var index in shapes) {
                var shape = shapes[index];
                for ( var j in shape.fragments) {
                    var fragment = shape.fragments[j];
                    if (weather.forecast) {
                        for ( var k in weather.forecast.districts) {
                            if (fragment.description.name == weather.forecast.districts[k].name) {
                                fragment.district = weather.forecast.districts[k];
                            }
                        }
                    }
                }
            }

            return shapes;
        }

        function drawAreas(weather) {
            ShapeService.staticShapes('static.Farvande_GRL', {
                exponent : 4,
                delta : true
            }, function(shapes) {
                if (weather) {
                    shapes = merge(shapes, weather);
                }

                NotifyService.notify(WeatherEvents.ShowForecast, shapes);
            }, function(errorMsg) {
            });
        }

        var subscriptionConfig = {
            name: "WeatherService.weather",
            fn: WeatherService.weather,
            interval: interval,
            success: function (weather) {
                $scope.weather = weather;
                drawAreas($scope.weather);
            },
            error: function (error) {
                drawAreas(null);
            }
        };
        var subscription = SubscriptionService.subscribe(subscriptionConfig);

        $scope.$on("$destroy", function () {
            NotifyService.notify(WeatherEvents.WeatherFeatureInActive);
            SubscriptionService.unsubscribe(subscription);
        });
    } ]);

    module.controller("WeatherForecastController", [ '$scope', 'WeatherService', 'SubscriptionService', 'NotifyService', 'WeatherEvents', function ($scope, WeatherService, SubscriptionService, NotifyService, WeatherEvents) {
        var subscriptionConfig = {
            subscriber: "weather-controller",
            name: "WeatherService.weather",
            fn: WeatherService.weather,
            interval: interval,
            success: function (weather) {
                $scope.errorMsg = null;
                $scope.forecast = weather.forecast;
            },
            error: function (error) {
                $scope.errorMsg = error;
            }
        };
        // resubscribe
        // This subscription will start polling every hour
        // It will however not be disabled even though navigating to another menu, e.g. Ice
        // the subscriber attribute ensure that callback configs are updated
        SubscriptionService.subscribe(subscriptionConfig);

        $scope.viewForecast = function($event, district) {
            $event.preventDefault();
            NotifyService.notify(WeatherEvents.ZoomToDistrict, district);
        };

        $scope.from = function() {
            return $scope.forecast && $scope.forecast.from ? formatTime($scope.forecast.from) : null;
        };

        $scope.to = function() {
            return $scope.forecast && $scope.forecast.to ? formatTime($scope.forecast.to) : null;
        };
    } ]);

    module.controller("SelectWeatherForecastCtrl", [ '$scope', 'NotifyService', 'WeatherEvents', function($scope, NotifyService, WeatherEvents) {
        NotifyService.subscribe($scope, WeatherEvents.DistrictSelected, function (e, district) {
            $scope.selected.open = !!district;
            $scope.selected.forecast = district;
            $scope.selected.type = "district";
            $scope.selected.name = district ? district.name : null;
            NotifyService.notify(WeatherEvents.ClearMetocSelection);
        });

        $scope.formatDateTime = function(validTo) {
            return validTo ? formatTime(validTo) : null;
        };
    } ]);

    module.controller("SettingsCtrl", [ '$scope', 'MetocService', function($scope, MetocService) {
        var warnLimits = MetocService.getDefaultWarnLimits();
        $scope.settings = [ {
            text : "Warning limit for waves",
            value : warnLimits.defaultWaveWarnLimit,
            type : "number",
            unit : "meter"

        }, {
            text : "Warning limit for current",
            value : warnLimits.defaultCurrentWarnLimit,
            type : "number",
            unit : "knots"
        }, {
            text : "Warning limit for wind",
            value : warnLimits.defaultWindWarnLimit,
            type : "number",
            unit : "knots"
        } ];

        $scope.save = function() {
            MetocService.saveDefaultWarnLimits({
                defaultWaveWarnLimit : $scope.settings[0].value,
                defaultCurrentWarnLimit : $scope.settings[1].value,
                defaultWindWarnLimit : $scope.settings[2].value
            });

            $scope.message = "Weather forecast settings saved.";
        };

        $scope.provider = {
            doShow : false,
            show : function(context) {
                $scope.message = null;
                this.doShow = true;
                $scope.title = context.title;
            },
            close : function() {
                this.doShow = false;
            }
        };

        $scope.close = function($event) {
            $event.preventDefault();
            $scope.provider.close();
        };

        embryo.controllers.settings = $scope.provider;

    } ]);

    module.controller("SettingsMetocCtrl", [ '$scope', function($scope) {
        $scope.open = function($event) {
            $event.preventDefault();
            embryo.controllers.settings.show({
                title : "Forecast on route"
            });
        };
    } ]);

    module.controller("LegendsController", [ '$scope', 'MetocService', function($scope, MetocService) {
        function buildLimits(limits) {
            var result = [];
            for (var index = 0; index < limits.length; index += 2) {
                var object = {
                    "first": limits[index]
                };
                if (index < limits.length - 2) {
                    object["second"] = limits[index + 1];
                }
                result.push(object);
            }
            return result;
        }

        $scope.$watch(function() {
            return MetocService.getDefaultWarnLimits();
        }, function() {
            $scope.waveLimits = buildLimits(MetocService.getWaveLimits());
            $scope.currentLimits = buildLimits(MetocService.getCurrentLimits());
            $scope.windLimits = buildLimits(MetocService.getWindLimits());
        }, true);

        $scope.knots2Ms = function(knots) {
            return Math.round(knots2Ms(knots) * 10) / 10;
        };
    } ]);
});
