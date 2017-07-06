(function () {
    'use strict';

    angular.module('embryo.vessel.map', ['embryo.geo.services']);

    angular
        .module('embryo.vessel.map')
        .directive('route', route);

    route.$inject = ['VesselService', 'Subject', 'RouteService', 'NotifyService', 'VesselEvents'];
    function route(VesselService, Subject, RouteService, NotifyService, VesselEvents) {
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
            myRouteLayer = new ol.layer.Vector({source: myRouteSource});
            var selectedRouteSource = new ol.source.Vector();
            selectedRouteLayer = new ol.layer.Vector({source: selectedRouteSource});

            var myMmsi = Subject.getDetails().shipMmsi;

            VesselService.subscribe(myMmsi, function (error, vesselDetails) {
                if (!error) {

                    if (vesselDetails && vesselDetails.additionalInformation.routeId) {
                        RouteService.getRoute(vesselDetails.additionalInformation.routeId, function(route) {
                            addOrReplaceRoute(route, true);
                            myRouteLayer.setVisible(true);
                        });
                    } else {
                        myRouteLayer.setVisible(false);
                    }
                }
            });

            NotifyService.subscribe(scope, VesselEvents.HideRoute, hideSelected);
            function hideSelected() {
                selectedRouteLayer.setVisible(false);
            }

            NotifyService.subscribe(scope, VesselEvents.ShowRoute, function (event, routeId) {
                RouteService.getRoute(routeId, function(route) {
                    addOrReplaceRoute(route, false);
                    selectedRouteLayer.setVisible(true);
                });
            });

            function addOrReplaceRoute(route, isMyRoute) {
                var source = isMyRoute ? myRouteSource : selectedRouteSource;
                source.clear();
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
                    feature.set('routeColor', isMyRoute ? '#FF0000' : '#3E7D1D', true);
                    feature.set('arrowImg', isMyRoute ? 'img/arrow_red_route.svg' : 'img/arrow_green_route.svg', true);
                    feature.setStyle(styleFunction);

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

                geometry.forEachSegment(function(start, end) {
                    var dx = end[0] - start[0];
                    var dy = end[1] - start[1];
                    var rotation = Math.atan2(dy, dx);

                    var a = dy / dx;
                    var b = start[1] - a*start[0];
                    var middle = [start[0] + dx/2.0];
                    middle[1] = a*middle[0] + b;

                    // arrows
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.Point(middle),
                        image: new ol.style.Icon({
                            src: arrowImg,
                            anchor: [0.75, 0.5],
                            rotateWithView: true,
                            rotation: -rotation
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