(function () {
    'use strict';

    angular
        .module('embryo.forecast')
        .directive('forecastMap', forecastMap);

    forecastMap.$inject = ['ForecastEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents'];

    function forecastMap(ForecastEvents, OpenlayerService, NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var forecastLayer = new ol.layer.Vector({
                title: 'Forecast Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Forecasts',
                    name: 'Forecast'
                }
            });

            var selectedFeature;

            NotifyService.subscribe(scope, ForecastEvents.ShowCurrent, function (e, data) {
                update(data, drawCurrentForecast);
            });
            NotifyService.subscribe(scope, ForecastEvents.ShowIce, function (e, data) {
                update(data, drawIceForecast);
            });
            NotifyService.subscribe(scope, ForecastEvents.ShowWaves, function (e, data) {
                update(data, drawWaveForecast);
            });

            function update(data, drawForecastFunction) {
                var forecast = data.forecast;
                var time = data.time;
                var mapType = data.mapType;

                selectedFeature = undefined;
                forecastLayer.getSource().clear();
                drawFrame();

                drawForecastFunction(forecast, time, mapType);

                updateContext();

                function drawFrame() {
                    var bounds = getBounds();
                    var half = 0.2;

                    var feature = new ol.Feature({
                        geometry: OpenlayerService.createPolygon(
                            [
                                [bounds.minLon, bounds.minLat - half],
                                [bounds.minLon, bounds.maxLat + half],
                                [bounds.maxLon, bounds.maxLat + half],
                                [bounds.maxLon, bounds.minLat - half],
                                // [bounds.minLon, bounds.minLat - half]
                            ])

                    });
                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({color: '#333333', width: 1})
                    }));
                    forecastLayer.getSource().addFeature(feature);
                    // NotifyService.notify(OpenlayerEvents.ZoomToExtent, {extent: OpenlayerService.getFeaturesExtent(forecastLayer.getSource().getFeatures())});

                    function getBounds() {
                        var lats = forecast.metadata.lat;
                        var lons = forecast.metadata.lon;
                        var minLat = lats[0];
                        var maxLat = lats[lats.length - 1];
                        var minLon = lons[0];
                        var maxLon = lons[lons.length - 1];

                        return {
                            minLat : minLat,
                            maxLat : maxLat,
                            minLon : minLon,
                            maxLon : maxLon
                        };
                    }
                }
            }

            var drawIceForecast = function (forecast, time, mapType) {
                switch (mapType) {
                    case 'iceConcentration':
                        drawConcentration(forecast, time);
                        break;
                    case 'iceThickness':
                        drawThickness(forecast, time);
                        break;
                    case 'iceSpeed':
                        drawSpeed(forecast, time);
                        break;
                    case 'iceAccretion':
                        drawAccretion(forecast, time);
                        break;
                }

                function drawConcentration() {
                    var index = forecast.variables['Ice concentration'];
                    var lats = forecast.metadata.lat;
                    var lons = forecast.metadata.lon;
                    var half = 0.2;

                    var entries = forecast.data[time].entries;

                    for ( var e in entries) {
                        var obs = entries[e][index];
                        var level = getIceConcentrationLevel(obs);
                        var lat = lats[e.substr(0, e.indexOf('_'))];
                        var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];

                        if (obs && lon && lat) {
                            forecastLayer.getSource().addFeature(new ol.Feature({geometry: OpenlayerService.createPolygon(
                                [
                                    [lon - half, lat - half],
                                    [lon + half, lat - half],
                                    [lon + half, lat + half],
                                    [lon - half, lat + half]
                                ]),
                                level: level,
                                obs: obs
                            }));
                        }
                    }

                    function getIceConcentrationLevel(obs) {
                        if (obs < 0.1) {
                            return '#96c7ff';
                        } else if (obs < 0.3) {
                            return '#8effa0';
                        } else if (obs < 0.6) {
                            return '#ffff00';
                        } else if (obs < 0.8) {
                            return '#ff7c06';
                        } else if (obs < 1) {
                            return '#ff0000';
                        } else {
                            return '#979797';
                        }
                    }
                }

                function drawThickness() {
                    var index = forecast.variables['Ice thickness'];
                    var lats = forecast.metadata.lat;
                    var lons = forecast.metadata.lon;
                    var half = 0.2;

                    var entries = forecast.data[time].entries;

                    for ( var e in entries) {
                        var obs = entries[e][index];
                        var level = getIceThicknessLevel(obs);
                        var lat = lats[e.substr(0, e.indexOf('_'))];
                        var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];

                        if (obs && lon && lat) {
                            forecastLayer.getSource().addFeature(new ol.Feature(
                                {geometry: OpenlayerService.createPolygon(
                                [
                                    [lon - half, lat - half],
                                    [lon + half, lat - half],
                                    [lon + half, lat + half],
                                    [lon - half, lat + half]
                                ]),
                                level: level,
                                obs: obs
                            }));
                        }
                    }

                    function getIceThicknessLevel(obs) {
                        if (obs < 0.1) {
                            return '#96c7ff';
                        } else if (obs < 0.3) {
                            return '#8effa0';
                        } else if (obs < 0.5) {
                            return '#ffff00';
                        } else if (obs < 1) {
                            return '#ff7c06';
                        } else if (obs < 2) {
                            return '#ff0000';
                        } else {
                            return '#979797';
                        }
                    }
                }

                function drawSpeed() {
                    var indexEast = forecast.variables['Ice speed east'];
                    var indexNorth = forecast.variables['Ice speed north'];
                    var lats = forecast.metadata.lat;
                    var lons = forecast.metadata.lon;
                    var half = 0.1;

                    var entries = forecast.data[time].entries;

                    for ( var e in entries) {
                        var east = entries[e][indexEast];
                        var north = entries[e][indexNorth];
                        if (east || north) {
                            var speed = Math.sqrt(north * north + east * east);
                            var level = getSpeedLevel(speed);
                            var lat = lats[e.substr(0, e.indexOf('_'))];
                            var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];

                            var col = level.slice(1);

                            var rad = Math.atan2(north, east);

                            forecastLayer.getSource().addFeature(new ol.Feature({
                                geometry: OpenlayerService.createPoint([lon, lat]),
                                level : level,
                                obs: east + '/' + north,
                                angle: rad,
                                col: col
                            }));
                        }
                    }

                    function getSpeedLevel(obs) {
                        if (obs < 0.1) {
                            return '#96c7ff';
                        } else if (obs < 0.3) {
                            return '#8effa0';
                        } else if (obs < 0.5) {
                            return '#ffff00';
                        } else if (obs < 1) {
                            return '#ff7c06';
                        } else if (obs < 2) {
                            return '#ff0000';
                        } else {
                            return '#979797';
                        }
                    }
                }

                function drawAccretion() {
                    var index = forecast.variables['Ice accretion risk'];
                    var lats = forecast.metadata.lat;
                    var lons = forecast.metadata.lon;
                    var half = 0.2;

                    var entries = forecast.data[time].entries;

                    for ( var e in entries) {
                        var obs = entries[e][index];
                        var level = getIceAccretionLevel(obs);
                        var lat = lats[e.substr(0, e.indexOf('_'))];
                        var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];

                        if (obs && lon && lat) {
                            forecastLayer.getSource().addFeature(new ol.Feature({geometry: OpenlayerService.createPolygon(
                                [
                                    [lon - half, lat - half],
                                    [lon + half, lat - half],
                                    [lon + half, lat + half],
                                    [lon - half, lat + half]
                                ]),
                                level: level,
                                obs: obs
                            }));
                        }
                    }

                    function getIceAccretionLevel(obs) {
                        if (obs < 0) {
                            return '#96c7ff';
                        } else if (obs < 22.5) {
                            return '#8effa0';
                        } else if (obs < 53.4) {
                            return '#ffff00';
                        } else if (obs < 83.1) {
                            return '#ff7c06';
                        } else {
                            return '#979797';
                        }
                    }
                }

            };

            var drawWaveForecast = function (forecast, time, provider) {
                var vars = forecast.variables;
                var lats = forecast.metadata.lat;
                var lons = forecast.metadata.lon;

                var indexHeight = vars['Significant wave height'];
                var indexDirection = vars['Mean wave direction'];
                var indexPeriod = vars['Mean wave period'];

                var entries = forecast.data[time].entries;

                for ( var e in entries) {
                    var height = entries[e][indexHeight];
                    var direction = entries[e][indexDirection];
                    var period = entries[e][indexPeriod];

                    if (direction) {
                        var lat = lats[e.substr(0, e.indexOf('_'))];
                        var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];
                        var level = getWaveHeightLevel(height);

                        var col = level.slice(1);

                        forecastLayer.getSource().addFeature(new ol.Feature({
                            geometry: OpenlayerService.createPoint([lon, lat]),
                            level : level,
                            obs: height + '/' + period,
                            col: col,
                            angle: direction + (provider === 'FCOO' ? 0 : Math.PI)
                        }));
                    }
                }

                function getWaveHeightLevel(obs) {
                    if (obs < 2) {
                        return '#96c7ff';
                    } else if (obs < 4) {
                        return '#8effa0';
                    } else if (obs < 6) {
                        return '#ffff00';
                    } else if (obs < 8) {
                        return '#ff7c06';
                    } else if (obs < 10) {
                        return '#ff0000';
                    } else {
                        return '#979797';
                    }
                }
            };

            var drawCurrentForecast = function (forecast, time) {
                var indexEast = forecast.variables['Current east'];
                var indexNorth = forecast.variables['Current north'];
                var lats = forecast.metadata.lat;
                var lons = forecast.metadata.lon;
                var half = 0.1;

                var entries = forecast.data[time].entries;

                for ( var e in entries) {
                    var east = entries[e][indexEast];
                    var north = entries[e][indexNorth];
                    if (east || north) {
                        var speed = Math.sqrt(north * north + east * east);
                        var level = getSpeedLevel(speed);
                        var lat = lats[e.substr(0, e.indexOf('_'))];
                        var lon = lons[e.substr(e.indexOf('_') + 1, e.length - 1)];

                        var col = level.slice(1);

                        var rad = Math.atan2(north, east);

                        forecastLayer.getSource().addFeature(new ol.Feature({
                            geometry: OpenlayerService.createPoint([lon, lat]),
                            level : level,
                            obs: Number(speed).toPrecision(2),
                            angle: rad,
                            col: col
                        }));
                    }
                }

                function getSpeedLevel(obs) {
                    if (obs < 0.1) {
                        return '#96c7ff';
                    } else if (obs < 0.3) {
                        return '#8effa0';
                    } else if (obs < 0.5) {
                        return '#ffff00';
                    } else if (obs < 1) {
                        return '#ff7c06';
                    } else if (obs < 2) {
                        return '#ff0000';
                    } else {
                        return '#979797';
                    }
                }
            };

            var styleFunction = function (feature, resolution) {
                var level = feature.get("level");
                var obs = feature.get("obs");
                var angle = feature.get("angle");
                var col = feature.get("col");
                var active = forecastLayer.get('context').active;

                var styles = [];

                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({color: '#333333', width: getStrokeWidth()}),
                    fill: new ol.style.Fill({
                        color: level
                    })

                }));

                if (col) {
                    var imgSrc = 'img/forecast/arrow_'+col+'.png';
                    var opacity = active ? 0.5 : 0.25;
                    if (feature === selectedFeature) {
                        opacity = 1.0;
                    }
                    styles.push(new ol.style.Style({
                            image: new ol.style.Icon(({
                                anchor: [0.5, 0.5],
                                opacity: opacity,
                                src: imgSrc,
                                rotation: getRotation(),
                                scale: getArrowScale()
                            }))
                        })
                    );
                }

                if (feature === selectedFeature) {
                    var description = obs + (angle ? ':' + toDegrees(angle) : '');
                    styles.push(new ol.style.Style({
                        text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                            textAlign: 'start',
                            font: 'bold 10px Courier New, monospace',
                            text: description,
                            offsetX: getOffsetX(description),
                            offsetY: getOffsetY(),
                            rotation: 0
                        })
                    }));

                    if (col) {
                        styles.push(new ol.style.Style({
                                image: new ol.style.Icon(({
                                    anchor: [0.5, 0.5],
                                    src: 'img/ring.png',
                                    scale: getSelectionScale()
                                }))
                            })
                        );
                    }
                }

                return styles;

                function getStrokeWidth() {
                    if (feature === selectedFeature) {
                        return 3;
                    }
                    return 1;
                }

                function getOffsetX(text) {
                    var length = String(text).length;
                    if (length < 8) {
                        return -15;
                    }
                    if (length < 12) {
                        return -20;
                    }
                    if (length < 15) {
                        return -35;
                    }
                    if (length < 18) {
                        return -37;
                    }
                    return -42;
                }

                function getOffsetY() {
                    var offset = 10;
                    if (resolution < 4000) {
                        offset = 30;
                    }
                    return offset;
                }

                function getSelectionScale() {
                    var scale = 0.4;
                    if (resolution < 4000) {
                        scale = 0.45;
                    }
                    if (resolution < 2500) {
                        scale = 0.55;
                    }
                    if (resolution < 1300) {
                        scale = 0.65;
                    }
                    if (resolution < 900) {
                        scale = 0.69;
                    }
                    return scale;
                }

                function getArrowScale() {
                    var scale = 0.07;
                    if (resolution < 4000) {
                        scale = 0.09;
                    }
                    if (resolution < 2500) {
                        scale = 0.12;
                    }
                    if (resolution < 1300) {
                        scale = 0.14;
                    }
                    if (resolution < 900) {
                        scale = 0.17;
                    }
                    if (resolution < 800) {
                        scale = 0.18;
                    }
                    if (resolution < 700) {
                        scale = 0.19;
                    }
                    if (resolution < 600) {
                        scale = 0.20;
                    }
                    if (resolution < 500) {
                        scale = 0.21;
                    }
                    if (resolution < 300) {
                        scale = 0.22;
                    }
                    return scale;
                }

                function getRotation() {
                    return angle ? angle : 0;
                }

                function toDegrees(radians) {
                    return Math.round(Number(radians) * (180/Math.PI));
                }
            };

            forecastLayer.setStyle(styleFunction);

            /** Clear currently shown forecast **/
            NotifyService.subscribe(scope, ForecastEvents.ClearForecasts, function () {
                forecastLayer.getSource().clear();
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(forecastLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === forecastLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                                return true;
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === forecastLayer;
                            }});

                            forecastLayer.getSource().changed();
                        }
                        scope.$apply();
                    });
                }

                if (NotifyService.hasOccurred(ForecastEvents.ForecastFeatureActive)) {
                    createClickListener();
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, ForecastEvents.ForecastFeatureActive, function () {
                    if (!onClickKey) {
                        createClickListener();
                    }
                    updateContextToActive();
                    forecastLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, ForecastEvents.ForecastFeatureInActive, function () {
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                        onClickKey = null;
                    }
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(forecastLayer)) {
                        map.removeLayer(forecastLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, forecastLayer.get('context'));
                forecastLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, forecastLayer.get('context'));
                newContext.active = true;
                forecastLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, forecastLayer.get('context'));
                newContext.active = false;
                forecastLayer.set('context', newContext);
            }
        }
    }
})();