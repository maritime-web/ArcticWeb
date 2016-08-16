(function () {

    angular
        .module('vrmt.app')
        .controller("SidebarController", SidebarController);

    SidebarController.$inject = ['$scope', 'RouteService', 'ScheduleService', 'NotifyService', 'Events'];

    function SidebarController($scope, RouteService, ScheduleService, NotifyService, Events) {
        var vm = this;
        vm.monitorAndReportActive = false;
        vm.safetyMeasuresActive = false;
        vm.decisionMakingActive = false;
        vm.logOfMeasuresAndReportsActive = false;
        vm.latestAssessmentsActive = false;
        vm.hidden = false;
        vm.toggleVisibility = toggleVisibility;
        vm.configure = configure;
        vm.routeDropdownOpen = false;
        vm.routeDropdownClicked = routeDropdownClicked;
        vm.routeDropdownClose = routeDropdownClose;
        vm.showRouteChoices = showRouteChoices;
        vm.routeViews = [];
        vm.meta = {
            vesselName: $scope.mmsi,
            routeView: {id: null, name: null},
            assessmentViews: [],
            currentAssessment: null,
            chooseAssessment: function (assessmentView) {
                NotifyService.notify(Events.AssessmentLocationChosen, assessmentView.assessment);
            },
            newAssessment: function () {
                NotifyService.notify(Events.OpenAssessmentEditor);
            }
        };

        function RouteView(params) {
            this.name = params.route.name;
            this.routeId = params.route.id;
        }

        RouteView.prototype.choose = function () {
            vm.routeDropdownOpen = false;
            RouteService.getRoute(this.routeId, function (route) {
                NotifyService.notify(Events.RouteChanged, route);
            });
        };

        function toggleVisibility() {
            vm.hidden = !vm.hidden;
        }

        function configure() {
            NotifyService.notify(Events.OpenAssessmentFactorEditor);
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
                        return elem != null;
                    });
            }, function (error) {
                console.log(error);
            });
        }

        function AssessmentView(assessment) {
            this.assessment = assessment;
            this.location = assessment.location;
            this.locationId = assessment.location.id;
            this.locationName = assessment.location.id + '. ' + assessment.location.name;
            this.index = assessment.index || '-';
            this.lastAssessed = assessment.time || '-';
            this.factorAssessments = assessment.scores || [];
        }

        NotifyService.subscribe($scope, Events.LatestRiskAssessmentsLoaded, onLatestRiskAssessmentsLoaded);
        function onLatestRiskAssessmentsLoaded(event, assessments) {
            vm.meta.assessmentViews = [];
            vm.meta.currentAssessment = null;
            assessments.forEach(function (assessment) {
                var assessmentView = new AssessmentView(assessment);
                vm.meta.assessmentViews.push(assessmentView);
            });
        }

        NotifyService.subscribe($scope, Events.AssessmentLocationChosen, onAssessmentLocationChosen);
        function onAssessmentLocationChosen(event, chosen) {
            vm.meta.currentAssessment = getViewForAssessment(chosen);
        }

        function getViewForAssessment(assessment) {
            return vm.meta.assessmentViews.find(function (view) {
                return view.locationId === assessment.location.id;
            })
        }

        NotifyService.subscribe($scope, Events.RouteChanged, onRouteChange);
        function onRouteChange(event, newRoute) {
            vm.meta.routeView = {id: newRoute.id, name: newRoute.name};
        }

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            vm.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
        }
    }
})();