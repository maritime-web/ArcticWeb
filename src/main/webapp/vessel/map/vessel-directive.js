(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('vessel', vessel);

    vessel.$inject = ['VesselService', 'Subject', 'OpenlayerService', 'NotifyService', 'VesselEvents', 'OpenLayerStyleFactory'];

    function vessel(VesselService, Subject, OpenlayerService, NotifyService, VesselEvents, OpenLayerStyleFactory) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var vesselLayer = new ol.layer.Vector({
                title: 'Vessels',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Vessel',
                    name: 'Vessels'
                }
            });
            var clusterLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                context: {
                    feature: 'Vessel',
                    name: 'Clusters'
                }
            });
            var resolution;
            var viewExtent;
            var vessels = null;
            var clickedMmsi = null;
            var myMmsi = null;

            NotifyService.subscribe(scope, VesselEvents.VesselsLoaded, function () {
                vessels = VesselService.getLatest();
                myMmsi = Subject.getDetails().shipMmsi;
                replaceVessels();
                updateContext();
            });

            function replaceVessels() {
                if (vessels) {
                    vesselLayer.getSource().clear();
                    clusterLayer.getSource().clear();

                    createClusterFeatures(vessels);
                    vesselLayer.getSource().refresh();
                    clusterLayer.getSource().refresh();
                }

                function createClusterFeatures(vessels) {
                    var myVessel;
                    var newcells = new Map();
                    var size = resolution * 40;//40px cluster boxes
                    vessels.forEach(function (v) {
                        if (v.mmsi === myMmsi) {
                            myVessel = v;
                        }
                        var p = OpenlayerService.createPoint([v.x, v.y]);
                        var coord = p.getCoordinates();
                        var x = coord[0];
                        var y = coord[1];
                        var cellCoordX = Math.floor(x / size);
                        var cellCoordY = Math.floor(y / size);
                        var key = 'x' + cellCoordX + 'y' + cellCoordY;
                        if (!newcells.get(key)) {
                            newcells.set(key, {
                                count: 0,
                                vessels: [],
                                bottomLeftCoord: [cellCoordX * size, cellCoordY * size]
                            });
                        }
                        var cell = newcells.get(key);
                        cell.count++;
                        cell.vessels.push(v);
                    });

                    var vesselsInClusters = [];
                    newcells.forEach(function (cell) {
                        if (cell.count > 40) {
                            vesselsInClusters = vesselsInClusters.concat(cell.vessels);
                            clusterLayer.getSource().addFeature(createClusterFeature(cell));
                        } else {
                            cell.vessels.forEach(function (v) {
                                vesselLayer.getSource().addFeature(createVesselFeature(v));
                            })
                        }
                    });

                    if (!vesselLayer.getSource().getFeatureById(myMmsi) && myVessel) {
                        vesselLayer.getSource().addFeature(createVesselFeature(myVessel));
                    }

                    function createClusterFeature(cell) {
                        var a = cell.bottomLeftCoord;
                        var b = [a[0], a[1] + size];
                        var c = [a[0] + size, a[1] + size];
                        var d = [a[0] + size, a[1]];
                        var f = new ol.Feature({
                            geometry: new ol.geom.Polygon([[a, b, c, d, a]])
                        });

                        f.setStyle(new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: getColor()
                            }),
                            text: new ol.style.Text({
                                text: cell.count + '',
                                fill: new ol.style.Fill({
                                    color: '#fff'
                                })
                            })
                        }));

                        return f;

                        function getColor() {
                            if (cell.count < 50) {
                                return "rgba(255,221,0,0.3)";// Yellow
                            } else if (cell.count < 250) {
                                return "rgba(255,136,0,0.3)";// Orange
                            } else if (cell.count < 500) {
                                return "rgba(255,0,0,0.3)";// Red
                            } else {
                                return "rgba(255,0,255,0.3)"// Purple
                            }
                        }
                    }

                    function createVesselFeature(vessel) {
                        var lat = vessel.y;
                        var lon = vessel.x;
                        var vesselFeature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([lon, lat]))
                        });
                        vesselFeature.setId(vessel.mmsi);
                        vesselFeature.set("vessel", vessel, true);

                        vesselFeature.setStyle(OpenLayerStyleFactory.createVesselStyleFunction(myMmsi, clickedMmsi));
                        return vesselFeature;
                    }
                }
            }

            function panToVessel(vessel) {

                olScope.getMap().then(function (map) {
                    var feature = vesselLayer.getSource().getFeatureById(vessel.mmsi);
                    var view = map.getView();
                    var featureExtent = feature.getGeometry().getExtent();
                    var mapExtent = view.calculateExtent(map.getSize());
                    if (!ol.extent.containsExtent(mapExtent, featureExtent)) {
                        view.fit(feature.getGeometry(), {size: map.getSize(), maxZoom: 8});
                    }
                });
            }

            NotifyService.subscribe(scope, VesselEvents.VesselSelected, onVesselChosen);

            function onVesselChosen(e, vessel) {
                vessels = VesselService.getLatest();
                clickedMmsi = vessel.mmsi;
                replaceVessels();
                panToVessel(vessel);
            }

            var onclickKey = null;

            function createVesselClickListener(map) {
                onclickKey = map.on('singleclick', function (e) {
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hitThis = map.hasFeatureAtPixel(pixel, {
                        layerFilter: function (layerCandidate) {
                            return layerCandidate === vesselLayer;
                        }
                    });

                    if (hitThis) {
                        var feature = vesselLayer.getSource().getClosestFeatureToCoordinate(e.coordinate);
                        var vessel = feature.get('vessel');
                        clickedMmsi = vessel.mmsi;
                        replaceVessels();
                        NotifyService.notify(VesselEvents.VesselClicked, vessel);
                    }
                    scope.$apply();
                });
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                resolution = map.getView().getResolution();
                viewExtent = map.getView().calculateExtent();
                map.addLayer(vesselLayer);
                map.addLayer(clusterLayer);

                var resolutionHandle = map.getView().on(['change:resolution'], function (e) {
                    var view = e.target;
                    resolution = view.getResolution();
                    viewExtent = view.calculateExtent();
                    replaceVessels();
                });

                if (NotifyService.hasOccurred(VesselEvents.VesselFeatureActive)) {
                    createVesselClickListener(map);
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, VesselEvents.VesselFeatureActive, function () {
                    if (!onclickKey) {
                        createVesselClickListener(map);
                    }
                    updateContextToActive();
                    vesselLayer.setVisible(true);
                });
                NotifyService.subscribe(scope, VesselEvents.VesselFeatureInActive, function () {
                    if (onclickKey) {
                        ol.Observable.unByKey(onclickKey);
                        onclickKey = null;
                    }
                    clickedMmsi = null;
                    replaceVessels();
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(vesselLayer)) {
                        map.removeLayer(vesselLayer);
                    }
                    if (angular.isDefined(clusterLayer)) {
                        map.removeLayer(clusterLayer);
                    }
                    if (onclickKey) {
                        ol.Observable.unByKey(onclickKey);
                    }
                    if (resolutionHandle && map.getView()) {
                        ol.Observable.unByKey(resolutionHandle);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, vesselLayer.get('context'));
                vesselLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, vesselLayer.get('context'));
                newContext.active = true;
                vesselLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, vesselLayer.get('context'));
                newContext.active = false;
                vesselLayer.set('context', newContext);
            }
        }
    }
})();