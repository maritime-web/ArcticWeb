(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('vessel', vessel);

    vessel.$inject = ['VesselService', 'Subject', 'OpenlayerService', 'NotifyService', 'Events'];

    function vessel(VesselService, Subject, OpenlayerService, NotifyService, Events) {
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

            NotifyService.subscribe(scope, Events.VesselsLoaded, function () {
                vessels = VesselService.getLatest();
                myMmsi = Subject.getDetails().shipMmsi;
                console.log('MY MMSI: ' + myMmsi);
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
                    {zoom: 1, size: 22.5},
                    {zoom: 2, size: 12.5},
                    {zoom: 3, size: 7.5},
                    {zoom: 4, size: 2.5},
                    {zoom: 5, size: 1.7},
                    {zoom: 6, size: 1.00},
                    {zoom: 7, size: 0.50},
                    {zoom: 8, size: 0.3},
                    {zoom: 9, size: 0.15},
                    {zoom: 10, size: 0.075},
                    {zoom: 11, size: 0.004},
                    {zoom: 12, size: 0.002},
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
                                    if (vessel.inAW) {
                                        vesselLayer.getSource().addFeature(createAwFeature(vessel));
                                    }
                                    if (Number(vessel.mmsi) === Number(clickedMmsi)) {
                                        vesselLayer.getSource().addFeature(createClickedFeature(vessel));
                                    }
                                    if (Number(vessel.mmsi) === Number(myMmsi)) {
                                        console.log('Adding my ship feature');
                                        vesselLayer.getSource().addFeature(createMyShipFeature(vessel));
                                    }
                                }
                            });
                        } else {
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
                            vesselLayer.getSource().addFeature(cellFeature);
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
                        vesselFeature.set("type", "vessel", true);

                        var vesselStyleCache = {};
                        var vesselScales = {4: 0.5, 5: 0.55, 6: 0.6, 7: 0.7, 8: 0.8, 9: 0.85, 10: 0.9, 11: 0.9, 12: 0.9, 13: 0.9};
                        var vesselStyleFunction = function () {
                            var style = vesselStyleCache[zoom];
                            if (!style) {
                                style = new ol.style.Style();
                                var props = imageAndTypeTextForVessel(vessel);

                                var image = new ol.style.Icon(({
                                    anchor: [0.85, 0.5],
                                    opacity: 0.85,
                                    src: 'img/' + props.name,
                                    rotation: (vessel.angle - 90) * (Math.PI / 180)
                                }));

                                image.setScale(vesselScales[zoom] ? vesselScales[zoom] : 1.0);
                                style.setImage(image);

                                vesselStyleCache[zoom] = style;
                            }

                            return style;
                        };

                        vesselFeature.setStyle(vesselStyleFunction);
                        return vesselFeature;
                    }

                    function createAwFeature(vessel) {
                        var lat = vessel.y;
                        var lon = vessel.x;
                        var awFeature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([lon, lat]))
                        });

                        var styleCache = {};
                        var scales = {4: 0.2, 5: 0.20, 6: 0.2, 7: 0.25, 8: 0.3, 9: 0.35, 10: 0.35, 11: 0.4, 12: 0.4, 13: 0.45};
                        var awStyleFunction = function () {
                            var style = styleCache[zoom];
                            if (!style) {
                                style = new ol.style.Style({
                                    image: new ol.style.Icon(({
                                        anchor: [0.6, 1.5],
                                        anchorOrigin: 'top-left',
                                        opacity: 0.85,
                                        src: 'img/aw-logo.png',
                                        rotation: 0,
                                        scale: scales[zoom] ? scales[zoom] : 0.5
                                    }))
                                });
                                styleCache[zoom] = style;
                            }
                            return style;
                        };
                        awFeature.setStyle(awStyleFunction);
                        awFeature.set('type', 'AW', true);
                        return awFeature;
                    }

                    function createClickedFeature(vessel) {
                        var lat = vessel.y;
                        var lon = vessel.x;
                        var clickedFeature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([lon, lat]))
                        });

                        var styleCache = {};
                        var scales = {4: 0.6, 5: 0.7, 6: 0.8, 7: 0.9, 8: 1.0, 9: 1.1, 10: 1.2, 11: 1.3, 12: 1.4, 13: 1.5};
                        var clickedStyleFunction = function () {
                            var style = styleCache[zoom];
                            if (!style) {
                                style = new ol.style.Style({
                                    image: new ol.style.Icon(({
                                        anchor: [0.7, 0.5],
                                        opacity: 1.0,
                                        src: 'img/selection.png',
                                        rotation: (vessel.angle - 90) * (Math.PI / 180),
                                        scale: scales[zoom] ? scales[zoom] : 1.3
                                    }))
                                });
                                styleCache[zoom] = style;
                            }
                            return style;
                        };
                        clickedFeature.setStyle(clickedStyleFunction);
                        clickedFeature.setId('Clicked');
                        return clickedFeature;
                    }

                    function createMyShipFeature(vessel) {
                        var lat = vessel.y;
                        var lon = vessel.x;
                        var vesselFeature = new ol.Feature({
                            geometry: new ol.geom.Point(OpenlayerService.fromLonLat([lon, lat]))
                        });
                        vesselFeature.setId('myVessel');

                        vesselFeature.set("vessel", vessel, true);
                        vesselFeature.set("type", "myVessel", true);

                        var vesselStyleCache = {};
                        var vesselScales = {4: 0.5, 5: 0.55, 6: 0.6, 7: 0.7, 8: 0.8, 9: 0.85, 10: 0.9, 11: 0.9, 12: 0.9, 13: 0.9};
                        var vesselStyleFunction = function () {
                            var style = vesselStyleCache[zoom];
                            if (!style) {
                                style = new ol.style.Style();
                                var image = new ol.style.Icon(({
                                    anchor: [0.7, 0.6],
                                    opacity: 0.85,
                                    src: 'img/green_marker.png',
                                    rotation: 0
                                }));

                                image.setScale(vesselScales[zoom] ? vesselScales[zoom] : 1.0);
                                style.setImage(image);

                                vesselStyleCache[zoom] = style;
                            }

                            return style;
                        };

                        vesselFeature.setStyle(vesselStyleFunction);
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

            NotifyService.subscribe(scope, Events.VesselSelected, onVesselChosen);

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
                    var hitThis = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate === vesselLayer;
                    });

                    if (hitThis) {
                        var feature = vesselLayer.getSource().getClosestFeatureToCoordinate(e.coordinate);
                        var vessel = feature.get('vessel');
                        clickedMmsi = vessel.mmsi;
                        replaceVessels();
                        NotifyService.notify(Events.VesselClicked, vessel);
                    }
                    scope.$apply();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(vesselLayer)) {
                        map.removeLayer(vesselLayer);
                    }
                    if (onclickKey) {
                        map.unByKey(onclickKey);
                    }
                    if (resolutionHandle && map.getView()) {
                        map.getView().unByKey(resolutionHandle);
                    }
                });
            })
        }
    }
})();