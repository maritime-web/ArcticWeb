(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("SidebarController", SidebarController);

    SidebarController.$inject = ['$scope', 'RiskAssessmentService', 'RouteService', 'ScheduleService', 'NotifyService', 'VrmtEvents'];

    function SidebarController($scope, RiskAssessmentService, RouteService, ScheduleService, NotifyService, VrmtEvents) {
        var vm = this;
        vm.monitorAndReportActive = false;
        vm.safetyMeasuresActive = false;
        vm.decisionMakingActive = false;
        vm.logOfMeasuresAndReportsActive = false;
        vm.hidden = false;
        vm.toggleVisibility = toggleVisibility;
        vm.configure = configure;
        vm.routeDropdownOpen = false;
        vm.routeDropdownClicked = routeDropdownClicked;
        vm.routeDropdownClose = routeDropdownClose;
        vm.showRouteChoices = showRouteChoices;
        vm.routeViews = [];
        vm.meta = {
            mmsi: $scope.mmsi,
            vesselName: null,
            routeView: {routeId: null, name: null}
        };

        /**
         * Log of measures and reports
         */
        vm.assessments = [];


        function RouteView(params) {
            var originalRoute = params.route ? params.route : params;
            this.name = originalRoute.name;
            this.from = originalRoute.dep;
            this.to = originalRoute.des;
            this.etaDep = originalRoute.etaDep ? moment(originalRoute.etaDep).utc().format("YYYY-MM-DD HH:mm UTC") : null;
            this.routeId = originalRoute.id;
        }

        RouteView.prototype.choose = function () {
            vm.routeDropdownOpen = false;
            RouteService.getRoute(this.routeId, function (route) {
                RiskAssessmentService.updateCurrentRoute(route);
            });
        };

        function CompletedAssessmentView(completedAssessment) {
            this.assessment = completedAssessment;
            this.finished = completedAssessment.finished.format("YYYY-MM-DD HH:mm");
            this.maxIndex = completedAssessment.getMaxScore();
        }

        CompletedAssessmentView.prototype.showDetails = function () {
            NotifyService.notify(VrmtEvents.OpenAssessmentView, this.assessment);
        };

        function toggleVisibility() {
            vm.hidden = !vm.hidden;
        }

        function configure() {
            NotifyService.notify(VrmtEvents.OpenAssessmentFactorEditor);
        }

        function routeDropdownClicked() {
            vm.routeDropdownOpen = !vm.routeDropdownOpen;
            if (vm.routeDropdownOpen) {
                vm.showRouteChoices()
            }
        }

        function routeDropdownClose() {
            vm.routeDropdownOpen = false;
        }

        function showRouteChoices() {
            ScheduleService.getYourSchedule($scope.mmsi, function (schedule) {
                vm.routeViews = schedule.voyages
                    .map(function (voyage) {
                        return voyage.route ? new RouteView(voyage) : null;
                    })
                    .filter(function (elem) {
                        return elem !== null;
                    });
            }, function (error) {
                console.log(error);
            });
        }

        NotifyService.subscribe($scope, VrmtEvents.RouteChanged, onRouteChange);
        function onRouteChange(event, newRoute) {
            vm.meta.routeView = new RouteView(newRoute);
            loadCompletedAssessments();
        }

        NotifyService.subscribe($scope, VrmtEvents.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            vm.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
        }

        NotifyService.subscribe($scope, VrmtEvents.AssessmentCompleted, loadCompletedAssessments);

        function loadCompletedAssessments() {
            RiskAssessmentService.getCompletedAssessments()
                .then(function (completedAssessments) {
                    vm.assessments = completedAssessments.map(function (assessment) {
                        return new CompletedAssessmentView(assessment);
                    });
                });
        }
    }
})();