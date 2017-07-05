(function () {
    'use strict';

    angular.module('embryo.vessel.map', ['embryo.geo.services']);

    angular
        .module('embryo.vessel.map')
        .directive('route', route);

    route.$inject = ['VesselService', 'Subject', 'RouteService'];
    function route(VesselService, Subject, RouteService) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link() {
            var scope = arguments[0];
            var ctrl = arguments[3];
            var routeLayer;

            var source = new ol.source.Vector();
            routeLayer = new ol.layer.Vector({source: source});

            var mmsi = Subject.getDetails().shipMmsi;

            VesselService.subscribe(mmsi, function (error, vesselDetails) {
                if (!error) {
                    embryo.vessel.setMarkedVessel(mmsi);

                    if (vesselDetails && vesselDetails.additionalInformation.routeId) {
                        RouteService.getRoute(vesselDetails.additionalInformation.routeId, function(route) {
                            route.active = true;
                            route.own = true;
                            addOrReplaceRoute(route);
                            routeLayer.setVisible(true);
                        });
                    } else {
                        routeLayer.setVisible(false);
                    }
                }
            });


            function addOrReplaceRoute(route) {
                source.clear();

                var routeFeature = createRouteFeature();
                angular.forEach(route.wps, function (wp) {
                    /** @type {ol.Coordinate|[]} */
                    var coord = [wp.longitude, wp.latitude];
                    var mercatorCoord = ol.proj.fromLonLat(coord, undefined);
                    routeFeature.getGeometry().appendCoordinate(mercatorCoord);
                    source.addFeature(createWaypointFeature(mercatorCoord));
                });

                source.addFeature(routeFeature);
            }

            function createRouteFeature() {
                /** @type {ol.geom.GeometryLayout|string} */
                var xy = "XY";
                var line = new ol.geom.LineString([], xy);
                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#FF0000',
                        width: 2,
                        lineDash: [5, 5, 0, 5]
                    })
                });
                var feature = new ol.Feature();
                feature.setGeometry(line);
                feature.setStyle(style);
                return feature;
            }

            function createWaypointFeature(mercatorCoord) {
                var style = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4,
                        stroke: new ol.style.Stroke({
                            color: '#FF0000',
                            width: 1
                        })
                    })
                });

                var feature = new ol.Feature();
                feature.setGeometry(new ol.geom.Point(mercatorCoord));
                feature.setStyle(style);
                return feature
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    onDestroy(map);
                });
                routeLayer.setVisible(true);
                map.addLayer(routeLayer);
            });

            function onDestroy(map) {
                if (angular.isDefined(routeLayer)) {
                    map.removeLayer(routeLayer);
                }
            }
        }
    }
})();