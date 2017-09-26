(function () {
    'use strict';

    angular
        .module('embryo.ice')
        .directive('iceChartMap', iceChartMap);

    iceChartMap.$inject = ['IceEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents', '$timeout'];

    function iceChartMap(IceEvents, OpenlayerService, NotifyService, OpenlayerEvents, $timeout) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var iceLayer = new ol.layer.Vector({
                title: 'Ice Chart Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Ice',
                    name: 'Ice chart'
                }

            });

            var selectedFeature;

            /** Respond to chart selection **/
            NotifyService.subscribe(scope, IceEvents.ShowChart, function (e, shapes) {
                update(shapes);
            });

            var waterCount = 0;

            function update(shapes) {
                selectedFeature = undefined;
                iceLayer.getSource().clear();
                waterCount = 0;

                for (var l in shapes) {
                    var shape = shapes[l];
                    var ice = shape.fragments;
                    var fragments = ice.slice(0);

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

                    //TODO rewrite to avoid jquery
                    var iceDesc = $.extend(fragment.description, {
                        information: shape.information,
                        type: 'iceChart'
                    });

                    var description = "";

                    var feature = new ol.Feature({
                        geometry: new ol.geom.Polygon(rings)
                    });

                    if (fragment.description.POLY_TYPE === 'W') {
                        description = waterCount === 0 ? shape.description.id : "";
                        // modify description to make sure we show it is open water
                        iceDesc.CT = "1";
                        waterCount++;
                    }

                    feature.set('iceDescription', iceDesc, true);

                    var styleFunction = function (feature, resolution) {
                        var strokeColor = "rgba(0, 0, 0, 0.2)";
                        if (feature === selectedFeature) {
                            strokeColor = "rgba(0, 0, 0, 1.0)";
                        }
                        return [
                            new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: colorByDescription(fragment.description)
                                }),
                                stroke: new ol.style.Stroke({color: strokeColor, width: 1}),
                                text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                                    textAlign: 'start',
                                    font: '12px Courier New, monospace',
                                    text: description,
                                    rotation: 0
                                })
                            })
                        ];
                    };

                    feature.setStyle(styleFunction);

                    iceLayer.getSource().addFeature(feature);
                }

                function drawFragments(shape, fragments) {
                    if (fragments.length > 0) {
                        var fragment = fragments.pop();

                        drawFragment(shape, fragment);

                        drawFragments(shape, fragments);
                    }
                }

                function colorByDescription(description) {

                    if (description.CT == 92 && parseInt(description.FA) == 8) {
                        return "#979797";
                    } else if (description.CT == 79 || description.CT > 80)
                        return "#ff0000";
                    if (description.CT == 57 || description.CT > 60)
                        return "#ff7c06";
                    if (description.CT == 24 || description.CT > 30)
                        return "#ffff00";
                    if (description.CT >= 10)
                        return "#8effa0";
                    return "#96C7FF";
                }
            }

            /** Zoom to currently shown chart **/
            NotifyService.subscribe(scope, IceEvents.ZoomToChart, function () {
                NotifyService.notify(OpenlayerEvents.ZoomToLayer, iceLayer)
            });

            /** Hide currently shown chart **/
            NotifyService.subscribe(scope, IceEvents.HideChart, function () {
                iceLayer.getSource().clear();
            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(iceLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === iceLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeature = feature;
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === iceLayer;
                            }});

                            iceLayer.getSource().changed();
                            var iceDescription = selectedFeature.get('iceDescription');
                            NotifyService.notify(IceEvents.ObservationSelected, iceDescription);
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
                    iceLayer.setVisible(true);
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
                    if (angular.isDefined(iceLayer)) {
                        map.removeLayer(iceLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, iceLayer.get('context'));
                iceLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, iceLayer.get('context'));
                newContext.active = true;
                iceLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, iceLayer.get('context'));
                newContext.active = false;
                iceLayer.set('context', newContext);
            }
        }
    }
})();