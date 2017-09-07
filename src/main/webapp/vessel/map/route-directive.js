(function () {
    'use strict';

    angular.module('embryo.vessel.map', ['embryo.geo.services', 'embryo.components.vessel']);

    angular
        .module('embryo.vessel.map')
        .directive('route', route);

    route.$inject = ['VesselService', 'Subject', 'RouteService', 'NotifyService', 'VesselEvents', 'OpenlayerEvents'];

    function route(VesselService, Subject, RouteService, NotifyService, VesselEvents, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link() {
            var scope = arguments[0];
            var ctrl = arguments[3];
            var myRouteLayer;
            var selectedRouteLayer;

            var myRouteSource = new ol.source.Vector();
            myRouteLayer = new ol.layer.Vector({
                title: 'My Route',
                source: myRouteSource
            });
            var selectedRouteSource = new ol.source.Vector();
            selectedRouteLayer = new ol.layer.Vector({
                title: 'Selected Route',
                source: selectedRouteSource
            });

            var myRouteOptions = {
                source: myRouteSource,
                routeColor: '#FF0000',
                arrowImg: 'img/arrow_red_route.svg'
            };

            var selectedRouteOptions = {
                source: selectedRouteSource,
                routeColor: '#3E7D1D',
                arrowImg: 'img/arrow_green_route.svg'
            };

            var myMmsi = Subject.getDetails().shipMmsi;

            if (myMmsi) {
                VesselService.subscribe(myMmsi, function (error, vesselDetails) {
                    if (!error) {
                        if (vesselDetails && vesselDetails.additionalInformation.routeId) {
                            RouteService.getRoute(vesselDetails.additionalInformation.routeId, function (route) {
                                myRouteOptions.source.clear();
                                addRoute(route, myRouteOptions);
                                myRouteLayer.setVisible(true);
                            });
                        } else {
                            myRouteLayer.setVisible(false);
                        }
                    }
                });
            }

            NotifyService.subscribe(scope, VesselEvents.HideRoute, hideSelected);

            function hideSelected() {
                selectedRouteLayer.setVisible(false);
            }

            NotifyService.subscribe(scope, VesselEvents.ShowRoute, function (event, routeId) {
                RouteService.getRoute(routeId, function (route) {
                    selectedRouteOptions.source.clear();
                    addRoute(route, selectedRouteOptions);
                    selectedRouteLayer.setVisible(true);
                });
            });

            NotifyService.subscribe(scope, VesselEvents.ShowRoutes, function (event, routes) {
                selectedRouteOptions.source.clear();
                routes.forEach(function (r) {
                    addRoute(r, selectedRouteOptions);
                });
                selectedRouteLayer.setVisible(true);
                NotifyService.notify(OpenlayerEvents.OpenlayerZoomToLayer, selectedRouteLayer)
            });

            NotifyService.subscribe(scope, VesselEvents.VesselFeatureActive, function () {
                myRouteLayer.setVisible(true);
            });
            NotifyService.subscribe(scope, VesselEvents.VesselFeatureInActive, function () {
                myRouteLayer.setVisible(false);
                selectedRouteLayer.setVisible(false);
            });

            function addRoute(route, options) {
                var source = options.source;
                source.addFeature(createRouteFeature());

                function createRouteFeature() {
                    /** @type {ol.geom.GeometryLayout|string} */
                    var xy = "XY";
                    var line = new ol.geom.LineString([], xy);
                    var feature = new ol.Feature();
                    angular.forEach(route.wps, function (wp) {
                        /** @type {ol.Coordinate|[]} */
                        var coord = [wp.longitude, wp.latitude];
                        var mercatorCoord = ol.proj.fromLonLat(coord, undefined);
                        line.appendCoordinate(mercatorCoord);
                    });

                    feature.setGeometry(line);
                    feature.set('routeColor', options.routeColor, true);
                    feature.set('arrowImg', options.arrowImg, true);
                    feature.setStyle(styleFunction);
                    feature.setId(route.id);
                    return feature;
                }

            }

            var styleFunction = function (feature, resolution) {
                var routeColor = feature.get('routeColor');
                var arrowImg = feature.get('arrowImg');
                var geometry = feature.getGeometry();
                var styles = [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: routeColor,
                            width: 2,
                            lineDash: [5, 5, 0, 5]
                        })
                    })
                ];

                geometry.forEachSegment(function (start, end) {
                    var dx = end[0] - start[0];
                    var dy = end[1] - start[1];
                    var rotation = Math.atan2(dy, dx);

                    var a = dy / dx;
                    var b = start[1] - a * start[0];
                    var middle = [start[0] + dx / 2.0];
                    middle[1] = a * middle[0] + b;

                    // arrows
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.Point(middle),
                        image: new ol.style.Icon({
                            src: arrowImg,
                            anchor: [0.75, 0.5],
                            rotateWithView: true,
                            rotation: -rotation,
                            imgSize: [10, 10]
                        })
                    }));
                });

                geometry.getCoordinates().forEach(function (coord) {
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.Point(coord),
                        image: new ol.style.Circle({
                            radius: 4,
                            stroke: new ol.style.Stroke({
                                color: routeColor,
                                width: 1
                            })
                        })
                    }));
                });

                return styles;
            };

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    onDestroy(map);
                });
                myRouteLayer.setVisible(true);
                map.addLayer(myRouteLayer);
                map.addLayer(selectedRouteLayer);
            });

            function onDestroy(map) {
                if (angular.isDefined(myRouteLayer)) {
                    map.removeLayer(myRouteLayer);
                }
                if (angular.isDefined(selectedRouteLayer)) {
                    map.removeLayer(selectedRouteLayer);
                }
            }
        }
    }
})();