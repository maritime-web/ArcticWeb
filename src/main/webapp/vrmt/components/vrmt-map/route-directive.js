(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('route', route);

    function route() {
        var directive = {
            restrict: 'E',
            require: '^olMap',
            scope: {
                route: '=',
                assessmentLocationState: '='
            },
            link: link
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var route = angular.isDefined(scope.route.wps) ? scope.route : undefined;
            var routeLayer;

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(routeLayer)) {
                        map.removeLayer(routeLayer);
                    }
                    if (onMoveKey) {
                        map.unByKey(onMoveKey);
                    }
                    if (onclickKey) {
                        map.unByKey(onclickKey);
                    }
                });

                var source = new ol.source.Vector();

                routeLayer = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#FF0000',
                            width: 2,
                            lineDash: [5, 5, 0, 5]
                        }),
                        image: new ol.style.Circle({
                            radius: 4,
                            stroke: new ol.style.Stroke({
                                color: '#FF0000',
                                width: 1
                            })
                        })
                    })
                });

                scope.$watch("route", function (newRoute) {
                    if (newRoute && newRoute.wps) {
                        addOrReplaceRoute(newRoute);
                    }
                });

                function addOrReplaceRoute(route) {
                    source.clear();

                    var markers = [];
                    angular.forEach(route.wps, function (wp) {
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


                var onMoveKey = map.on('pointermove', function (e) {
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hit = map.hasFeatureAtPixel(pixel);

                    map.getTarget().style.cursor = hit ? 'pointer' : '';
                });

                var onclickKey = map.on('singleclick', function (e) {
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hitThis = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate === routeLayer;
                    });

                    var hitOther = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate !== routeLayer;
                    });

                    if (hitThis && !hitOther) {
                        var coord = ol.proj.toLonLat(map.getEventCoordinate(e.originalEvent));
                        scope.assessmentLocationState['new'] = {
                            route: {
                                lon: coord[0],
                                lat: coord[1]
                            }
                        };
                    }
                    scope.$apply();

                });

                routeLayer.setVisible(true);
                map.addLayer(routeLayer);
            })
        }
    }
})();