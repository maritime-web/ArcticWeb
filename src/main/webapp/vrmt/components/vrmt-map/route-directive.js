(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('route', route);

    route.$inject = ['NotifyService', 'Events'];
    function route(NotifyService, Events) {
        var directive = {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: link
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            NotifyService.subscribe(scope, Events.RouteChanged, addOrReplaceRoute);
            var routeLayer;
            var pointerInteraction;
            var snapInteraction;


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

            function addOrReplaceRoute(event, route) {
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


            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    onDestroy(map);
                });

                addPointerInteraction(map);

                //snap after other interactions in order for its map browser event handlers
                // to be fired first. It's handlers are responsible of doing the snapping.
                addSnapInteraction(map);
                routeLayer.setVisible(true);
                map.addLayer(routeLayer);
            });

            function addPointerInteraction(map) {
                pointerInteraction = new ol.interaction.Pointer({handleEvent: function (e) {

                    var pixel =  e.pixel;
                    var hitThis = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate === routeLayer;
                    });

                    var hitOther = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate !== routeLayer;
                    });

                    if (hitThis && !hitOther && e.type == "singleclick") {
                        var coord = ol.proj.toLonLat(e.coordinate);
                        NotifyService.notify(Events.AddRouteLocation, {
                            route: {
                                lon: coord[0],
                                lat: coord[1]
                            }
                        });
                    }

                    map.getTarget().style.cursor = hitThis ? 'pointer' : '';

                    scope.$apply();
                    return true;
                }});
                map.addInteraction(pointerInteraction);
            }

            function addSnapInteraction(map) {
                snapInteraction = new ol.interaction.Snap({source: source});
                map.addInteraction(snapInteraction);
            }

            function onDestroy(map) {
                if (angular.isDefined(routeLayer)) {
                    map.removeLayer(routeLayer);
                }
                if (angular.isDefined(snapInteraction)) {
                    map.removeInteraction(snapInteraction);
                }
                if (angular.isDefined(pointerInteraction)) {
                    map.removeInteraction(pointerInteraction);
                }
            }
        }
    }
})();