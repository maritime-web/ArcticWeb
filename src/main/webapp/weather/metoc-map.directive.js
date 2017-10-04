(function () {
    'use strict';

    angular
        .module('embryo.weather')
        .directive('metocMap', metocMap);

    metocMap.$inject = ['WeatherEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents', 'MetocService'];

    function metocMap(WeatherEvents, OpenlayerService, NotifyService, OpenlayerEvents, MetocService) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var metocLayer = new ol.layer.Vector({
                title: 'Metoc Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Weather',
                    name: 'Metoc'
                }

            });

            var defaultCurrentLow = 1.0;
            var defaultCurrentMedium = 2.0;
            var defaultWaveLow = 1.0;
            var defaultWaveMedium = 2.0;

            var defaultCurrentWarnLimit = 2.0;
            var defaultWaveWarnLimit = 2.0;
            var defaultWindWarnLimit = 15.0;

            var selectedFeature;

            NotifyService.subscribe(scope, WeatherEvents.ShowMetoc, function (e, metocs) {
                update(metocs);
            });

            function update(metocs) {
                var dummyFeaturesNotDrawn = true;

                if (MetocService.getDefaultWarnLimits()) {
                    defaultCurrentWarnLimit = MetocService.getDefaultWarnLimits().defaultCurrentWarnLimit;
                    defaultWaveWarnLimit = MetocService.getDefaultWarnLimits().defaultWaveWarnLimit;
                    defaultWindWarnLimit = MetocService.getDefaultWarnLimits().defaultWindWarnLimit;
                }

                selectedFeature = undefined;
                metocLayer.getSource().clear();

                for (var index in metocs) {
                    drawMetoc(metocs[index]);
                }

                updateContext();

                function drawMetoc(metoc) {
                    for (index in metoc.forecasts) {
                        drawMetocForecast(metoc, metoc.forecasts[index])
                    }
                }

                function drawMetocForecast(metoc, forecast) {
                    var feature = null;

                    var point = new ol.geom.Point(/** @type {ol.Coordinate|[]} */OpenlayerService.fromLonLat([forecast.lon, forecast.lat]));

                    if (forecast.waveDir && forecast.waveHeight && forecast.wavePeriod) {
                        createFeature("wave");
                    }
                    if (forecast.windDir && forecast.windSpeed) {
                        createFeature("wind");
                    }
                    if (forecast.curDir && forecast.curSpeed) {
                        createFeature("current");
                    }

                    function createFeature(type) {
                        feature = new ol.Feature({
                            geometry: point
                        });

                        feature.set("attributes", {
                            index: index,
                            type: type,
                            created: metoc.created,
                            forecast: forecast,
                            time: formatTime(forecast.time),
                            curSpeed: forecast.curSpeed ? forecast.curSpeed + " kn" : "N/A",
                            curDir: forecast.curDir ? forecast.curDir + "°" : "N/A",
                            windSpeed: forecast.windSpeed ? forecast.windSpeed + " m/s" : "N/A",
                            windDir: forecast.windDir ? forecast.windDir + "°" : "N/A",
                            waveHeight: forecast.waveHeight ? forecast.waveHeight + " m" : "N/A",
                            waveDir: forecast.waveDir ? forecast.waveDir + "°" : "N/A",
                            wavePeriod: forecast.wavePeriod ? forecast.wavePeriod + " sec" : "N/A",
                            sealevel: forecast.sealevel ? forecast.sealevel + " m" : "N/A"
                        });

                        var styleFunction = function (feature, resolution) {
                            var styles = [];
                            var attributes = feature.get('attributes');
                            var active = metocLayer.get('context').active;

                            if (feature === selectedFeature) {
                                styles.push(new ol.style.Style({
                                        image: new ol.style.Icon(({
                                            anchor: [0.5, 0.5],
                                            opacity: 0.8,
                                            src: 'img/circle_big.png',
                                            scale: getSelectionScale()
                                        }))
                                    })
                                );
                            }

                            if (resolution < 500) {
                                styles.push(new ol.style.Style({
                                        text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                                            textAlign: 'start',
                                            font: getFont(),
                                            text: getDescription(),
                                            rotation: 0,
                                            offsetX: 50,
                                            offsetY: 42,
                                            fill: new ol.style.Fill({color: getFillColor()}),
                                            stroke: new ol.style.Stroke({color: getStrokeColor(), width: 3})
                                        })
                                    })
                                );
                            }

                            styles.push(new ol.style.Style({
                                image: new ol.style.Icon(({
                                    anchor: [0.5, 0.5],
                                    opacity: getOpacity(),
                                    src: getGraphicsSrc(),
                                    rotation: getRotation(),
                                    scale: getScale()
                                }))
                            }));

                            return styles;

                            function getSelectionScale() {
                                var scale = 0.15;
                                if (resolution < 2000) {
                                    scale = 0.35;
                                }
                                if (resolution < 1000) {
                                    scale = 0.4;
                                }
                                if (resolution < 700) {
                                    scale = 0.55;
                                }
                                if (resolution < 300) {
                                    scale = 0.68;
                                }
                                return scale;
                            }

                            function getScale() {
                                var scale = 0.2;
                                if (resolution < 2000) {
                                    scale = 0.4;
                                }
                                if (resolution < 1000) {
                                    scale = 0.5;
                                }
                                if (resolution < 700) {
                                    scale = 0.7;
                                }
                                if (resolution < 300) {
                                    scale = 0.8;
                                }
                                return scale;
                            }

                            function getStrokeColor() {
                                // return "rgba(204, 34, 34, 1.0)";
                                return "black";
                            }

                            function getFillColor() {
                                // return "rgba(85, 0, 85, 1.0)";
                                return "darkgoldenrod";
                            }

                            function getOpacity() {
                                return active ? 0.9 : 0.6;
                            }

                            function getDescription() {
                                return "Time: " + attributes.time + "\nCurrent: " + attributes.curSpeed + " - " + attributes.curDir + "\nWind:   " + attributes.windSpeed + " - " + attributes.windDir + "\nWave: " + attributes.waveHeight + " - " + attributes.waveDir + "(" + attributes.wavePeriod + ")\nSea level:   " + attributes.sealevel;
                            }

                            function getFont() {
                                var fontBase = "'Lucida Grande', Verdana, Geneva, Lucida, Arial, Helvetica, sans-serif";
                                return 'bold 12px ' + fontBase;
                            }

                            function getGraphicsSrc() {
                                var markerDir;
                                if (attributes.type === 'wave') {
                                    var waveHeight = attributes.forecast.waveHeight;
                                    markerDir = 'img/wave/mark';

                                    if (waveHeight >= 0 && waveHeight <= defaultWaveLow) {
                                        markerDir += "01";
                                    } else if (waveHeight > defaultWaveLow && waveHeight <= defaultWaveMedium) {
                                        markerDir += "02";
                                    } else if (waveHeight > defaultWaveMedium) {
                                        markerDir += "03";
                                    }

                                    if (waveHeight >= defaultWaveWarnLimit) {
                                        markerDir += "red.png";
                                    } else {
                                        markerDir += ".png";
                                    }

                                    return markerDir;
                                }
                                if (attributes.type === 'current') {
                                    var currentSpeedMs = attributes.forecast.curSpeed;
                                    markerDir = 'img/current/mark';
                                    var currentSpeedKn = currentSpeedMs * (3.6 / 1.852);

                                    if (currentSpeedKn >= 0 && currentSpeedKn <= defaultCurrentLow) {
                                        markerDir += "01";
                                    } else if (currentSpeedKn > defaultCurrentLow && currentSpeedKn <= defaultCurrentMedium) {
                                        markerDir += "02";
                                    } else if (currentSpeedKn > defaultCurrentMedium) {
                                        markerDir += "03";
                                    }

                                    if (currentSpeedKn >= defaultCurrentWarnLimit) {
                                        markerDir += "red.png";
                                    } else {
                                        markerDir += ".png";
                                    }

                                    return markerDir;
                                }
                                if (attributes.type === 'wind') {
                                    markerDir = 'img/wind/mark';
                                    var windSpeed = attributes.forecast.windSpeed;

                                    var windSpeedKnots = ms2Knots(windSpeed);

                                    if (windSpeedKnots >= 0 && windSpeedKnots <= 5) {
                                        markerDir += "005";
                                    } else if (windSpeedKnots > 5 && windSpeedKnots <= 10) {
                                        markerDir += "010";
                                    } else if (windSpeedKnots > 10 && windSpeedKnots <= 15) {
                                        markerDir += "015";
                                    } else if (windSpeedKnots > 15 && windSpeedKnots <= 20) {
                                        markerDir += "020";
                                    } else if (windSpeedKnots > 20 && windSpeedKnots <= 25) {
                                        markerDir += "025";
                                    } else if (windSpeedKnots > 25 && windSpeedKnots <= 30) {
                                        markerDir += "030";
                                    } else if (windSpeedKnots > 30 && windSpeedKnots <= 35) {
                                        markerDir += "035";
                                    } else if (windSpeedKnots > 35 && windSpeedKnots <= 40) {
                                        markerDir += "040";
                                    } else if (windSpeedKnots > 40 && windSpeedKnots <= 45) {
                                        markerDir += "045";
                                    } else if (windSpeedKnots > 45 && windSpeedKnots <= 50) {
                                        markerDir += "050";
                                    } else if (windSpeedKnots > 50 && windSpeedKnots <= 55) {
                                        markerDir += "055";
                                    } else if (windSpeedKnots > 55 && windSpeedKnots <= 60) {
                                        markerDir += "060";
                                    } else if (windSpeedKnots > 60 && windSpeedKnots <= 65) {
                                        markerDir += "065";
                                    } else if (windSpeedKnots > 65 && windSpeedKnots <= 70) {
                                        markerDir += "070";
                                    } else if (windSpeedKnots > 70 && windSpeedKnots <= 75) {
                                        markerDir += "075";
                                    } else if (windSpeedKnots > 75 && windSpeedKnots <= 80) {
                                        markerDir += "080";
                                    } else if (windSpeedKnots > 80 && windSpeedKnots <= 85) {
                                        markerDir += "085";
                                    } else if (windSpeedKnots > 85 && windSpeedKnots <= 90) {
                                        markerDir += "090";
                                    } else if (windSpeedKnots > 90 && windSpeedKnots <= 95) {
                                        markerDir += "095";
                                    } else if (windSpeedKnots > 95 && windSpeedKnots <= 100) {
                                        markerDir += "100";
                                    } else if (windSpeedKnots > 100 && windSpeedKnots <= 105) {
                                        markerDir += "105";
                                    } else if (windSpeedKnots > 100) {
                                        markerDir += "105";
                                    }

                                    if (windSpeed >= defaultWindWarnLimit) {
                                        markerDir += "red.png";
                                    } else {
                                        markerDir += ".png";
                                    }

                                    return markerDir;
                                }

                            }

                            function getRotation() {
                                if (attributes.type === 'wave') {
                                    return attributes.forecast.waveDir  * (Math.PI / 180);
                                }
                                if (attributes.type === 'current') {
                                    return attributes.forecast.curDir  * (Math.PI / 180);
                                }
                                if (attributes.type === 'wind') {
                                    return attributes.forecast.windDir * (Math.PI / 180);
                                }
                                return 0;
                            }


                        };

                        feature.setStyle(styleFunction);

                        metocLayer.getSource().addFeature(feature);
                    }
                }
            }

            /** Clear Layer **/
            NotifyService.subscribe(scope, WeatherEvents.ClearMetoc, function () {
                metocLayer.getSource().clear();

            });

            /** Clear Selection **/
            NotifyService.subscribe(scope, WeatherEvents.ClearMetocSelection, function () {
                selectedFeature = null;
                metocLayer.getSource().changed();
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(metocLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === metocLayer;
                            },
                            hitTolerance: 10
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                                return true;
                            }, {
                                layerFilter: function (layerCandidate) {
                                    return layerCandidate === metocLayer;
                                },
                                hitTolerance: 10
                            });

                            metocLayer.getSource().changed();
                            var forecast = selectedFeature.get('attributes').forecast;
                            NotifyService.notify(WeatherEvents.MetocSelected, forecast);
                            NotifyService.notify(OpenlayerEvents.ZoomToExtent, {
                                extent: OpenlayerService.getFeaturesExtent([selectedFeature]),
                                padding: [20, 20, 20, 20]
                            });

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
                    metocLayer.setVisible(true);
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
                    if (angular.isDefined(metocLayer)) {
                        map.removeLayer(metocLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, metocLayer.get('context'));
                metocLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, metocLayer.get('context'));
                newContext.active = true;
                metocLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, metocLayer.get('context'));
                newContext.active = false;
                metocLayer.set('context', newContext);
            }
        }
    }
})();