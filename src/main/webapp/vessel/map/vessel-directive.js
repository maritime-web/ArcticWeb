(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('vessel', vessel);

    vessel.$inject = ['VesselService', 'Subject', 'OpenlayerService', 'NotifyService', 'VesselEvents'];

    function vessel(VesselService, Subject, OpenlayerService, NotifyService, VesselEvents) {
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
            });

            function createVesselLayer() {
                return new ol.layer.Vector({
                    source: new ol.source.Vector()
                });
            }

            /** Returns the image and type text for the given vessel **/
            function imageAndTypeTextForVessel(vo) {
                var colorName;
                var vesselType;
                switch (vo.type) {
                    case "0" :
                        colorName = "blue";
                        vesselType = "Passenger";
                        break;
                    case "1" :
                        colorName = "gray";
                        vesselType = "Undefined / unknown";
                        break;
                    case "2" :
                        colorName = "green";
                        vesselType = "Cargo";
                        break;
                    case "3" :
                        colorName = "orange";
                        vesselType = "Fishing";
                        break;
                    case "4" :
                        colorName = "purple";
                        vesselType = "Sailing and pleasure";
                        break;
                    case "5" :
                        colorName = "red";
                        vesselType = "Tanker";
                        break;
                    case "6" :
                        colorName = "turquoise";
                        vesselType = "Pilot, tug and others";
                        break;
                    case "7" :
                        colorName = "yellow";
                        vesselType = "High speed craft and WIG";
                        break;
                    default :
                        colorName = "gray";
                        vesselType = "Undefined / unknown";
                }

                if (vo.moored) {
                    return {
                        name: "vessel_" + colorName + "_moored.png",
                        type: vesselType,
                        width: 12,
                        height: 12,
                        xOffset: -6,
                        yOffset: -6
                    };
                } else {
                    return {
                        name: "vessel_" + colorName + ".png",
                        type: vesselType,
                        width: 20,
                        height: 10,
                        xOffset: -10,
                        yOffset: -5
                    };
                }
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

                    var vesselScales = [
                        {resolution: 200, scale: 1.0},
                        {resolution: 500, scale: 0.95},
                        {resolution: 800, scale: 0.9},
                        {resolution: 1200, scale: 0.85},
                        {resolution: 1900, scale: 0.75},
                        {resolution: 4000, scale: 0.7},
                        {resolution: 6000, scale: 0.65},
                        {resolution: 8000, scale: 0.6},
                        {resolution: 14000, scale: 0.55},
                        {resolution: 16000, scale: 0.5},
                        {resolution: 18500, scale: 0.45}
                    ];

                    function createVesselFeature(vessel) {
                        var lat = vessel.y;
                        var lon = vessel.x;
                        var vesselFeature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([lon, lat]))
                        });
                        vesselFeature.setId(vessel.mmsi);
                        vesselFeature.set("vessel", vessel, true);

                        var vesselStyleFunction = function (feature, resolution) {

                            var vesselScale = getVesselScale();
                            var vessel = feature.get('vessel');
                            var styles = [];

                            function getVesselScale() {
                                for (var index in vesselScales) {
                                    if (vesselScales[index].resolution >= resolution) {
                                        return vesselScales[index].scale;
                                    }
                                }

                                return vesselScales[vesselScales.length - 1].scale;
                            }

                            var props = imageAndTypeTextForVessel(vessel);
                            styles.push(new ol.style.Style({
                                image: new ol.style.Icon(({
                                    anchor: [0.5, 0.5],
                                    opacity: 0.85,
                                    src: 'img/' + props.name,
                                    rotation: (vessel.angle - 90) * (Math.PI / 180),
                                    scale: vesselScale
                                }))
                            }));

                            if (vessel.inAW) {
                                styles.push(new ol.style.Style({
                                    image: new ol.style.Icon(({
                                        anchor: [0.5, 1.25],
                                        anchorOrigin: 'bottom-left',
                                        opacity: 0.85,
                                        src: 'img/aw-logo.png',
                                        rotation: 0,
                                        scale: vesselScale * 0.4
                                    }))
                                }));
                            }

                            if (Number(vessel.mmsi) === Number(clickedMmsi)) {
                                styles.push(new ol.style.Style({
                                    image: new ol.style.Icon(({
                                        anchor: [0.5, 0.5],
                                        opacity: 1.0,
                                        src: 'img/selection.png',
                                        rotation: (vessel.angle - 90) * (Math.PI / 180),
                                        scale: vesselScale
                                    }))
                                }))
                            }

                            if (Number(vessel.mmsi) === Number(myMmsi)) {
                                styles.push(new ol.style.Style({
                                    image: new ol.style.Icon(({
                                        anchor: [0.5, 0.5],
                                        opacity: 0.85,
                                        src: 'img/green_marker.png',
                                        rotation: 0,
                                        scale: vesselScale * 1.0
                                    }))
                                }));
                            }

                            return styles;
                        };

                        vesselFeature.setStyle(vesselStyleFunction);
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

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(vesselLayer);

                var resolutionHandle = map.getView().on('change:resolution', function () {
                    replaceVessels();
                });

                var onclickKey = map.on('singleclick', function (e) {
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
            })
        }
    }
})();