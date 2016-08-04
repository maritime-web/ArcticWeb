angular.module('vrmt.app')

    .controller("SidebarController", ['$scope', 'RouteService', 'ScheduleService',
        function ($scope, RouteService, ScheduleService) {

            function RouteView(params) {
                this.name = params.route.name;
                this.routeId = params.route.id;
            }

            RouteView.prototype.choose = function () {
                $scope.sidebar.routeDropdownOpen = false;
                RouteService.getRoute(this.routeId, function (route) {
                    $scope.fireRouteChange(route);
                });
            };

            $scope.sidebar = {
                monitorAndReportActive: false,
                safetyMeasuresActive: false,
                decisionMakingActive: false,
                logOfMeasuresAndReportsActive: false,
                latestAssessmentsActive: false,
                hidden: false,
                toggleVisibility: function () {
                    this.hidden = !this.hidden;
                },
                configure: function () {
                    $scope.editorActivator.showAssessmentFactorEditor += 1;
                },
                routeDropdownOpen: false,
                routeDropdownClicked: function () {
                    this.routeDropdownOpen = !this.routeDropdownOpen;
                    if (this.routeDropdownOpen) {
                        this.showRouteChoices()
                    }
                },
                routeDropdownClose: function () {
                    this.routeDropdownOpen = false;
                },
                showRouteChoices: function () {
                    ScheduleService.getYourSchedule($scope.mmsi, function (schedule) {
                        $scope.sidebar.routeViews = schedule.voyages
                            .map(function (voyage) {
                                return voyage.route ? new RouteView(voyage) : null;
                            })
                            .filter(function (elem) {
                                return elem != null;
                            });
                    }, function (error) {
                        console.log(error);
                    });
                },
                routeViews: [],
                meta: {
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
                }
            };

            function AssessmentView(assessment) {
                this.assessment = assessment;
                this.location = assessment.location;
                this.locationId = assessment.location.id;
                this.locationName = assessment.location.id + '. ' + assessment.location.name;
                this.index = assessment.index || '-';
                this.lastAssessed = assessment.time || '-';
                this.factorAssessments = assessment.scores || [];
            }

            $scope.$watch('latestRiskAssessments', function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.sidebar.meta.assessmentViews = [];
                    $scope.sidebar.meta.currentAssessment = null;
                    var currentLocationId = $scope.assessmentLocationState['chosen'] ? $scope.assessmentLocationState['chosen'].location.id : -1;
                    newValue.forEach(function (assessment) {
                        var assessmentView = new AssessmentView(assessment);
                        $scope.sidebar.meta.assessmentViews.push(assessmentView);
                        if (assessment.location.id === currentLocationId) {
                            $scope.sidebar.meta.currentAssessment = assessmentView;
                            $scope.assessmentLocationState['chosen'] = assessment;
                        }
                    });

                    if (!$scope.sidebar.meta.currentAssessment && $scope.sidebar.meta.assessmentViews.length > 0) {
                        $scope.sidebar.meta.currentAssessment = $scope.sidebar.meta.assessmentViews[0];
                        $scope.assessmentLocationState['chosen'] = newValue[0];
                    }
                }
            });

            $scope.$watch('route', function (newRoute, oldRoute) {
                if (newRoute && newRoute !== oldRoute) {
                    $scope.sidebar.meta.routeView = {id: newRoute.id, name: newRoute.name};
                }
            });

            $scope.$watch('vessel', function (newVessel) {
                if (newVessel && newVessel.aisVessel) {
                    $scope.sidebar.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
                }
            });

            $scope.$watch("assessmentLocationState['chosen']", function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.sidebar.meta.currentAssessment = new AssessmentView(newValue);
                }
            });
        }]);