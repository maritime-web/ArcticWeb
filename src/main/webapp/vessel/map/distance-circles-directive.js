(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('distanceCircles', distanceCircles);

    distanceCircles.$inject = ['OpenlayerService', 'NotifyService', 'Events', 'Position'];

    function distanceCircles(OpenlayerService, NotifyService, Events, Position) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var selectedVessel = null;

            var circleLayer = createCircleLayer();

            NotifyService.subscribe(scope, Events.ShowDistanceCircles, showNearest);
            NotifyService.subscribe(scope, Events.HideDistanceCircles, hideNearest);
            NotifyService.subscribe(scope, Events.HideExtraVesselsInfo, hideNearest);

            function showNearest(e, vessel) {
                selectedVessel = vessel;
                replaceDistanceFeatures();
                circleLayer.setVisible(true);
            }

            function hideNearest() {
                circleLayer.setVisible(false)
            }


            function createCircleLayer() {
                return new ol.layer.Vector({
                    source: new ol.source.Vector(),
                });
            }

            function createStyle(fillOpacity, labelText) {
                return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,136,0,1.0)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,136,0,'+fillOpacity+')'
                    }),
                    text: new ol.style.Text({
                        text: labelText || '',
                        offsetY: 30,
                        textBaseline: 'bottom'
                    })
                });
            }

            function replaceDistanceFeatures() {
                if (selectedVessel) {
                    circleLayer.getSource().clear();
                    createDistanceCircleFeatures();
                }

                function createDistanceCircleFeatures() {

                    var center = [selectedVessel.x, selectedVessel.y];
                    var speed = embryo.getMaxSpeed(selectedVessel); //in kn
                    var distPerHour = speed * 1.852 * 1000; // in meters

                    var wgs84Sphere = new ol.Sphere(6378137);

                    var radius = 3*distPerHour; //3 hours
                    var circleOne = ol.geom.Polygon.circular(wgs84Sphere, center, radius, 64).transform('EPSG:4326', 'EPSG:3857');
                    var circleTwo = circleOne.clone();
                    circleTwo.scale(2);//6 hours
                    circleTwo.appendLinearRing(circleOne.getLinearRing(0));
                    var circleThree = circleOne.clone();
                    circleThree.scale(3);//9 hours
                    circleThree.appendLinearRing(circleTwo.getLinearRing(0));

                    var source = circleLayer.getSource();
                    var features = [
                        new ol.Feature({geometry: circleOne}),
                        new ol.Feature({geometry: circleTwo}),
                        new ol.Feature({geometry: circleThree})
                    ];

                    features[0].setStyle(createStyle(0.5, getLabelText()));
                    features[1].setStyle(createStyle(0.4));
                    features[2].setStyle(createStyle(0.3));
                    source.addFeatures(features);

                    function getLabelText() {
                        var maxSpeedLabel;
                        if(selectedVessel.awsog) {
                            maxSpeedLabel = "Based on ArcticWeb Max Speed: " + embryo.getMaxSpeed(selectedVessel) + " kn";
                        } else if (selectedVessel.ssog) {
                            maxSpeedLabel = "Based on Service Speed: " + embryo.getMaxSpeed(selectedVessel) + " kn";
                        } else if (selectedVessel.sog) {
                            maxSpeedLabel = "Based on SOG: " + embryo.getMaxSpeed(selectedVessel) + " kn";
                        } else {

                            maxSpeedLabel = "No speed found.";
                        }
                        return maxSpeedLabel;
                    }
                }
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(circleLayer);

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(circleLayer)) {
                        map.removeLayer(circleLayer);
                    }
                });
            })
        }
    }
})();