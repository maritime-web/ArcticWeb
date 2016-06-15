angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', 'MapService', 'RouteService', 'VesselService', 'RiskAssesmentService', '$modal',
        function ($scope, $http, $window, $timeout, MapService, RouteService, VesselService, RiskAssesmentService, $modal) {

            /** 
             * Initialize variables 
             */
            var mmsi = embryo.authentication.shipMmsi;
            $scope.route = {};
            $scope.assesmentLocationEvent = {};
            $scope.assesmentLocations = [];
            $scope.vessel = {};

            /** 
             * Load data 
             */
            VesselService.details(mmsi, function (v) {
                console.log("Got vessel info for " + mmsi);
                $scope.vessel = v;
            });


            RouteService.getActive(mmsi, function (r) {
                $scope.route = r;
                loadAssesmentLocations();
            });

            function loadAssesmentLocations() {
                RiskAssesmentService.getRouteAssesmentLocations($scope.route.id)
                    .then(function (locations) {
                        $scope.assesmentLocations = locations;
                    });
            }


            /** 
             * Sidebar control 
             */
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

            function AssesmentView(assesment) {
                this.location = assesment.location.id + ': ' + assesment.location.name;
                this.index = assesment.index || '-';
                this.lastAssessed = assesment.time || '-';
                this.factorAssesments = assesment.factorAssesments || [];
            }

            $scope.$watch('route', function (newRoute, oldRoute) {
                if (newRoute && newRoute !== oldRoute) {
                    console.log("Route changed: " + newRoute.name);
                    $scope.sidebar.meta.routeView = {id: newRoute.id, name: newRoute.name};

                    RiskAssesmentService.getLatestRiskAssesmentsForRoute(newRoute.id).then(function (assesments) {
                        $scope.sidebar.meta.assesmentViews = [];
                        assesments.forEach(function (assesment) {
                            console.log("assesment");
                            console.log(assesment);
                            $scope.sidebar.meta.assesmentViews.push(new AssesmentView(assesment))
                        });
                        $scope.sidebar.meta.currentAssesment = $scope.sidebar.meta.assesmentViews[0];
                    })
                }
            });

            $scope.$watch('assesmentLocations', function (newLocations) {
                if (newLocations && newLocations.length > 0) {
                    $scope.sidebar.meta.assesmentLocations = newLocations;
                    $scope.sidebar.meta.currentAssesmentLocation = newLocations[0];
                }
            });
            
            $scope.$watch('sidebar.meta.currentAssesmentLocation', function (newLocation) {
                RiskAssesmentService.getRiskAssesment($scope.route.id, newLocation).then(function (assesment) {
                    $scope.sidebar.meta.currentAssesment = new AssesmentView(assesment);
                })
            });

            $scope.$watch('vessel', function (newVessel) {
                if (newVessel && newVessel.aisVessel) {
                    $scope.sidebar.meta.vesselName = newVessel.aisVessel.name || mmsi;
                }
            });

            /** 
             * timeline control 
             */
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

            /**
             * Map state and layers
             */
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();


            /** 
             * Assesment location creation 
             */
            $scope.$watch("assesmentLocationEvent['event']", function (newAssesmentLocationEvent, oldAssesmentLocationEvent) {
                if (!newAssesmentLocationEvent || newAssesmentLocationEvent == oldAssesmentLocationEvent) return;

                var modalInstance = $modal.open({
                    templateUrl: "addAssesmentLocation",
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        event: function () {
                            return newAssesmentLocationEvent;
                        }
                    }
                });

                modalInstance.result.then(function (assesmentLocationParameters) {
                    assesmentLocationParameters.routeId = $scope.route.id;
                    console.log("assesmentLocationParameters");
                    console.log(assesmentLocationParameters);
                    RiskAssesmentService.createAssesmentLocation(assesmentLocationParameters);
                    loadAssesmentLocations();
                }, function (dismissReason) {
                    console.log("Assesment Location dismissed with reason '" + dismissReason + "'");
                })
            });

        }])

    .controller("ModalInstanceCtrl", function ($scope, $modalInstance, event) {
        $scope.loc = event;
    });

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