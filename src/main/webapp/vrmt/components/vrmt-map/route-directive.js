(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('route', route);

    route.$inject = ['NotifyService', 'Events'];
    function route(NotifyService, Events) {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: link
        };

        function link() {
            var scope = arguments[0];
            var ctrl = arguments[3];
            var route = null;
            NotifyService.subscribe(scope, Events.RouteChanged, addOrReplaceRoute);
            var routeLayer;
            var pointerInteraction;
            var snapInteraction;
            var vesselLocationFeatureId = "vessel";


            var source = new ol.source.Vector();
            routeLayer = new ol.layer.Vector({source: source});

            function addOrReplaceRoute() {
                route = new embryo.vrmt.Route(arguments[1]);
                source.clear();

                var routeFeature = createRouteFeature();
                angular.forEach(route.wps, function (wp) {
                    /** @type {ol.Coordinate|[]} */
                    var coord = [wp.longitude, wp.latitude];
                    var mercatorCoord = ol.proj.fromLonLat(coord, undefined);
                    routeFeature.getGeometry().appendCoordinate(mercatorCoord);
                    source.addFeature(createWaypointFeature(mercatorCoord));
                });

                var vesselLocationFeature = createVesselLocationFeature();

                source.addFeature(vesselLocationFeature);
                source.addFeature(routeFeature);
                updateExpectedVesselLocation();
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

            function createVesselLocationFeature() {
                var style = new ol.style.Style(/** @type {olx.style.StyleOptions}*/{
                    image: new ol.style.Icon({
                        anchor: [0.5, 0.5],
                        opacity: 0.80,
                        src: 'img/vessel_gray.png',
                        color: 'black',
                        snapToPixel: false

                    }),
                    text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                        textAlign: 'start',
                        font: 'bold 12px Arial',
                        text: 'Expected vessel position',
                        fill: new ol.style.Fill({color: 'black'}),
                        stroke: new ol.style.Stroke({color: 'white', width: 3}),
                        offsetX: 10,
                        offsetY: -9,
                        rotation: 0
                    })
                });
                style.getImage().setOpacity(0.7);
                /** @type {ol.Coordinate|[]} */
                var dummyCoord = [0,0];
                var feature = new ol.Feature();
                feature.setId(vesselLocationFeatureId);

                feature.setGeometry(new ol.geom.Point(dummyCoord));
                feature.setStyle(style);
                return feature;
            }

            function updateExpectedVesselLocation() {
                var vesselLocationFeature = source.getFeatureById(vesselLocationFeatureId);
                var vesselPos = route.getExpectedVesselPosition();
                var styleText = vesselLocationFeature.getStyle().getText();
                var vesselCoord = null;
                if (vesselPos) {
                    styleText.setText('Expected vessel position ['+formatLatLon({lon: vesselPos[0], lat: vesselPos[1]}, 0, true)+']');
                    vesselCoord = ol.proj.fromLonLat(vesselPos, undefined);
                } else {
                    styleText.setText('Vessel is not on route');
                    vesselCoord = ol.proj.fromLonLat(route.getStartPosition(), undefined);
                }
                vesselLocationFeature.getGeometry().setCoordinates(vesselCoord);
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
                        var coord = ol.proj.toLonLat(e.coordinate, undefined);
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