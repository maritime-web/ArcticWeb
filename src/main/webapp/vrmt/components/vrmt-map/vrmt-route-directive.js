(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('vrmtRoute', route);

    route.$inject = ['NotifyService', 'VrmtEvents', 'RouteFactory', 'Route', 'OpenlayerService', 'OpenLayerStyleFactory', 'FeatureName'];
    function route(NotifyService, VrmtEvents, RouteFactory, Route, OpenlayerService, OpenLayerStyleFactory, FeatureName) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link() {
            var scope = arguments[0];
            var ctrl = arguments[3];
            var route = null;
            NotifyService.subscribe(scope, VrmtEvents.RouteChanged, addOrReplaceRoute);
            var routeLayer;
            var pointerInteraction;
            var snapInteraction;
            var vesselLocationFeatureId = "vessel";


            var source = new ol.source.Vector();
            routeLayer = new ol.layer.Vector({
                title: 'VRMT Route',
                source: source,
                context: {
                    feature: FeatureName,
                    name: 'Route'
                }

            });
            routeLayer.set("Feature", "VRMT");

            function addOrReplaceRoute() {
                route = RouteFactory.create(arguments[1]);
                var r = Route.build(arguments[1]);
                source.clear();

                var routeFeature = new ol.Feature();
                routeFeature.setGeometry(OpenlayerService.createLineString(r.createRoutePoints()));
                routeFeature.set('routeColor', '#FF0000', true);
                routeFeature.set('arrowImg', 'img/arrow_red_route.svg', true);
                routeFeature.setStyle(OpenLayerStyleFactory.createRouteStyleFunction());

                var vesselLocationFeature = createVesselLocationFeature();

                source.addFeature(vesselLocationFeature);
                source.addFeature(routeFeature);
                updateExpectedVesselLocation();
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
                var style = vesselLocationFeature.getStyle();
                var styleText = style.getText();
                var vesselCoord = null;
                if (vesselPos) {
                    styleText.setText('Expected vessel position ['+formatLatLon(vesselPos, 0, true)+']');
                    vesselCoord = ol.proj.fromLonLat(vesselPos.asLonLatArray(), undefined);
                    style.getImage().setRotation(route.getBearingAt(moment().utc()) - Math.PI/2);
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

                NotifyService.subscribe(scope, VrmtEvents.VRMTFeatureActive, function () {
                    if (!pointerInteraction) {
                        addPointerInteraction(map);
                    }
                    if (!snapInteraction) {
                        addSnapInteraction(map);
                    }
                    routeLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, VrmtEvents.VRMTFeatureInActive, function () {
                    if (pointerInteraction) {
                        map.removeInteraction(pointerInteraction);
                        pointerInteraction = undefined;
                    }
                    if (snapInteraction) {
                        map.removeInteraction(snapInteraction);
                        snapInteraction = undefined;
                    }
                    routeLayer.setVisible(false);
                });

                if (NotifyService.hasOccurred(VrmtEvents.VRMTFeatureActive)) {
                    addPointerInteraction(map);

                    //snap after other interactions in order for its map browser event handlers
                    // to be fired first. It's handlers are responsible of doing the snapping.
                    addSnapInteraction(map);
                }

                routeLayer.setVisible(true);
                map.addLayer(routeLayer);
            });

            function addPointerInteraction(map) {
                pointerInteraction = new ol.interaction.Pointer({handleEvent: function (e) {

                    var pixel =  e.pixel;

                    var hitThis = map.hasFeatureAtPixel(pixel, {hitTolerance: 2, layerFilter: function (layerCandidate) {
                        return layerCandidate === routeLayer;
                    }});

                    var hitOther = map.hasFeatureAtPixel(pixel, {layerFilter: function (layerCandidate) {
                        return layerCandidate !== routeLayer && layerCandidate.get("Feature") === "VRMT"  && e.type === "singleclick";
                    }});

                    if (hitThis && !hitOther && e.type === "singleclick") {
                        var coord = ol.proj.toLonLat(e.coordinate, undefined);
                        NotifyService.notify(VrmtEvents.AddRouteLocation, {
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