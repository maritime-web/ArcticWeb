(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .constant('Events', {
            AssessmentCreated: "AssessmentCreated",
            AssessmentDeleted: "AssessmentDeleted",
            AssessmentLocationCreated: "AssessmentLocationCreated",
            AssessmentLocationDeleted: "AssessmentLocationDeleted",
            RouteChanged: "RouteChanged",
            VesselLoaded: "VesselLoaded",
            LatestRiskAssessmentsLoaded: "LatestRiskAssessmentsLoaded",
            OpenAssessmentEditor: "OpenAssessmentEditor",
            OpenAssessmentFactorEditor: "OpenAssessmentFactorEditor",
            AssessmentLocationChosen: "AssessmentLocationChosen",
            AssessmentLocationClicked: "AssessmentLocationClicked",
            VesselClicked: "VesselClicked",
            AddAssessmentLocation: "AddAssessmentLocation"
        })
        .controller("AppController", AppController);

    AppController.$inject = ['$scope', '$interval', 'RouteService', 'VesselService', 'RiskAssessmentService', 'NotifyService', 'Events', '$timeout'];

    function AppController($scope, $interval, RouteService, VesselService, RiskAssessmentService, NotifyService, Events, $timeout) {
        var vm = this;
        $scope.mmsi = embryo.authentication.shipMmsi;
        vm.route = {};
        vm.chosenAssessment = null;

        /**
         * Load data
         */
        function loadVessel() {
            VesselService.details($scope.mmsi, function (v) {
                NotifyService.notify(Events.VesselLoaded, v);
            });
        }

        function loadLatestAssessments(assessmentLocationToChoose) {
            RiskAssessmentService.getLatestRiskAssessmentsForRoute($scope.route.id)
                .then(function (assessments) {
                    if (assessments.length === 0) return;

                    if (assessmentLocationToChoose) {
                        vm.chosenAssessment = assessments.find(function (assessment) {
                            return assessmentLocationToChoose.id === assessment.location.id;
                        });
                    } else {
                        vm.chosenAssessment = assessments[0];
                    }

                    NotifyService.notify(Events.LatestRiskAssessmentsLoaded, assessments);
                    NotifyService.notify(Events.AssessmentLocationChosen, vm.chosenAssessment);
                })
        }

        /**
         * Reload data when Rute changes
         */
        NotifyService.subscribe($scope, Events.RouteChanged, onRouteChanged);
        function onRouteChanged(event, newRoute) {
            $scope.route = newRoute;
            loadLatestAssessments();
        }

        /**
         * Reload data when CRUD operations have been performed
         */
        NotifyService.subscribe($scope, Events.AssessmentCreated, onAssessmentCRUD);
        NotifyService.subscribe($scope, Events.AssessmentDeleted, onAssessmentCRUD);
        function onAssessmentCRUD() {
            loadLatestAssessments(vm.chosenAssessment.location);
        }

        NotifyService.subscribe($scope, Events.AssessmentLocationCreated, onAssessmentLocationCreated);
        function onAssessmentLocationCreated(event, newLocation) {
            loadLatestAssessments(newLocation);
        }

        NotifyService.subscribe($scope, Events.AssessmentLocationDeleted, onAssessmentLocationDeleted);
        function onAssessmentLocationDeleted() {
            loadLatestAssessments();
        }


        NotifyService.subscribe($scope, Events.AssessmentLocationChosen, onAssessmentLocationChosen);
        function onAssessmentLocationChosen(event, chosen) {
            vm.chosenAssessment = chosen;
        }

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