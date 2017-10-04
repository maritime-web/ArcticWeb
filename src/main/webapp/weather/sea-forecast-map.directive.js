(function () {
    'use strict';

    angular
        .module('embryo.weather')
        .directive('weatherForecastMap', weatherForecastMap);

    weatherForecastMap.$inject = ['WeatherEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents'];

    function weatherForecastMap(WeatherEvents, OpenlayerService, NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var seaForecastLayer = new ol.layer.Vector({
                title: 'Sea Forecast Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Weather',
                    name: 'Sea forcast'
                }

            });

            var selectedFeature;

            NotifyService.subscribe(scope, WeatherEvents.ShowForecast, function (e, shapes) {
                update(shapes);
            });

            function update(shapes) {
                selectedFeature = undefined;
                seaForecastLayer.getSource().clear();

                for (var l in shapes) {
                    var shape = shapes[l];
                    var fragments = shape.fragments.slice(0);

                    drawFragments(shape, fragments);
                }

                updateContext();

                function drawFragment(shape, fragment) {
                    var rings = [];
                    var polygons = fragment.polygons;

                    for (var k in polygons) {
                        var polygon = polygons[k];

                        var points = [];
                        for (var j in polygon) {
                            var p = polygon[j];

                            if (j >= 1) {
                                var diff = Math.abs(polygon[j - 1].x - p.x);
                                if (diff > 350) {
                                    if (p.x < polygon[j - 1].x) {
                                        p.x += 360;
                                    } else {
                                        p.x -= 360;
                                    }
                                }
                            }

                            points.push(/** @type {ol.Coordinate|[]} */OpenlayerService.fromLonLat([p.x, p.y]));
                        }
                        rings.push(points);
                    }

                    var feature = new ol.Feature({
                        geometry: new ol.geom.Polygon(rings)
                    });

                    feature.setId(fragment.description.Id);
                    feature.set('name', fragment.description.name, true);
                    feature.set('district', fragment.district, true);

                    var styleFunction = function (feature, resolution) {
                        var fillColor = "rgba(255, 0, 0, 0.0)";
                        if (fragment.district && fragment.district.warnings && resolution > 800) {
                            fillColor = "rgba(255, 0, 0, 0.5)";
                        }

                        var strokeColor = "rgba(0, 0, 0, 0.2)";
                        if (feature === selectedFeature) {
                            strokeColor = "rgba(0, 0, 0, 1.0)";
                        }

                        var font = 'bold 9px Courier New, monospace';
                        if (resolution < 2500) {
                            font = 'bold 11px Courier New, monospace';
                        }
                        if (resolution < 1000) {
                            font = 'bold 13px Courier New, monospace';
                        }

                        var description = '';
                        if (seaForecastLayer.get('context').active) {
                            description = "" + fragment.description.Id + "\n" + fragment.description.name;
                        }

                        return [
                            new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: fillColor
                                }),
                                stroke: new ol.style.Stroke({color: strokeColor, width: 1}),
                                text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                                    textAlign: 'start',
                                    font: font,
                                    text: description,
                                    rotation: 0
                                })
                            })
                        ];
                    };

                    feature.setStyle(styleFunction);

                    seaForecastLayer.getSource().addFeature(feature);
                }

                function drawFragments(shape, fragments) {
                    if (fragments.length > 0) {
                        var fragment = fragments.pop();

                        drawFragment(shape, fragment);

                        drawFragments(shape, fragments);
                    }
                }
            }

            /** Zoom to chosen district **/
            NotifyService.subscribe(scope, WeatherEvents.ZoomToDistrict, function (e, district) {
                var districtFeature = seaForecastLayer.getSource().getFeatures().find(function (f) {
                    return f.get('district') === district;
                });

                if (districtFeature) {
                    selectedFeature = districtFeature;
                    NotifyService.notify(OpenlayerEvents.ZoomToFeature, {feature: districtFeature, minResolution: 2500, padding: [20,20,20,20]});
                }
            });

            /** Hide forecast **/
            NotifyService.subscribe(scope, WeatherEvents.HideForecast, function () {
                seaForecastLayer.getSource().clear();
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(seaForecastLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === seaForecastLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === seaForecastLayer;
                            }});

                            seaForecastLayer.getSource().changed();
                            var district = selectedFeature.get('district');
                            NotifyService.notify(WeatherEvents.DistrictSelected, district);
                            NotifyService.notify(OpenlayerEvents.ZoomToFeature, {feature: selectedFeature, minResolution: 2500, padding: [20,20,20,20]});

                        }
                        scope.$apply();
                    });
                }

                if (NotifyService.hasOccurred(WeatherEvents.WeatherFeatureActive)) {
                    createClickListener();
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, WeatherEvents.WeatherFeatureActive, function () {
                    if (!onClickKey) {
                        createClickListener();
                    }
                    updateContextToActive();
                    seaForecastLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, WeatherEvents.WeatherFeatureInActive, function () {
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                        onClickKey = null;
                    }
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(seaForecastLayer)) {
                        map.removeLayer(seaForecastLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, seaForecastLayer.get('context'));
                seaForecastLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, seaForecastLayer.get('context'));
                newContext.active = true;
                seaForecastLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, seaForecastLayer.get('context'));
                newContext.active = false;
                seaForecastLayer.set('context', newContext);
            }
        }
    }
})();