(function () {
    'use strict';

    angular.module('vrmt.map')
        .directive('assessmentLocations', assessmentLocations);

    assessmentLocations.$inject = ['NotifyService', 'Events'];

    function assessmentLocations(NotifyService, Events) {
        var directive = {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: link
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var olScope = ctrl.getOpenlayersScope();
            /**
             * Layer creation functionality
             */
            var locationLayer = createLocationLayer();

            function createLocationLayer() {
                return new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    style: createLocationStyleFunction()
                });
            }

            function addOrReplaceLocation(latestAssessment) {
                var location = latestAssessment.location;
                var coord = ol.proj.transform([location.lon, location.lat], 'EPSG:4326', 'EPSG:3857');
                var locationFeature = new ol.Feature({
                    geometry: new ol.geom.Point(coord)
                });
                locationFeature.setId(location.id);
                locationFeature.set("assessmentLocation", latestAssessment, true);
                locationLayer.getSource().addFeature(locationFeature);
            }

            function createLocationStyleFunction() {
                return function (feature, resolution) {
                    var latestAssessment = feature.get("assessmentLocation");
                    var style = createStyle(latestAssessment, 'black', 1);
                    return [style];
                };
            }

            function createSelectedLocationStyleFunction() {
                return function (feature, resolution) {
                    var latestAssessment = feature.get("assessmentLocation");
                    var style = createStyle(latestAssessment, 'blue', 2);
                    return [style];
                };
            }

            function createStyle(latestAssessment, strokeColor, strokeWidth) {
                var text = '' + latestAssessment.location.id;
                var fillColor = 'black';
                var index = latestAssessment.index;
                if (index > 0) fillColor = 'green';
                if (index > 1000) fillColor = 'yellow';
                if (index > 2000) fillColor = 'red';

                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
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
                        offsetX: 10,
                        offsetY: 9,
                        rotation: 0
                    })
                });
            }



            /**
             * Model listeners
             */
            NotifyService.subscribe(scope, Events.LatestRiskAssessmentsLoaded, onLatestRiskAssessmentsLoaded);
            function onLatestRiskAssessmentsLoaded(event, assessments) {
                select.getFeatures().clear();
                locationLayer.getSource().clear();
                assessments.forEach(function (assessment) {
                    addOrReplaceLocation(assessment);
                });
            }

            NotifyService.subscribe(scope, Events.AssessmentLocationChosen, onAssessmentLocationChosen);
            function onAssessmentLocationChosen(event, chosen) {
                select.getFeatures().clear();

                var featureToSelect = locationLayer.getSource().getFeatureById(chosen.location.id);

                select.getFeatures().push(featureToSelect);
                panToFeature(featureToSelect);
            }

            /**
             * Interactions
             */
            var select = new ol.interaction.Select({
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
                    NotifyService.notify(Events.AssessmentLocationChosen, selectedFeature.get("assessmentLocation"));
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
                        NotifyService.notify(Events.AssessmentLocationClicked, {
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
