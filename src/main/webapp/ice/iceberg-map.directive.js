(function () {
    'use strict';

    angular
        .module('embryo.ice')
        .directive('icebergMap', icebergMap);

    icebergMap.$inject = ['IceEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents'];

    function icebergMap(IceEvents, OpenlayerService, NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var icebergLayer = new ol.layer.Vector({
                title: 'Iceberg Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Ice',
                    name: 'Iceberg'
                }

            });

            var selectedFeature;

            /** Respond to chart selection **/
            NotifyService.subscribe(scope, IceEvents.ShowIcebergs, function (e, shapes) {
                update(shapes);
            });

            function update(shapes) {
                selectedFeature = undefined;
                icebergLayer.getSource().clear();

                for (var l in shapes) {
                    var shape = shapes[l];
                    var ice = shape.fragments;
                    var fragments = ice.slice(0);

                    drawPoints(shape, fragments);
                }

                updateContext();

                function drawPoints(shape, fragments) {
                    for (var f in fragments) {
                        var desc = fragments[f].description;
                        var feature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([Number(desc.Long), Number(desc.Lat)])),
                            iceDescription: Object.assign({}, desc, {type: 'iceberg'}, {information: shape.information})
                        });

                        var styleFunction = function (feature, resolution) {
                            var desc = feature.get('iceDescription');
                            var scales = new Map();
                            scales.set("S", 0.1);
                            scales.set("M", 0.2);
                            scales.set("L", 0.3);
                            scales.set("VL", 0.5);

                            var scaleFactor = 1;
                            if (resolution < 2000) {
                                scaleFactor = 1.1;
                            }
                            if (resolution < 1000) {
                                scaleFactor = 1.2;
                            }
                            if (resolution < 500) {
                                scaleFactor = 1.6;
                            }
                            if (resolution < 200) {
                                scaleFactor = 2.0;
                            }

                            var strokeColor = "rgba(0, 0, 0, 0.2)";
                            var opacity = 0.4;
                            if (feature === selectedFeature) {
                                strokeColor = "rgba(0, 0, 0, 1.0)";
                                opacity = 1.0;
                            }

                            return [
                                new ol.style.Style({
                                    image: new ol.style.Icon({
                                        anchor: [0.5, 0.5],
                                        scale: scales.get(desc.Size_Catg) * scaleFactor,
                                        src: 'img/iceberg.png',
                                        opacity: opacity
                                    }),
                                    stroke: new ol.style.Stroke({color: strokeColor, width: 3})
                                })
                            ];
                        };

                        feature.setStyle(styleFunction);
                        icebergLayer.getSource().addFeature(feature);
                    }
                }
            }

            /** Zoom to currently shown icebergs **/
            NotifyService.subscribe(scope, IceEvents.ZoomToIceberg, function () {
                NotifyService.notify(OpenlayerEvents.ZoomToLayer, icebergLayer)
            });

            /** Hide currently shown icebergs **/
            NotifyService.subscribe(scope, IceEvents.HideIcebergs, function () {
                icebergLayer.getSource().clear();
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(icebergLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === icebergLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === icebergLayer;
                            }});

                            icebergLayer.getSource().changed();
                            var iceDescription = selectedFeature.get('iceDescription');
                            NotifyService.notify(IceEvents.IcebergSelected, iceDescription);
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
                    icebergLayer.setVisible(true);
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
                    if (angular.isDefined(icebergLayer)) {
                        map.removeLayer(icebergLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, icebergLayer.get('context'));
                icebergLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, icebergLayer.get('context'));
                newContext.active = true;
                icebergLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, icebergLayer.get('context'));
                newContext.active = false;
                icebergLayer.set('context', newContext);
            }
        }
    }
})();