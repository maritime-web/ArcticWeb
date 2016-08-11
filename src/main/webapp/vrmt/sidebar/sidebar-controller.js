(function () {

    angular
        .module('vrmt.app')
        .controller("SidebarController", SidebarController);

    SidebarController.$inject = ['$scope', 'RouteService', 'ScheduleService'];

    function SidebarController($scope, RouteService, ScheduleService) {
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
                $scope.assessmentLocationState['chosen'] = assessmentView.assessment;
            },
            newAssessment: function () {
                $scope.editorActivator.showAssessmentEditor += 1;
            }
        };

        function RouteView(params) {
            this.name = params.route.name;
            this.routeId = params.route.id;
        }

        RouteView.prototype.choose = function () {
            vm.routeDropdownOpen = false;
            RouteService.getRoute(this.routeId, function (route) {
                $scope.fireRouteChange(route);
            });
        };


        function toggleVisibility() {
            vm.hidden = !vm.hidden;
        }

        function configure() {
            $scope.editorActivator.showAssessmentFactorEditor += 1;
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

        $scope.$watch("assessmentLocationState['latestRiskAssessments']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                vm.meta.assessmentViews = [];
                vm.meta.currentAssessment = null;
                var currentLocationId = $scope.assessmentLocationState['chosen'] ? $scope.assessmentLocationState['chosen'].location.id : -1;
                newValue.forEach(function (assessment) {
                    var assessmentView = new AssessmentView(assessment);
                    vm.meta.assessmentViews.push(assessmentView);
                    if (assessment.location.id === currentLocationId) {
                        vm.meta.currentAssessment = assessmentView;
                        $scope.assessmentLocationState['chosen'] = assessment;
                    }
                });

                if (!vm.meta.currentAssessment && vm.meta.assessmentViews.length > 0) {
                    vm.meta.currentAssessment = vm.meta.assessmentViews[0];
                    $scope.assessmentLocationState['chosen'] = newValue[0];
                }
            }
        });

        $scope.$watch('route', function (newRoute, oldRoute) {
            if (newRoute && newRoute !== oldRoute) {
                vm.meta.routeView = {id: newRoute.id, name: newRoute.name};
            }
        });

        $scope.$watch('vessel', function (newVessel) {
            if (newVessel && newVessel.aisVessel) {
                vm.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
            }
        });

        $scope.$watch("assessmentLocationState['chosen']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                vm.meta.currentAssessment = new AssessmentView(newValue);
            }
        });
    }
})();