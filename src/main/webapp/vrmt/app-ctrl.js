(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .constant('Events', {
            LocationAssessmentCreated: "LocationAssessmentCreated",
            LocationAssessmentDeleted: "LocationAssessmentDeleted",
            RouteLocationCreated: "RouteLocationCreated",
            RouteLocationDeleted: "RouteLocationDeleted",
            RouteChanged: "RouteChanged",
            VesselLoaded: "VesselLoaded",
            LatestRiskAssessmentsLoaded: "LatestRiskAssessmentsLoaded",
            OpenAssessmentEditor: "OpenAssessmentEditor",
            OpenAssessmentFactorEditor: "OpenAssessmentFactorEditor",
            RouteLocationChosen: "RouteLocationChosen",
            RouteLocationClicked: "RouteLocationClicked",
            VesselClicked: "VesselClicked",
            AddRouteLocation: "AddRouteLocation",
            RouteLocationsLoaded: "RouteLocationsLoaded",
            AssessmentUpdated: "AssessmentUpdated",
            NewAssessmentStarted: "NewAssessmentStarted",
            AssessmentCompleted: "AssessmentCompleted",
            AssessmentDiscarded: "AssessmentDiscarded"
        })
        .controller("AppController", AppController);

    AppController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'NotifyService', 'Events', '$timeout'];

    function AppController($scope, $interval, RouteService, VesselService, RiskAssessmentService, NotifyService, Events, $timeout) {
        var vm = this;
        $scope.mmsi = embryo.authentication.shipMmsi;
        vm.route = {};
        vm.chosenRouteLocation = null;

        /**
         * Load data
         */
        function loadVessel() {
            VesselService.details($scope.mmsi, function (v) {
                NotifyService.notify(Events.VesselLoaded, v);
                console.log(v);
                loadRoute(v.additionalInformation.routeId);
            });
        }

        function loadRoute(routeId) {
            RouteService.getRoute(routeId, function (r) {
                NotifyService.notify(Events.RouteChanged, r);
            })
        }

        function loadCurrentAssessment() {
            RiskAssessmentService.getCurrentAssessment($scope.route.id)
                .then(function (currentAssessment) {
                    if (!vm.chosenRouteLocation) {
                        vm.chosenRouteLocation = currentAssessment.locationsToAssess[0];
                    } else {
                        vm.chosenRouteLocation = currentAssessment.locationsToAssess.find(function (loc) {
                            return vm.chosenRouteLocation.id == loc.id;
                        });
                    }
                    NotifyService.notify(Events.AssessmentUpdated, currentAssessment);
                    NotifyService.notify(Events.RouteLocationChosen, vm.chosenRouteLocation);
                })
                .catch(function (reason) {
                    loadRouteLocations();
                });
        }

        function loadRouteLocations() {
            RiskAssessmentService.getRouteLocations($scope.route.id)
                .then(function (routeLocations) {
                    NotifyService.notify(Events.RouteLocationsLoaded, routeLocations);
                    if (routeLocations.length > 0) {
                        NotifyService.notify(Events.RouteLocationChosen, routeLocations[0]);
                    }
                })
        }

        /**
         * Reload data when Rute changes
         */
        NotifyService.subscribe($scope, Events.RouteChanged, onRouteChanged);
        function onRouteChanged(event, newRoute) {
            $scope.route = newRoute;
            RiskAssessmentService.updateCurrentRoute(newRoute)
                .then(function () {
                    loadCurrentAssessment();
                });
        }

        NotifyService.subscribe($scope, Events.NewAssessmentStarted, function () {
            loadCurrentAssessment();
        });
        NotifyService.subscribe($scope, Events.AssessmentDiscarded, function () {
            loadCurrentAssessment();
        });
        NotifyService.subscribe($scope, Events.AssessmentCompleted, function () {
            loadCurrentAssessment();
        });


        /**
         * Reload data when CRUD operations have been performed
         */
        NotifyService.subscribe($scope, Events.LocationAssessmentCreated, onAssessmentCRUD);
        NotifyService.subscribe($scope, Events.LocationAssessmentDeleted, onAssessmentCRUD);
        function onAssessmentCRUD() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, Events.RouteLocationCreated, onRouteLocationCreated);
        function onRouteLocationCreated() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, Events.RouteLocationDeleted, onRouteLocationDeleted);
        function onRouteLocationDeleted() {
            loadCurrentAssessment();
        }

        NotifyService.subscribe($scope, Events.RouteLocationChosen, onRouteLocationChosen);
        function onRouteLocationChosen(event, chosen) {
            vm.chosenRouteLocation = chosen;
        }

        //initial load of vessel and route
        var stop = $interval(loadVessel, 300000);

        //Make sure that all subscribers for vessel and route data have been registered before loading data
        $timeout(function () {
            $scope.$apply(function () {
                loadVessel();
            });
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