(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .constant('VrmtEvents', {
            VRMTFeatureActive: "VRMTFeatureActive",
            VRMTFeatureInActive: "VRMTFeatureInActive",
            LocationAssessmentCreated: "LocationAssessmentCreated",
            LocationAssessmentDeleted: "LocationAssessmentDeleted",
            AddRouteLocation: "AddRouteLocation",
            AddRouteLocationDiscarded: "AddRouteLocationDiscarded",
            RouteLocationCreated: "RouteLocationCreated",
            RouteLocationDeleted: "RouteLocationDeleted",
            RouteChanged: "RouteChanged",
            VesselLoaded: "VesselLoaded",
            OpenAssessmentEditor: "OpenAssessmentEditor",
            OpenAssessmentView: "OpenAssessmentView",
            OpenAssessmentFactorEditor: "OpenAssessmentFactorEditor",
            RouteLocationChosen: "RouteLocationChosen",
            RouteLocationClicked: "RouteLocationClicked",
            VesselClicked: "VesselClicked",
            RouteLocationsLoaded: "RouteLocationsLoaded",
            AssessmentUpdated: "AssessmentUpdated",
            NewAssessmentStarted: "NewAssessmentStarted",
            AssessmentCompleted: "AssessmentCompleted",
            AssessmentDiscarded: "AssessmentDiscarded"
        })
        .controller("VrmtController", VrmtController);

    VrmtController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'NotifyService', 'VrmtEvents', '$timeout', 'growl'];

    function VrmtController($scope, $interval, RouteService, VesselService, RiskAssessmentService, NotifyService, VrmtEvents, $timeout, growl) {
        var vm = this;
        $scope.mmsi = null;
        vm.chosenRouteLocation = null;

        initialize();

        function initialize() {
            if (embryo.authentication.shipMmsi) {
                $scope.mmsi = embryo.authentication.shipMmsi;
                NotifyService.notify(VrmtEvents.VRMTFeatureActive);
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
                console.log(v);
                //Only change rute if we don't have one yet
                var routeId = $scope.route ? $scope.route.id : v.additionalInformation.routeId;
                loadRoute(routeId);
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

            NotifyService.notify(VrmtEvents.VRMTFeatureInActive);
        });
    }
})();