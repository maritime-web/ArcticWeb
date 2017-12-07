(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .constant('VrmtEvents', {
            VRMTFeatureActive: "VRMT.FeatureActive",
            VRMTFeatureInActive: "VRMT.FeatureInActive",
            LocationAssessmentCreated: "VRMT.LocationAssessmentCreated",
            LocationAssessmentDeleted: "VRMTL.ocationAssessmentDeleted",
            AddRouteLocation: "VRMT.AddRouteLocation",
            AddRouteLocationDiscarded: "VRMT.AddRouteLocationDiscarded",
            RouteLocationCreated: "VRMT.RouteLocationCreated",
            RouteLocationDeleted: "VRMT.RouteLocationDeleted",
            RouteChanged: "VRMT.RouteChanged",
            VesselLoaded: "VRMT.VesselLoaded",
            OpenAssessmentEditor: "VRMT.OpenAssessmentEditor",
            OpenAssessmentView: "VRMT.OpenAssessmentView",
            OpenAssessmentFactorEditor: "VRMT.OpenAssessmentFactorEditor",
            RouteLocationChosen: "VRMT.RouteLocationChosen",
            RouteLocationClicked: "VRMT.RouteLocationClicked",
            VesselClicked: "VRMT.VesselClicked",
            RouteLocationsLoaded: "VRMT.RouteLocationsLoaded",
            AssessmentUpdated: "VRMT.AssessmentUpdated",
            NewAssessmentStarted: "VRMT.NewAssessmentStarted",
            AssessmentCompleted: "VRMT.AssessmentCompleted",
            AssessmentDiscarded: "VRMT.AssessmentDiscarded"
        })
        .controller("VrmtController", VrmtController);

    VrmtController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'NotifyService', 'VrmtEvents', '$timeout', 'growl', 'ScheduleService'];

    function VrmtController($scope, $interval, RouteService, VesselService, RiskAssessmentService, NotifyService, VrmtEvents, $timeout, growl, ScheduleService) {
        var vm = this;
        $scope.mmsi = null;
        vm.chosenRouteLocation = null;

        initialize();

        function initialize() {
            if (embryo.authentication.shipMmsi) {
                $scope.mmsi = embryo.authentication.shipMmsi;
                NotifyService.notify(VrmtEvents.VRMTFeatureActive, moment().utc());
                //Make sure that all subscribers for vessel and route data have been registered before loading data
                $timeout(function () {
                    $scope.$apply(function () {
                        loadVessel();
                    });
                });
            } else {
                $timeout(function () {
                    $scope.$apply(function () {
                        initialize();
                    });
                }, 10);

            }
        }

        /**
         * Load data
         */
        function loadVessel() {
            VesselService.details($scope.mmsi, function (v) {
                NotifyService.notify(VrmtEvents.VesselLoaded, v);
                //Only change rute if we don't have one yet
                var routeId = $scope.route ? $scope.route.id : v.additionalInformation.routeId;
                if (!routeId) { //No active route, choose one in the schedule
                    ScheduleService.getYourSchedule($scope.mmsi, function (schedule) {
                        var mapToRouteId = function (voyage) {return voyage.route ? voyage.route.id : null;};
                        var voyagesWithoutRoutes = function (elem) {return elem !== null;};
                        var routeIds = schedule.voyages.map(mapToRouteId).filter(voyagesWithoutRoutes);
                        if (routeIds && routeIds.length > 0) {
                            loadRoute(routeIds[0]);
                        }
                    });
                } else {
                    loadRoute(routeId);
                }
            }, function (error) {//todo identify timeout error
                growl.error("Error loading vessel information: " + Array.isArray(error) ? error.toString() : '')
            });
        }

        function loadRoute(routeId) {
            RouteService.getRoute(routeId, function (r) {
                RiskAssessmentService.updateCurrentRoute(r);
            })
        }

        function loadCurrentAssessment() {
            RiskAssessmentService.getCurrentAssessment()
                .then(function (currentAssessment) {
                    if (vm.chosenRouteLocation) {
                        vm.chosenRouteLocation = currentAssessment.locationsToAssess.find(function (loc) {
                            return vm.chosenRouteLocation.id == loc.id;
                        });
                    }
                    if (!vm.chosenRouteLocation) {
                        vm.chosenRouteLocation = currentAssessment.locationsToAssess[0];
                    }
                    NotifyService.notify(VrmtEvents.AssessmentUpdated, currentAssessment);
                    NotifyService.notify(VrmtEvents.RouteLocationChosen, vm.chosenRouteLocation);
                })
                .catch(function (reason) {
                    loadRouteLocations();
                });
        }

        function loadRouteLocations() {
            RiskAssessmentService.getRouteLocations()
                .then(function (routeLocations) {
                    NotifyService.notify(VrmtEvents.RouteLocationsLoaded, routeLocations);
                    if (routeLocations.length > 0) {
                        NotifyService.notify(VrmtEvents.RouteLocationChosen, routeLocations[0]);
                    }
                })
                .catch(function (err) {
                    growl.error(err);
                })
        }

        /**
         * Reload data when Rute changes
         */
        NotifyService.subscribe($scope, VrmtEvents.RouteChanged, onRouteChanged);
        function onRouteChanged(event, newRoute) {
            $scope.route = newRoute;
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, VrmtEvents.NewAssessmentStarted, function () {
            loadCurrentAssessment();
        });
        NotifyService.subscribe($scope, VrmtEvents.AssessmentDiscarded, function () {
            loadCurrentAssessment();
        });
        NotifyService.subscribe($scope, VrmtEvents.AssessmentCompleted, function () {
            loadCurrentAssessment();
        });


        /**
         * Reload data when CRUD operations have been performed
         */
        NotifyService.subscribe($scope, VrmtEvents.LocationAssessmentCreated, onAssessmentCRUD);
        NotifyService.subscribe($scope, VrmtEvents.LocationAssessmentDeleted, onAssessmentCRUD);
        function onAssessmentCRUD() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, VrmtEvents.RouteLocationCreated, onRouteLocationCreated);
        function onRouteLocationCreated() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, VrmtEvents.RouteLocationDeleted, onRouteLocationDeleted);
        function onRouteLocationDeleted() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, VrmtEvents.RouteLocationChosen, onRouteLocationChosen);
        function onRouteLocationChosen(event, chosen) {
            vm.chosenRouteLocation = chosen;
        }

        //reload of vessel and route
        var stop = $interval(loadVessel, 300000);


        /**
         * Clean up
         */
        $scope.$on('$destroy', function () {
            console.log("Cleaning up VRMT");
            $interval.cancel(stop);
            stop = undefined;

            NotifyService.notify(VrmtEvents.VRMTFeatureInActive, moment().utc());
        });
    }
})();