angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', 'MapService', 'RouteService', 'VesselService', 'RiskAssesmentService',
        function ($scope, $http, $window, $timeout, MapService, RouteService, VesselService, RiskAssesmentService) {
            var mmsi = embryo.authentication.shipMmsi;

            /* sidebar control */
            $scope.sidebar = {
                monitorAndReportActive: false,
                safetyMeasuresActive: false,
                decisionMakingActive: false,
                logOfMeasuresAndReportsActive: false,
                hidden: false,
                toggleVisibility: function () {
                    this.hidden = !this.hidden;
                },
                meta: {
                    vesselName: mmsi,
                    routeView: {id: null, name: null},
                    assesmentViews: [],
                    assesmentLocations: [],
                    currentAssesmentLocation: null,
                    currentAssesment: null,
                    chooseAssesment: function (assesment) {
                        this.currentAssesment = assesment;
                    }
                }
            };

            $scope.$watch('sidebar.meta.routeView', function (newRoute) {
                if (newRoute) {
                    console.log("Route changed: " + newRoute.name);
                    RiskAssesmentService.getLatestRiskAssesmentsForRoute(newRoute.id).then(function (assesments) {
                        $scope.sidebar.meta.assesmentViews = [];
                        assesments.forEach(function (assesment) {
                            $scope.sidebar.meta.assesmentViews.push({
                                location: assesment.location.name,
                                index: assesment.getIndex(),
                                lastAssessed: assesment.time,
                                factorAssesments: assesment.factorAssesments
                            })
                        });
                        $scope.sidebar.meta.currentAssesment = $scope.sidebar.meta.assesmentViews[0];
                    })
                }
            });

            $scope.$watch('sidebar.meta.currentAssesmentLocation', function (newLocation) {
                RiskAssesmentService.getRiskAssesment(newLocation).then(function (assesment) {
                    $scope.sidebar.meta.currentAssesment = assesment;
                })
            });

            /* timeline control */
            $scope.timeline = {
                hidden: false
            };
            $scope.choosenTime = 0;
            $scope.times = [];
            $scope.calculatedIndexes = createTimelineSegments();
            $scope.timelineDimensions = createDimensions();

            var offset = $scope.timelineDimensions.offset;
            var distanceBetween = 20;
            var width = $scope.timelineDimensions.width;
            for (var i = 0; (i * distanceBetween + offset) < (width - offset); i++) {
                $scope.times[i] = {
                    x1: i * distanceBetween + offset
                };
            }

            $scope.moveVessel = function ($event) {
                $event.preventDefault();
                $scope.choosenTime = $event.offsetX;
            };

            // Map state and layers
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();


            $scope.route = {};
            $scope.assesmentLocations = {};

            RouteService.getActive(mmsi, function (r) {
                $scope.route = r;
                $scope.sidebar.meta.routeView = {id: r.id, name: r.name};

                RiskAssesmentService.getRouteAssesmentLocations(r.id)
                    .then(function (locations) {
                        $scope.assesmentLocations = locations;
                        $scope.sidebar.meta.assesmentLocations = locations;
                        $scope.sidebar.meta.currentAssesmentLocation = locations[0];
                    });
            });

            $scope.vessel = {};
            VesselService.details(mmsi, function (v) {
                console.log("Got vessel info for " + mmsi);
                $scope.vessel = v;
                $scope.sidebar.meta.vesselName = v.aisVessel.name || mmsi;
            });

        }]);

function createTimelineSegments() {
    return [
        {
            color: "#FFFF00",
            x1: 0,
            x2: 100,
            y1: 100,
            y2: 100
        },
        {
            color: "#FFFF00",
            x1: 100,
            x2: 100,
            y1: 100,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 100,
            x2: 200,
            y1: 150,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 200,
            x2: 200,
            y1: 150,
            y2: 50
        },
        {
            color: "#FF0000",
            x1: 200,
            x2: 300,
            y1: 50,
            y2: 50
        }
    ];

}

function indexToPixels(baseline, index, maxIndex) {
    return (baseline / maxIndex) * index;
}

function createDimensions() {
    var d = {};
    d.width = 600;
    d.height = 250;
    d.offset = 1;
    d.baseline = d.height - 30;
    d.yellowThreshold = indexToPixels(d.baseline, 1000, 3000);
    d.redThreshold = indexToPixels(d.baseline, 2000, 3000);
    return d;
}