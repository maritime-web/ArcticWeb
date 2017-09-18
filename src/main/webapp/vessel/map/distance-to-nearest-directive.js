(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('distanceToNearest', distanceToNearest);

    distanceToNearest.$inject = ['OpenlayerService', 'NotifyService', 'VesselEvents', 'Position', 'OpenlayerEvents'];

    function distanceToNearest(OpenlayerService, NotifyService, VesselEvents, Position, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var selectedVessel = null;
            var allVessels = null;

            var distanceLayer = createDistanceLayer();

            NotifyService.subscribe(scope, VesselEvents.ShowNearestVessels, showNearest);
            NotifyService.subscribe(scope, VesselEvents.HideNearestVessels, hideNearest);
            NotifyService.subscribe(scope, VesselEvents.HideExtraVesselsInfo, hideNearest);

            function showNearest(e, vesselInfo) {
                selectedVessel = vesselInfo.selected;
                allVessels = vesselInfo.vessels;
                replaceDistanceFeatures();
                distanceLayer.setVisible(true);

                NotifyService.notify(OpenlayerEvents.ZoomToLayer, distanceLayer);
            }

            function hideNearest() {
                distanceLayer.setVisible(false)
            }

            function createDistanceLayer() {
                return new ol.layer.Vector({
                    title: 'Distance to nearest vessels',
                    source: new ol.source.Vector()
                });
            }

            function replaceDistanceFeatures() {
                if (selectedVessel && allVessels) {
                    var source = distanceLayer.getSource();
                    source.clear();

                    createDistanceFeatures();
                }

                function createDistanceFeatures() {
                    var vessels = [];
                    sortVesselsByDistanceInMinutes();
                    addNearestFourToLayer();

                    function sortVesselsByDistanceInMinutes() {
                        angular.forEach(allVessels, function (v) {
                            if (v.mmsi != selectedVessel.mmsi) {
                                if (embryo.getMaxSpeed(v) > 0.0) {
                                    var pos = Position.create(selectedVessel.x, selectedVessel.y);
                                    var distance = pos.geodesicDistanceTo({lon: v.x, lat: v.y});
                                    var o = {
                                        distance: distance,
                                        timeInMinutes: (distance / (embryo.getMaxSpeed(v) * 1.852)) * 60,
                                        vessel: v
                                    };

                                    if (o.distance > 0) {
                                        vessels.push(o);
                                    }
                                }
                            }
                        });

                        vessels.sort(function (a, b) {
                            if (a.timeInMinutes == Infinity && b.timeInMinutes == Infinity) {
                                return 0;
                            }
                            if (a.timeInMinutes == Infinity && b.timeInMinutes != Infinity) {
                                return 100;
                            }
                            if (a.timeInMinutes != Infinity && b.timeInMinutes == Infinity) {
                                return -100;
                            }

                            return a.timeInMinutes - b.timeInMinutes;
                        });
                    }

                    function addNearestFourToLayer() {
                        for (var i = 0; i < 5; i++) {
                            var toVessel = vessels[i];
                            distanceLayer.getSource().addFeature(createLineStringFeature(selectedVessel, toVessel));
                        }
                    }

                    function getVesselPresentationName(toVessel) {
                        var vessel = toVessel.vessel;

                        var maxSpeed = embryo.getMaxSpeed(vessel);
                        var maxSpeedLabel;
                        if (vessel.awsog) {
                            maxSpeedLabel = "AW Max Speed: " + maxSpeed + " kn";
                        } else if (vessel.ssog) {
                            maxSpeedLabel = "Service Speed: " + maxSpeed + " kn";
                        } else if (vessel.sog) {
                            maxSpeedLabel = "SOG: " + maxSpeed + " kn";
                        }

                        var name = vessel.name != undefined && vessel.name != null ? vessel.name : vessel.mmsi;

                        var eta = "";
                        if (maxSpeed != Infinity) {
                            eta = ", " + formatHour(toVessel.distance / (maxSpeed * 1.852)) + " hours, " + maxSpeedLabel;
                        }

                        return name + ": " + formatNauticalMile(toVessel.distance) + eta;
                    }

                    function createLineStringFeature(selectedVessel, toVessel) {
                        var coords = [];
                        coords.push(OpenlayerService.fromLonLat([selectedVessel.x, selectedVessel.y]));
                        coords.push(OpenlayerService.fromLonLat([toVessel.vessel.x, toVessel.vessel.y]));
                        var style = new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#f80',
                                width: 2
                            }),
                            text: new ol.style.Text({
                                text: getVesselPresentationName(toVessel),
                                textBaseline: 'top',
                                textAlign: 'center'
                            })
                        });
                        var res = new ol.Feature({
                            geometry: new ol.geom.LineString(coords)
                        });

                        res.setStyle(style);
                        return res;
                    }
                }
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(distanceLayer);

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(distanceLayer)) {
                        map.removeLayer(distanceLayer);
                    }
                });
            })
        }
    }
})();