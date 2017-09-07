(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('distanceCircles', distanceCircles);

    distanceCircles.$inject = ['OpenlayerService', 'NotifyService', 'VesselEvents', 'VesselService', 'OpenlayerEvents'];

    function distanceCircles(OpenlayerService, NotifyService, VesselEvents, VesselService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var mmsiToShow = [];

            var circleLayer = createCircleLayer();

            NotifyService.subscribe(scope, VesselEvents.ShowDistanceCircles, showNearest);
            NotifyService.subscribe(scope, VesselEvents.HideDistanceCircles, hideNearest);
            NotifyService.subscribe(scope, VesselEvents.HideExtraVesselsInfo, hideAll);

            function showNearest(e, vessel) {
                var index = mmsiToShow.indexOf(Number(vessel.mmsi));
                if (index === -1) {
                    mmsiToShow.push(Number(vessel.mmsi));
                }
                replaceDistanceFeatures();
                circleLayer.setVisible(true);
                NotifyService.notify(OpenlayerEvents.OpenlayerZoomToLayer, circleLayer);

            }

            function hideNearest(e, vessel) {
                var index = mmsiToShow.indexOf(Number(vessel.mmsi));
                if (index > -1) {
                    mmsiToShow.splice(index, 1);
                }
                replaceDistanceFeatures();
            }

            function hideAll() {
                mmsiToShow.length = 0;
                replaceDistanceFeatures();
            }

            function createCircleLayer() {
                return new ol.layer.Vector({
                    title: 'Distance circles',
                    source: new ol.source.Vector()
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
                circleLayer.getSource().clear();
                var vessels = VesselService.getLatest();
                mmsiToShow.forEach(function (mmsi) {
                    var vessel = vessels.find(function (v) {return mmsi === Number(v.mmsi);});
                    if (vessel) {
                        addDistanceCircleFeaturesFor(vessel);
                    }
                });

                function addDistanceCircleFeaturesFor(vessel) {
                    var center = [vessel.x, vessel.y];
                    var speed = embryo.getMaxSpeed(vessel); //in kn
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
                        if(vessel.awsog) {
                            maxSpeedLabel = "Based on ArcticWeb Max Speed: " + embryo.getMaxSpeed(vessel) + " kn";
                        } else if (vessel.ssog) {
                            maxSpeedLabel = "Based on Service Speed: " + embryo.getMaxSpeed(vessel) + " kn";
                        } else if (vessel.sog) {
                            maxSpeedLabel = "Based on SOG: " + embryo.getMaxSpeed(vessel) + " kn";
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