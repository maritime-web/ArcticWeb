(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .constant('Events', {
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
        .controller("AppController", AppController);

    AppController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'NotifyService', 'Events', '$timeout', 'growl'];

    function AppController($scope, $interval, RouteService, VesselService, RiskAssessmentService, NotifyService, Events, $timeout, growl) {
        var vm = this;
        $scope.mmsi = embryo.authentication.shipMmsi;
        vm.chosenRouteLocation = null;

        /**
         * Load data
         */
        function loadVessel() {
            VesselService.details($scope.mmsi, function (v) {
                NotifyService.notify(Events.VesselLoaded, v);
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
                    NotifyService.notify(Events.AssessmentUpdated, currentAssessment);
                    NotifyService.notify(Events.RouteLocationChosen, vm.chosenRouteLocation);
                })
                .catch(function (reason) {
                    loadRouteLocations();
                });
        }

        function loadRouteLocations() {
            RiskAssessmentService.getRouteLocations()
                .then(function (routeLocations) {
                    NotifyService.notify(Events.RouteLocationsLoaded, routeLocations);
                    if (routeLocations.length > 0) {
                        NotifyService.notify(Events.RouteLocationChosen, routeLocations[0]);
                    }
                })
                .catch(function (err) {
                    growl.error(err);
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

        //reload of vessel and route
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