(function () {
    'use strict';

    angular
        .module('embryo.ice')
        .directive('inshoreIceReportMap', inshoreIceReportMap);

    inshoreIceReportMap.$inject = ['IceEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents', '$timeout'];

    function inshoreIceReportMap(IceEvents, OpenlayerService, NotifyService, OpenlayerEvents, $timeout) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var source = new ol.source.Vector();
            var inshoreIceReportLayer = new ol.layer.Vector({
                title: 'Inshore Ice Report Layer',
                source: new ol.source.Cluster({
                    source: source,
                    distance: 40
                }),
                context: {
                    feature: 'Ice',
                    name: 'Inshore ice reports'
                }

            });

            inshoreIceReportLayer.setStyle(function (/** @type {ol.Feature}*/clusterFeature, resolution) {
                var features = clusterFeature.get('features');
                var styles = [];

                var isSelected = getIsSelected(clusterFeature);
                function getIsSelected(feature) {
                    var reportNumbers = extractNumbers(feature);
                    return reportNumbers.every(function (r) {
                        return selectedFeatureNumbers.includes(r);
                    });
                }

                var opacity = isSelected ? 1.0 : 0.25;
                var description = "";

                if (isSelected || resolution < 100) {
                    if (features.length > 1) {
                        description = features.length +" Inshore report locations"
                    } else {
                        var feature = features[0];
                        var iceDescription = feature.get('iceDescription');
                        description = iceDescription.Number + ": " + iceDescription.Placename;
                    }
                }

                styles.push(new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 0.5],
                        scale: isSelected ? 0.12 : 0.1,
                        src: 'img/inshoreIceReport.png',
                        opacity: opacity
                    }),
                    text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                        textAlign: 'center',
                        textBaseline: 'bottom',
                        offsetY: 27,
                        font: 'bold 10px Courier New, monospace',
                        text: description,
                        rotation: 0
                    })

                }));

                if (isSelected) {
                    styles.push(new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 0.5],
                            scale: 0.55,
                            src: 'img/ring.png',
                            opacity: 1
                        })
                    }));
                }
                return styles;
            });

            var selectedFeatureNumbers = [];

            /** Respond to report selection **/
            NotifyService.subscribe(scope, IceEvents.ShowInshoreReports, function (e, shapes) {
                update(shapes);
            });

            var numbersAdded = [];
            function update(shapes) {
                selectedFeatureNumbers = [];
                numbersAdded = [];
                inshoreIceReportLayer.getSource().clear();

                for (var l in shapes) {
                    var shape = shapes[l];
                    var ice = shape.fragments;
                    var fragments = ice.slice(0);
                    drawInshoreIceReport(fragments);
                }

                updateContext();

                function drawInshoreIceReport(fragments) {
                    for (var f in fragments) {
                        var desc = fragments[f].description;
                        var xy = OpenlayerService.fromLonLat([Number(desc.Longitude.replace(",", ".")), Number(desc.Latitude.replace(",", "."))]);
                        if (!numbersAdded.includes(desc.Number)) {
                            numbersAdded.push(desc.Number);

                            var feature = new ol.Feature({
                                geometry: new ol.geom.Point(xy),
                                iceDescription: desc,
                                number: desc.Number,
                                hasReport: desc.hasReport
                            });

                            source.addFeature(feature);

                        }
                    }
                }
            }

            /** Zoom to report and select it **/
            NotifyService.subscribe(scope, IceEvents.ZoomToReport, function (e, reportNumber) {
                source.forEachFeature(function (feature) {
                    if (Number(feature.get('number')) === Number(reportNumber)) {
                        var extent = feature.getGeometry().getExtent();
                        NotifyService.notify(OpenlayerEvents.ZoomToExtent, {extent: extent, minResolution: 50});
                        NotifyService.notify(IceEvents.InshoreReportsSelected, [Number(reportNumber)]);
                        selectedFeatureNumbers = [Number(reportNumber)];
                    }
                });
            });

            function extractNumbers(feature) {
                var features = feature.get('features');
                if (features) {
                    return features.map(function (f) {
                        return f.get('number');
                    });
                }
                return [];
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(inshoreIceReportLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {
                            layerFilter: function (layerCandidate) {
                                return layerCandidate === inshoreIceReportLayer;
                            }
                        });

                        if (hitThis) {
                            map.forEachFeatureAtPixel(pixel, function (feature) {
                                selectedFeatureNumbers = extractNumbers(feature);
                            }, {layerFilter: function (layerCandidate) {
                                return layerCandidate === inshoreIceReportLayer;
                            }});

                            inshoreIceReportLayer.getSource().changed();
                            NotifyService.notify(IceEvents.InshoreReportsSelected, selectedFeatureNumbers);
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
                    inshoreIceReportLayer.setVisible(true);
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
                    if (angular.isDefined(inshoreIceReportLayer)) {
                        map.removeLayer(inshoreIceReportLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, inshoreIceReportLayer.get('context'));
                inshoreIceReportLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, inshoreIceReportLayer.get('context'));
                newContext.active = true;
                inshoreIceReportLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, inshoreIceReportLayer.get('context'));
                newContext.active = false;
                inshoreIceReportLayer.set('context', newContext);
            }
        }
    }
})();