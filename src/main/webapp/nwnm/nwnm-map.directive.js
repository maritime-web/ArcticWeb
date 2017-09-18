(function () {
    'use strict';

    angular
        .module('embryo.nwnm')
        .directive('nwnmMap', nwnmMap);

    nwnmMap.$inject = ['NWNMEvents', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents'];

    function nwnmMap(NWNMEvents, OpenlayerService, NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var selectedMsg;
            var nwnmLayer = new ol.layer.Vector({
                title: 'NWNM Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Maritime Safety',
                    name: 'NW/NM'
                }

            });

            NotifyService.subscribe(scope, NWNMEvents.MessagesUpdated, function (e, messages) {
                update(messages);
            });

            function update(messages) {
                nwnmLayer.getSource().clear();

                for (var i in messages) {
                    angular.forEach(messages[i].jsonFeatures, function (geoJsonFeatureCollection) {
                        var featureCollection = OpenlayerService.geoJsonCollectionToOlFeatures(geoJsonFeatureCollection);

                        angular.forEach(featureCollection, function (feature) {
                            addMessageFeature(feature, messages[i]);
                        });

                        if (showFeatureCenter(featureCollection)) {
                            var center = OpenlayerService.getFeaturesCenter(featureCollection);
                            var feature = new ol.Feature({geometry: new ol.geom.Point(center)});
                            addMessageFeature(feature, messages[i]);
                        }
                    });
                }
                updateContext();
            }

            function addMessageFeature(feature, message) {
                feature.set('message', message, true);
                nwnmLayer.getSource().addFeature(feature);
            }

            /** Returns if the feature center point should be displayed **/
            function showFeatureCenter(features) {
                // Don't show center point for details maps
                if (!features || features.length === 0 || scope.detailsMap) {
                    return false;
                }

                // Check if the list of features contain any non-point geometries
                for (var x = 0; x < features.length; x++) {
                    var g = features[x].getGeometry();
                    if (g && g.getType() !== 'Point' && g.getType() !== 'MultiPoint') {
                        return true;
                    }
                }
                return false;
            }


            var styleFunction = function (feature, resolution) {
                var message = feature.get('message');
                var isSelected = selectedMsg && selectedMsg.id === message.id;
                var img = 'img/nwnm/nm.png';
                var fillColor = new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.2)' });
                var selectedFill = new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.8)' });
                var stroke = new ol.style.Stroke({ color: '#8B008B', width: 1 });
                var selectedStroke = new ol.style.Stroke({ color: '#8B008B', width: 3 });

                if (message.mainType === 'NW') {
                    img = 'img/nwnm/nw.png';
                    fillColor = new ol.style.Fill({color: 'rgba(255, 255, 255, 0.3)'});
                    selectedFill = new ol.style.Fill({color: 'rgba(255, 255, 255, 0.8)'});
                    stroke = new ol.style.Stroke({ color: '#8B008B', width: 2 });
                    selectedStroke = new ol.style.Stroke({ color: '#8B008B', width: 4 });
                }

                var styles = [
                    new ol.style.Style({
                        fill: fillColor,
                        stroke: stroke,
                        image: new ol.style.Icon({
                            anchor: [0.5, 0.5],
                            scale: isSelected ? 0.4 : 0.3,
                            src: img
                        })
                    })
                ];

                if (isSelected) {
                    styles.push(
                        new ol.style.Style({
                            fill: selectedFill,
                            stroke: selectedStroke,
                            image: new ol.style.Icon({
                                anchor: [0.5, 0.5],
                                scale: 0.5,
                                src: 'img/ring.png'
                            })
                        })
                    )
                }
                return styles;
            };

            nwnmLayer.setStyle(styleFunction);

            /** Respond to area selection **/
            NotifyService.subscribe(scope, NWNMEvents.AreaChosen, function (e, areaMrn) {
                centerMapOnArea(areaMrn);
            });

            function centerMapOnArea(areaMrn) {
                var areaCenters = [];
                areaCenters["urn:mrn:iho:country:dk"] = {lonLat: OpenlayerService.fromLonLat([11, 55]), resolution: 1200};
                areaCenters["urn:mrn:iho:country:gl"] = {lonLat: OpenlayerService.fromLonLat([-44, 69]), resolution: 10000};
                areaCenters["urn:mrn:iho:country:fo"] = {lonLat: OpenlayerService.fromLonLat([-6, 62]), resolution: 500};

                var arg = areaCenters[areaMrn];
                if (!arg) {
                    console.log("Don't know center for " + areaMrn);
                    arg = {lonLat: OpenlayerService.fromLonLat([11, 55]), resolution: 12000};
                }

                NotifyService.notify(OpenlayerEvents.ZoomAndCenter, {resolution: arg.resolution, center: arg.lonLat})
            }

            /** Respond to message selection **/
            NotifyService.subscribe(scope, NWNMEvents.MessageSelected, function (e, msg) {
                selectedMsg = msg;
                var collection = [];
                nwnmLayer.getSource().forEachFeature(function (feature) {
                    var message = feature.get('message');
                    if (selectedMsg && message && selectedMsg.id === message.id) {
                        collection.push(feature);
                    }
                });
                if (collection.length > 0) {
                    var extent = OpenlayerService.getFeaturesExtent(collection);
                    NotifyService.notify(OpenlayerEvents.ZoomToExtent, extent)
                }

            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(nwnmLayer);
                var onClickKey;

                function createClickListener() {
                    onClickKey = map.on('singleclick', function (e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hitThis = map.hasFeatureAtPixel(pixel, {layerFilter : function (layerCandidate) {
                            return layerCandidate === nwnmLayer;
                        }});

                        if (hitThis) {
                            var feature = nwnmLayer.getSource().getClosestFeatureToCoordinate(e.coordinate);
                            var message = feature.get('message');
                            NotifyService.notify(NWNMEvents.MessageSelected, message);
                        }
                        scope.$apply();
                    });
                }

                if (NotifyService.hasOccurred(NWNMEvents.NWNMFeatureActive)) {
                    createClickListener();
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, NWNMEvents.NWNMFeatureActive, function () {
                    if (!onClickKey) {
                        createClickListener();
                    }
                    updateContextToActive();
                    nwnmLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, NWNMEvents.NWNMFeatureInActive, function () {
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                        onClickKey = null;
                    }
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(nwnmLayer)) {
                        map.removeLayer(nwnmLayer);
                    }
                    if (onClickKey) {
                        ol.Observable.unByKey(onClickKey);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, nwnmLayer.get('context'));
                nwnmLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, nwnmLayer.get('context'));
                newContext.active = true;
                nwnmLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, nwnmLayer.get('context'));
                newContext.active = false;
                nwnmLayer.set('context', newContext);
            }
        }
    }
})();