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
            var vesselLayer = createVesselLayer();
            var vessels = null;
            var clickedMmsi = null;
            var myMmsi = null;

            NotifyService.subscribe(scope, VesselEvents.VesselsLoaded, function () {
                vessels = VesselService.getLatest();
                myMmsi = Subject.getDetails().shipMmsi;
                replaceVessels();
                updateContext();
            });

            function createVesselLayer() {
                return new ol.layer.Vector({
                    title: 'Vessels',
                    source: new ol.source.Vector(),
                    context: {
                        feature: 'Vessel',
                        name: 'Vessels'
                    }
                });
            }

            function replaceVessels() {
                if (vessels) {
                    var source = vesselLayer.getSource();
                    source.clear();

                    olScope.getMap().then(function (map) {
                        var zoom = map.getView().getZoom();
                        createClusterFeatures(vessels, zoom);
                    });
                }

                var clusterColors = [
                    {color: "rgba(255,221,0,0.3)", densityLimit: 0.0, countLimit: 0},	// Yellow
                    {color: "rgba(255,136,0,0.3)", densityLimit: 0.00125, countLimit: 50},	// Orange
                    {color: "rgba(255,0,0,0.3)", densityLimit: 0.004, countLimit: 250},	// Red
                    {color: "rgba(255,0,255,0.3)", densityLimit: 0.008, countLimit: 1000}	// Purple
                ];

                /**
                 * Finds the color of a cluster based on density.
                 */
                function findClusterColor(cell) {
                    for (var i = clusterColors.length - 1; i >= 0; i--) {
                        if (cell.getDensity() >= clusterColors[i].densityLimit) {
                            return new ol.style.Fill({color: clusterColors[i].color});
                        }
                    }

                    return new ol.style.Fill({color: "#000000"});
                }

                var clusterSizes = [
                    {zoom: 0, size: 4.5},
                    {zoom: 1, size: 4.5},
                    {zoom: 2, size: 4.1},
                    {zoom: 3, size: 3.9},
                    {zoom: 4, size: 3.5},
                    {zoom: 5, size: 2.7},
                    {zoom: 6, size: 1.1},
                    {zoom: 7, size: 0.60},
                    {zoom: 8, size: 0.4},
                    {zoom: 9, size: 0.2},
                    {zoom: 10, size: 0.1},
                    {zoom: 11, size: 0.05},
                    {zoom: 12, size: 0.025},
                    {zoom: 13, size: 0.005},
                    {zoom: 14, size: 0.0025}
                ];

                function getClusterSize(zoom) {
                    for (var index in clusterSizes) {
                        if (clusterSizes[index].zoom >= zoom) {
                            return clusterSizes[index].size;
                        }
                    }

                    return clusterSizes[clusterSizes.length - 1].size;
                }

                function createClusterFeatures(vessels, zoom) {
                    var size = getClusterSize(zoom);
                    var grid = new Grid(size);
                    var cluster = new Cluster(vessels, grid, 40);
                    var cells = cluster.getCells();

                    angular.forEach(cells, function (cell) {
                        if (cell.items && cell.items.length > 0) {
                            angular.forEach(cell.items, function (vessel) {
                                if (vessel.type) {
                                    vesselLayer.getSource().addFeature(createVesselFeature(vessel));
                                }
                            });
                        } else {
                            vesselLayer.getSource().addFeature(createCreateClusterFeature(cell));
                        }
                    });

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

                    function createCreateClusterFeature(cell) {
                        var points = [];
                        points.push(OpenlayerService.fromLonLat([cell.from.lon, cell.from.lat]));
                        points.push(OpenlayerService.fromLonLat([cell.to.lon, cell.from.lat]));
                        points.push(OpenlayerService.fromLonLat([cell.to.lon, cell.to.lat]));
                        points.push(OpenlayerService.fromLonLat([cell.from.lon, cell.to.lat]));
                        points.push(OpenlayerService.fromLonLat([cell.from.lon, cell.from.lat]));

                        var cellFeature = new ol.Feature({
                            geometry: new ol.geom.Polygon([points])
                        });
                        cellFeature.set('type', 'cluster', true);
                        cellFeature.setStyle(new ol.style.Style({
                            fill: findClusterColor(cell),
                            text: new ol.style.Text({
                                text: cell.count + '',
                                fill: new ol.style.Fill({
                                    color: '#fff'
                                })
                            })
                        }));
                        return cellFeature;
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
                    var hitThis = map.hasFeatureAtPixel(pixel, {layerFilter : function (layerCandidate) {
                        return layerCandidate === vesselLayer;
                    }});

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
                map.addLayer(vesselLayer);

                var resolutionHandle = map.getView().on('change:resolution', function () {
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