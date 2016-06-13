angular.module('vrmt.map')

    .directive('route', [function () {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {
                route: '='
            },
            link: function (scope, element, attrs, ctrl) {
                var route = angular.isDefined(scope.route.wps) ? scope.route : undefined ;
                var routeLayer;

                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {

                    // Clean up when the scope is destroyed
                    scope.$on('$destroy', function () {
                        if (angular.isDefined(routeLayer)) {
                            map.removeLayer(routeLayer);
                        }
                    });

                    var source = new ol.source.Vector();

                    routeLayer = new ol.layer.Vector({
                        source: source,
                        style: new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(94, 68, 64, 1)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#6c1507',
                                width: 2
                            }),
                            image: new ol.style.Circle({
                                radius: 4,
                                fill: new ol.style.Fill({
                                    color: '#6c1507'
                                })
                            })
                        })
                    });

                    scope.$watch("route", function (newRoute) {
                        if (angular.isDefined(newRoute)) {
                            addOrReplaceRoute(newRoute);
                        }
                    });

                    addOrReplaceRoute(route);

                    function addOrReplaceRoute(route) {
                        if (angular.isDefined(route)) {
                            source.clear();

                            var markers = [];
                            route.wps.forEach(function (wp) {
                                var m = ol.proj.transform([wp.longitude, wp.latitude], 'EPSG:4326', 'EPSG:3857');
                                markers.push(m);
                                var pointFeature = new ol.Feature({
                                    geometry: new ol.geom.Point(m)
                                });

                                source.addFeature(pointFeature);
                            });

                            // Create feature with linestring
                            var line = new ol.geom.LineString(markers, 'XY');
                            var feature = new ol.Feature({
                                geometry: line
                            });
                            source.addFeature(feature);
                        }
                    }

                    routeLayer.setVisible(true);
                    map.addLayer(routeLayer);
                })
            }
        };
    }])
    .directive('vessel', [function () {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {
                vessel: '='
            },
            link: function (scope, element, attrs, ctrl) {
                var vesselLayer = createVesselLayer();
                addOrReplaceVessel(scope.vessel);

                function createVesselLayer() {
                    return new ol.layer.Vector({
                        source: new ol.source.Vector(),
                        style: createVesselStyle()
                    });
                }

                function createVesselStyle() {
                    return new ol.style.Style({
                        image: new ol.style.Icon( ({
                            anchor: [0.85, 0.5],
                            opacity: 0.85,
                            src: 'img/vessel_purple.png'
                        }))
                    });
                }

                function addOrReplaceVessel(vessel) {
                    if (vessel && vessel.aisVessel) {
                        addOrReplaceVesselFeature(vessel.aisVessel.lat, vessel.aisVessel.lon);
                        updateStyle(((vessel.aisVessel.cog - 90) * (Math.PI / 180)));
                    }
                }

                function addOrReplaceVesselFeature(lat, lon) {
                    var source = vesselLayer.getSource();
                    source.clear();
                    var vesselFeature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'))
                    });

                    source.addFeature(vesselFeature);
                }

                function updateStyle(radian) {
                    vesselLayer.getStyle().getImage().setRotation(radian);
                }

                scope.$watch("vessel", function (newVessel) {
                    if (newVessel && newVessel.aisVessel) {
                        addOrReplaceVessel(newVessel);
                    }
                });

                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    map.addLayer(vesselLayer);

                    // Clean up when the scope is destroyed
                    scope.$on('$destroy', function () {
                        if (angular.isDefined(vesselLayer)) {
                            map.removeLayer(vesselLayer);
                        }
                    });
                })
            }
        };
    }])
    .directive('indexColor', [function () {
        return {
            restrict: 'E',
            template: "<span style='background-color: {{color}}; color: transparent'>aaa</span>",
            scope: {
                index: '='
            },
            link: function (scope) {
                scope.color = null;//calculateColorForIndex(scope.index);

                function calculateColorForIndex(index) {
                    if (index < 1000) {
                        return "green";
                    } else if (index > 2000) {
                        return "red";
                    } else {
                        return "yellow";
                    }
                }

                scope.$watch('index', function(newIndex) {
                    scope.color = calculateColorForIndex(newIndex);
                });
            }
        }
    }])
;