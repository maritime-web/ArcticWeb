(function () {
    'use strict';

    angular.module('vrmt.map')
        .directive('routeLocations', routeLocations);

    routeLocations.$inject = ['NotifyService', 'Events'];

    function routeLocations(NotifyService, Events) {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var olScope = ctrl.getOpenlayersScope();
            /**
             * Layer creation functionality
             */
            var locationLayer = createLocationLayer();
            var currentAssessment = null;

            function createLocationLayer() {
                return new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    style: createLocationStyleFunction()
                });
            }

            function addOrReplaceLocation(location) {
                var coord = ol.proj.fromLonLat(/** @type {ol.Coordinate} */[location.lon, location.lat], undefined);
                var locationFeature = new ol.Feature({
                    geometry: new ol.geom.Point(coord)
                });
                locationFeature.setId(location.id);
                locationFeature.set("routeLocation", location, true);
                locationLayer.getSource().addFeature(locationFeature);
            }

            function createLocationStyleFunction() {
                return function (feature, resolution) {
                    var routeLocation = feature.get("routeLocation");
                    var style = createStyle(routeLocation, 'black', 1);
                    return [style];
                };
            }

            function createSelectedLocationStyleFunction() {
                return function (feature, resolution) {
                    var routeLocation = feature.get("routeLocation");
                    var style = createStyle(routeLocation, 'blue', 4);
                    return [style];
                };
            }

            function createStyle(routeLocation, strokeColor, strokeWidth) {
                var text = '' + routeLocation.name;
                var fillColor = 'black';
                var index = currentAssessment ? currentAssessment.getLocationAssessment(routeLocation.id).index : 0;
                if (index > 0) fillColor = 'green';
                if (index > 1000) fillColor = 'yellow';
                if (index > 2000) fillColor = 'red';

                var style = new ol.style.Style(/** @type {olx.style.StyleOptions}*/{
                    image: new ol.style.RegularShape({
                        radius: 12,
                        points: 6,
                        angle: 0,
                        snapToPixel: false,
                        fill: new ol.style.Fill({
                            color: fillColor
                        }),
                        stroke: new ol.style.Stroke({
                            color: strokeColor,
                            width: strokeWidth
                        })
                    }),
                    text: new ol.style.Text({
                        textAlign: 'start',
                        font: 'bold 12px Arial',
                        text: text,
                        fill: new ol.style.Fill({color: 'green'}),
                        stroke: new ol.style.Stroke({color: 'white', width: 3}),
                        offsetX: 11,
                        offsetY: 9,
                        rotation: 0
                    })
                });
                style.getImage().setOpacity(0.6);
                return style;
            }

            /**
             * Model listeners
             */
            NotifyService.subscribe(scope, Events.RouteLocationsLoaded, function (event, routeLocations) {
                currentAssessment = null;
                changeRouteLocations(routeLocations);
            });
            NotifyService.subscribe(scope, Events.AssessmentUpdated, function (event, assessment) {
                currentAssessment = assessment;
                changeRouteLocations(assessment.locationsToAssess);
            });

            function changeRouteLocations(routeLocations) {
                select.getFeatures().clear();
                locationLayer.getSource().clear();
                routeLocations.forEach(function (routeLocation) {
                    addOrReplaceLocation(routeLocation);
                });
            }

            NotifyService.subscribe(scope, Events.RouteLocationChosen, onAssessmentLocationChosen);
            function onAssessmentLocationChosen(event, chosen) {
                select.getFeatures().clear();

                var featureToSelect = locationLayer.getSource().getFeatureById(chosen.id);

                select.getFeatures().push(featureToSelect);
                panToFeature(featureToSelect);
            }

            /**
             * Interactions
             */
            var select = new ol.interaction.Select(/** @type {olx.interaction.SelectOptions}*/{
                layers: [locationLayer],
                style: createSelectedLocationStyleFunction(),
                condition: function (e) {
                    if (ol.events.condition.singleClick(e)) {
                        var map = e.map;
                        return map.hasFeatureAtPixel(e.pixel, function (layerCandidate) {
                            return layerCandidate === locationLayer;
                        });
                    }
                    return false;
                }
            });

            select.on('select', function (e) {
                if (e.selected.length == 1) {
                    var selectedFeature = e.selected[0];
                    NotifyService.notify(Events.RouteLocationChosen, selectedFeature.get("routeLocation"));
                }

                scope.$apply();
            });


            function panToFeature(feature) {
                olScope.getMap().then(function (map) {
                    var view = map.getView();
                    var featureExtent = feature.getGeometry().getExtent();
                    var mapExtent = view.calculateExtent(map.getSize());
                    if (!ol.extent.containsExtent(mapExtent, featureExtent)) {
                        view.fit(feature.getGeometry(), map.getSize(), {minResolution: view.getResolution()});
                    }
                });
            }

            /**
             * Map initialization
             */
            olScope.getMap().then(function (map) {
                map.addLayer(locationLayer);
                map.addInteraction(select);

                var onclickKey = map.on('singleclick', function (e) {
                    var pixel = map.getEventPixel(e.originalEvent);
                    var hitThis = map.hasFeatureAtPixel(pixel, function (layerCandidate) {
                        return layerCandidate === locationLayer;
                    });

                    if (hitThis) {
                        NotifyService.notify(Events.RouteLocationClicked, {
                            x: e.originalEvent.clientX,
                            y: e.originalEvent.clientY
                        });
                    }
                    scope.$apply();

                });
                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(locationLayer)) {
                        map.removeLayer(locationLayer);
                    }
                    if (select) {
                        map.removeInteraction(select);
                    }
                    if (onclickKey) {
                        map.unByKey(onclickKey);
                    }
                });

            });
        }
    }

})();
