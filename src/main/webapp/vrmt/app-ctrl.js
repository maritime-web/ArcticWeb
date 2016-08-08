(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AppController", AppController);

    AppController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'RiskAssessmentLocationService', '$modal'];

    function AppController($scope, $interval, RouteService, VesselService, RiskAssessmentService, RiskAssessmentLocationService, $modal) {

        /**
         * Initialize variables
         */
        $scope.mmsi = embryo.authentication.shipMmsi;
        $scope.vessel = {};
        $scope.route = {};
        $scope.assessmentLocationState = {};
        $scope.assessmentLocationEvents = {
            created: null,
            deleted: null,
            updated: null
        };
        $scope.riskAssessmentEvents = {
            created: null,
            deleted: null,
            updated: null
        };
        $scope.latestRiskAssessments = [];

        $scope.editorActivator = {
            showAssessmentEditor: 0,
            showAssessmentFactorEditor: 0
        };

        /**
         * Load data
         */
        function loadVessel() {
            VesselService.details($scope.mmsi, function (v) {
                if (v && v.aisVessel) {
                    console.log("Got vessel info for " + $scope.mmsi + " Lat: " + v.aisVessel.lat + " Lon: " + v.aisVessel.lon);
                } else {
                    console.log("Got vessel info for " + $scope.mmsi);
                }
                $scope.vessel = v;
            });
        }

        loadVessel();
        var stop = $interval(loadVessel, 300000);

        RouteService.getActive($scope.mmsi, function (r) {
            $scope.fireRouteChange(r);
        });

        $scope.fireRouteChange = function (r) {
            $scope.route = r;
            $scope.assessmentLocationState['route'] = r;
        };

        function loadLatestAssessments(assessmentLocationToChoose) {
            RiskAssessmentService.getLatestRiskAssessmentsForRoute($scope.route.id)
                .then(function (assessments) {
                    if (assessmentLocationToChoose) {
                        $scope.assessmentLocationState['chosen'] = assessments.find(function (assessment) {
                            return assessmentLocationToChoose.id === assessment.location.id;
                        });
                    } else {
                        $scope.assessmentLocationState['chosen'] = null;
                    }
                    $scope.latestRiskAssessments = assessments;
                    $scope.assessmentLocationState['latestRiskAssessments'] = assessments;
                })
        }

        /**
         * Reload data when Rute changes
         */
        $scope.$watch('route', function (newRoute, oldRoute) {
            if (newRoute && newRoute !== oldRoute) {
                console.log("Route changed: " + newRoute.name);
                loadLatestAssessments();
            }
        });

        /**
         * Reload data when CRUD operations have been performed
         */
        $scope.$watch("riskAssessmentEvents['created']", function (newValue, oldValue) {
            if (newValue && newValue != oldValue) {
                loadLatestAssessments($scope.assessmentLocationState['chosen'].location);
            }
        });
        $scope.$watch("riskAssessmentEvents['deleted']", function (newValue, oldValue) {
            if (newValue && newValue != oldValue) {
                loadLatestAssessments($scope.assessmentLocationState['chosen'].location);
            }
        });
        $scope.$watch("assessmentLocationEvents['created']", function (newValue, oldValue) {
            if (newValue && newValue != oldValue) {
                loadLatestAssessments(newValue);
            }
        });
        $scope.$watch("assessmentLocationEvents['deleted']", function (newValue, oldValue) {
            if (newValue && newValue != oldValue) {
                loadLatestAssessments();
            }
        });

        /**
         * assessment location creation
         */
        $scope.$watch("assessmentLocationState['new']", function (newAssessmentLocationEvent, oldAssessmentLocationEvent) {
            if (!newAssessmentLocationEvent || newAssessmentLocationEvent == oldAssessmentLocationEvent) return;

            var modalInstance = $modal.open({
                templateUrl: "addAssessmentLocation",
                controller: 'ModalInstanceCtrl',
                resolve: {
                    event: function () {
                        return newAssessmentLocationEvent;
                    }
                }
            });

            modalInstance.result.then(function (locParam) {
                var route = locParam.route;
                if (route) {
                    locParam.lat = route.lat;
                    locParam.lon = route.lon;
                }
                var vessel = locParam.vessel;
                if (vessel) {
                    locParam.lat = vessel.ais.lat;
                    locParam.lon = vessel.ais.lon;
                    var override = vessel.override;
                    if (override && override.lat && override.lon) {
                        locParam.lat = override.lat;
                        locParam.lon = override.lon;
                    }
                }

                locParam.routeId = $scope.route.id;
                RiskAssessmentLocationService.createAssessmentLocation(locParam)
                    .then(function (location) {
                        $scope.assessmentLocationEvents['created'] = location;
                    });
            }, function (dismissReason) {
                console.log("assessment Location dismissed with reason '" + dismissReason + "'");
            })
        });

        /**
         * Clean up
         */
        $scope.$on('$destroy', function () {
            console.log("Cleaning up VRMT");
            $interval.cancel(stop);
            stop = undefined;
        });
    }
})();