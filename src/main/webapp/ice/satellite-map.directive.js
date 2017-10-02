(function () {
    'use strict';

    angular
        .module('embryo.ice')
        .directive('satelliteMap', satelliteMap);

    satelliteMap.$inject = ['IceEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents', '$timeout'];

    function satelliteMap(IceEvents, OpenlayerService, NotifyService, OpenlayerEvents, $timeout) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var satelliteBoundingBoxLayer = new ol.layer.Vector({
                title: 'Satellite Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Ice',
                    name: 'Satellite images'
                }
            });

            var tileSource = new ol.source.OSM();
            var tileLayer = new ol.layer.Tile({
                source: tileSource
            });

            var selectedFeature;

            /** Respond to satellite map selection **/
            NotifyService.subscribe(scope, IceEvents.ShowSatelliteMapTiles, function (e, tileSet) {
                update(tileSet);
            });

            function update(tileSet) {
                satelliteBoundingBoxLayer.getSource().clear();

                updateUrl();
                drawBoundingbox();

                updateContext();

                function updateUrl() {
                    var url = tileSet.url;
                    if (url && url.indexOf("{z}/{x}/{y}.png") < 0) {
                        if (url.lastIndexOf("/") !== (url.length - 1)) {
                            url += "/";
                        }
                        url += "{z}/{x}/{y}.png";
                    }
                    tileSource.setUrl(url);
                    tileLayer.setVisible(true);
                }

                function drawBoundingbox() {
                    var feature = createBoundingboxFeature(tileSet);

                    var styleFunction = function (feature, resolution) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 128, 0, 0.6)',
                                    width: 1
                                })
                            })
                        ];
                    };
                    feature.setStyle(styleFunction);

                    satelliteBoundingBoxLayer.getSource().addFeature(feature);
                }
            }

            var createBoundingboxFeature = function (tileSet) {
                var points = [];
                for (var j in tileSet.area) {
                    points.push(/** @type {ol.Coordinate|[]} */OpenlayerService.fromLonLat([Number(tileSet.area[j].lon), Number(tileSet.area[j].lat)]));
                }
                var ring = [points];

                return new ol.Feature({
                    geometry: new ol.geom.Polygon(ring)
                });
            };

            /** Show bounding boxes **/
            NotifyService.subscribe(scope, IceEvents.ShowSatelliteMapBoundingBoxes, function (e, tileSets) {
                satelliteBoundingBoxLayer.getSource().clear();

                for (var index in tileSets) {
                    var tileSet = tileSets[index];
                    if (tileSet.area) {
                        var feature = createBoundingboxFeature(tileSet);
                        var styleFunction = function (feature, resolution) {
                            var fillColor = 'rgba(128, 0, 128, 0.1)';
                            var strokeColor = 'rgba(128, 0, 128, 0.3)';
                            if (feature === selectedFeature) {
                                fillColor = 'rgba(0, 128, 0, 0.1)';
                                strokeColor = 'rgba(0, 128, 0, 0.3)';
                            }
                            return [
                                new ol.style.Style({
                                    fill: new ol.style.Fill({
                                        color: fillColor
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: strokeColor,
                                        width: 1
                                    })
                                })
                            ];
                        };

                        feature.setStyle(styleFunction);
                        satelliteBoundingBoxLayer.getSource().addFeature(feature);
                    }
                }
            });

            NotifyService.subscribe(scope, IceEvents.HideSatelliteMapBoundingBoxes, function () {
                satelliteBoundingBoxLayer.setVisible(false);
            });

            NotifyService.subscribe(scope, IceEvents.ZoomToSatelliteMap, function () {
                NotifyService.notify(OpenlayerEvents.ZoomToLayer, satelliteBoundingBoxLayer)
            });

            /** Hide currently shown satellite map **/
            NotifyService.subscribe(scope, IceEvents.HideSatelliteMapTiles, function () {
                satelliteBoundingBoxLayer.getSource().clear();
                tileLayer.setVisible(false);
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(satelliteBoundingBoxLayer);
                map.addLayer(tileLayer);
                tileLayer.setVisible(false);

                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === satelliteBoundingBoxLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === satelliteBoundingBoxLayer;
                            }});

                            satelliteBoundingBoxLayer.getSource().changed();
                            var tileSet = selectedFeature.get('tileSet');
                            NotifyService.notify(IceEvents.TileSetAreaSelected, tileSet);
                        }
                        scope.$apply();
                    });
                }

                if (NotifyService.hasOccurred(IceEvents.IceFeatureActive)) {
                    createClickListener();
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, IceEvents.IceFeatureActive, function () {
                    if (!onClickKey) {
                        createClickListener();
                    }
                    updateContextToActive();
                    satelliteBoundingBoxLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, IceEvents.IceFeatureInActive, function () {
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                        onClickKey = null;
                    }
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(satelliteBoundingBoxLayer)) {
                        map.removeLayer(satelliteBoundingBoxLayer);
                    }
                    if (angular.isDefined(tileLayer)) {
                        map.removeLayer(tileLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, satelliteBoundingBoxLayer.get('context'));
                satelliteBoundingBoxLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, satelliteBoundingBoxLayer.get('context'));
                newContext.active = true;
                satelliteBoundingBoxLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, satelliteBoundingBoxLayer.get('context'));
                newContext.active = false;
                satelliteBoundingBoxLayer.set('context', newContext);
            }
        }
    }
})();