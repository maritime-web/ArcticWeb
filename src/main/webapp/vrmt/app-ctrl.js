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

    AppController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'RouteLocationService', 'NotifyService', 'Events', '$timeout'];

    function AppController($scope, $interval, RouteService, VesselService, RiskAssessmentService, RouteLocationService, NotifyService, Events, $timeout) {
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
            });
        }

        function loadCurrentAssessment() {
            RiskAssessmentService.getCurrentAssessment($scope.route.id)
                .then(function (currentAssessment) {
                    if (!vm.currentLocationAssessment) {
                        vm.currentLocationAssessment = currentAssessment.locationsToAssess[0];
                    }
                    NotifyService.notify(Events.AssessmentUpdated, currentAssessment);
                    NotifyService.notify(Events.RouteLocationChosen, vm.currentLocationAssessment);
                })
                .catch(function (reason) {
                    loadRouteLocations();
                });
        }

        function loadRouteLocations() {
            RouteLocationService.getRouteLocations($scope.route.id)
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
            loadCurrentAssessment();
        }

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

        NotifyService.subscribe($scope, Events.NewAssessmentStarted, function (event, currentAssessment) {
            NotifyService.notify(Events.RouteLocationChosen, currentAssessment.locationsToAssess[0]);
        });

        //initial load of vessel and route
        var stop = $interval(loadVessel, 300000);

        //Make sure that all subscribers for vessel and route data have been registered before loading data
        $timeout(function () {
            $scope.$apply(function () {
                loadVessel();
                RouteService.getActive($scope.mmsi, function (r) {
                    NotifyService.notify(Events.RouteChanged, r);
                });
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