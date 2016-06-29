function FactorAssessmentViewModel(param) {
    this.riskFactor = param;
    this.name = param.name;
    this.scoreOptions = param.scoreOptions;
    this.model = {name: "-", index: 0};
    this.hasChoices = param.scoreOptions && param.scoreOptions.length > 0;
    this.minIndex = param.minIndex;
    this.maxIndex = param.maxIndex;
}
FactorAssessmentViewModel.prototype.toScore = function () {
    var chosenOptionName = this.model.name;
    var scoringOption;
    if (this.scoreOptions) {
        scoringOption = this.scoreOptions.find(function (option) {
            return option.name === chosenOptionName;
        });
    }

    return new Score({
        riskFactor: this.riskFactor,
        scoringOption: scoringOption,
        index: this.model.index
    });
};

angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', '$interval', 'MapService', 'RouteService', 'VesselService', 'RiskAssessmentService', '$modal',
        function ($scope, $http, $window, $timeout, $interval, MapService, RouteService, VesselService, RiskAssessmentService, $modal) {

            /**
             * Initialize variables
             */
            var mmsi = embryo.authentication.shipMmsi;
            $scope.vessel = {};
            $scope.route = {};
            $scope.assessmentLocationState = {};
            $scope.newAssessmentLocation = null;
            $scope.newRiskAssessment = null;
            $scope.latestRiskAssessments = [];
            // Map state and layers             
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();

            /**
             * Load data
             */
            function loadVessel() {
                VesselService.details(mmsi, function (v) {
                    if (v.aisVessel) {
                        console.log("Got vessel info for " + mmsi + " Lat: " + v.aisVessel.lat + " Lon: " + v.aisVessel.lon);
                    } else {
                        console.log("Got vessel info for " + mmsi);
                    }
                    $scope.vessel = v;
                });
            }
            loadVessel();
            var stop = $interval(loadVessel, 300000);

            RouteService.getActive(mmsi, function (r) {
                $scope.route = r;
                $scope.assessmentLocationState['route'] = r;
                // loadLatestAssessments();
            });

            function loadLatestAssessments(assessmentLocationToChoose) {
                RiskAssessmentService.getLatestRiskAssessmentsForRoute($scope.route.id)
                    .then(function (assessments) {
                        if (assessmentLocationToChoose) {
                            $scope.assessmentLocationState['chosen'] = assessments.find(function (assessment) {
                                return assessmentLocationToChoose.id === assessment.location.id;
                            });
                        }
                        $scope.latestRiskAssessments = assessments;
                    })
            }

            /**
             * Reload data when Rute changes
             */
            $scope.$watch('route', function (newRoute, oldRoute) {
                if (newRoute && newRoute !== oldRoute) {
                    console.log("Route changed: " + newRoute.name);
                    loadLatestAssessments();
                }
            });

            /**
             * Reload data when CRUD operations have been performed
             */
            $scope.$watch('newRiskAssessment', function (newValue, oldValue) {
                if (newValue && newValue != oldValue) {
                    console.log("Reloading LatestAssessments");
                    loadLatestAssessments();
                }
            });
            $scope.$watch('newAssessmentLocation', function (newValue, oldValue) {
                if (newValue && newValue != oldValue) {
                    console.log("Reloading Assessment Locations");
                    loadLatestAssessments(newValue);
                }
            });

            /**
             * Sidebar control
             */
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
                    $scope.factorConfig.show();
                },
                meta: {
                    vesselName: mmsi,
                    routeView: {id: null, name: null},
                    assessmentViews: [],
                    currentAssessment: null,
                    chooseAssessment: function (assessmentView) {
                        $scope.assessmentLocationState['chosen'] = assessmentView.assessment;
                    },
                    newAssessment: function () {
                        $scope.assessCreate.show();
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
                    console.log("Route changed: " + newRoute.name);
                    $scope.sidebar.meta.routeView = {id: newRoute.id, name: newRoute.name};
                }
            });

            $scope.$watch('vessel', function (newVessel) {
                if (newVessel && newVessel.aisVessel) {
                    $scope.sidebar.meta.vesselName = newVessel.aisVessel.name || mmsi;
                }
            });

            $scope.$watch("assessmentLocationState['chosen']", function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.sidebar.meta.currentAssessment = new AssessmentView(newValue);
                }
            });

            /**
             * assessment editor control
             */
            $scope.assessCreate = {
                hide: true,
                dismiss: function () {
                    this.hide = true;
                    this.clear();
                },
                save: function () {
                    var locationId = $scope.sidebar.meta.currentAssessment.locationId;

                    var fas = this.factorAssessments.map(function (fa) {
                        return fa.toScore();
                    });
                    RiskAssessmentService.createRiskAssessment($scope.route.id, locationId, fas)
                        .then(
                            function (result) {
                                $scope.newRiskAssessment = result;
                            },
                            function (reason) {
                                //TODO display error reason
                                console.log(reason);
                            });
                    this.hide = true;
                    this.clear();
                },
                show: function () {
                    RiskAssessmentService.getRiskFactors(mmsi).then(function (riskFactors) {
                        $scope.assessCreate.factorAssessments = riskFactors.map(function (riskFactor) {
                            return new FactorAssessmentViewModel(riskFactor);
                        });
                        $scope.assessCreate.hide = false;
                    });
                },
                clear: function () {
                    this.factorAssessments.forEach(function (f) {
                        f.model = {text: '-', index: 0};
                    })
                },
                chosenLocation: function () {
                    var ca = $scope.sidebar.meta.currentAssessment;
                    return ca ? ca.locationName : null;
                },
                sum: function () {
                    var res = 0;
                    this.factorAssessments.forEach(function (fa) {
                        res += angular.isNumber(fa.model.index) ? fa.model.index : 0;
                    });

                    return res;
                },
                factorAssessments: []
            };


            /**
             * assessment factor configuration control
             */
            $scope.factorConfig = {
                hide: true,
                show: function () {
                    this.hide = false;
                },
                dismiss: function () {
                    this.hide = true;
                },
                getVessel: function () {
                    return $scope.sidebar.meta.vesselName;
                },
                save: function (riskFactorView) {
                    RiskAssessmentService.saveRiskFactor(riskFactorView.toRiskFactor())
                        .then(function (riskFactor) {
                            console.log("Saved risk factor with id " + riskFactor.id);
                        }, function (reason) {
                            console.log(reason);
                        });
                },
                riskFactors: []
            };

            function RiskFactorView(riskFactor) {
                this.riskFactor = riskFactor;
                this.isActive = false;
                this.name = riskFactor.name;
                this.scoreOptions = riskFactor.scoreOptions;
                this.scoreInterval = riskFactor.scoreInterval
            }

            RiskFactorView.prototype.hasScoreOptions = function () {
                return (this.scoreOptions && this.scoreOptions.length > 0) || !this.scoreInterval;
            };
            RiskFactorView.prototype.deleteScoreOption = function (scoreOption) {
                var index = this.scoreOptions.indexOf(scoreOption);
                this.scoreOptions.splice(index, 1);
            };
            RiskFactorView.prototype.addScoreOption = function () {
                this.scoreOptions.push(new ScoreOption({name: '', index: 0}));
            };
            RiskFactorView.prototype.toRiskFactor = function () {
                return this.riskFactor;
            };

            RiskAssessmentService.getRiskFactors(mmsi).then(function (riskFactors) {
                $scope.factorConfig.riskFactors = riskFactors.map(function (riskFactor) {
                    return new RiskFactorView(riskFactor);
                });
            });


            /**
             * Context function control structure
             */
            $scope.contextFunctions = {
                hide: true,
                style: {position: "absolute", 'z-index': 200, top: 0, left: 0},
                functions: [
                ],
                close: function () {
                    this.hide = true;
                }
            };

            /**
             * Assessment location map functions
             */
            $scope.$watch("assessmentLocationState['locationClick']", function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.contextFunctions.style.top = newValue.y + "px";
                    $scope.contextFunctions.style.left = newValue.x + "px";
                    $scope.contextFunctions.functions = [
                        {
                            name: 'New Assesment',
                            choose: function () {
                                $scope.contextFunctions.hide = true;
                                $scope.assessCreate.show();
                            }
                        }

                    ];
                    $scope.contextFunctions.hide = false;
                }
            });


            /**
             * Vessel map functions
             */
            $scope.$watch("mapState['vesselClick']", function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    $scope.contextFunctions.style.top = newValue.y + "px";
                    $scope.contextFunctions.style.left = newValue.x + "px";
                    $scope.contextFunctions.functions = [
                        {
                            name: 'New Assesment location',
                            choose: function () {
                                $scope.contextFunctions.hide = true;
                                $scope.assessmentLocationState['new'] = {
                                    vessel: {
                                        ais: {
                                            lon: $scope.vessel.aisVessel.lon,
                                            lat: $scope.vessel.aisVessel.lat
                                        },
                                        override: {}
                                    }
                                }
                            }
                        }

                    ];
                    $scope.contextFunctions.hide = false;
                }
            });

            /**
             * timeline control
             */
            $scope.timeline = {
                hidden: true
            };
            $scope.choosenTime = 0;
            $scope.times = [];
            $scope.calculatedIndexes = createTimelineSegments();
            $scope.timelineDimensions = createDimensions();

            var offset = $scope.timelineDimensions.offset;
            var distanceBetween = 20;
            var width = $scope.timelineDimensions.width;
            for (var i = 0; (i * distanceBetween + offset) < (width - offset); i++) {
                $scope.times[i] = {
                    x1: i * distanceBetween + offset
                };
            }

            $scope.moveVessel = function ($event) {
                $event.preventDefault();
                $scope.choosenTime = $event.offsetX;
            };

            /**
             * assessment location creation
             */
            $scope.$watch("assessmentLocationState['new']", function (newAssessmentLocationEvent, oldAssessmentLocationEvent) {
                if (!newAssessmentLocationEvent || newAssessmentLocationEvent == oldAssessmentLocationEvent) return;

                var modalInstance = $modal.open({
                    templateUrl: "addAssessmentLocation",
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        event: function () {
                            return newAssessmentLocationEvent;
                        }
                    }
                });

                modalInstance.result.then(function (assessmentLocationParameters) {
                    var route = assessmentLocationParameters.route;
                    if (route) {
                        assessmentLocationParameters.lat = route.lat;
                        assessmentLocationParameters.lon = route.lon;
                    }
                    var vessel = assessmentLocationParameters.vessel;
                    if (vessel) {
                        assessmentLocationParameters.lat = vessel.ais.lat;
                        assessmentLocationParameters.lon = vessel.ais.lon;
                        var override = vessel.override;
                        if (override && override.lat && override.lon) {
                            assessmentLocationParameters.lat = override.lat;
                            assessmentLocationParameters.lon = override.lon;
                        }
                    }

                    assessmentLocationParameters.routeId = $scope.route.id;
                    RiskAssessmentService.createAssessmentLocation(assessmentLocationParameters)
                        .then(function (location) {
                            $scope.newAssessmentLocation = location;
                        });
                }, function (dismissReason) {
                    console.log("assessment Location dismissed with reason '" + dismissReason + "'");
                })
            });

            /**
             * Clean up
             */
            $scope.$on('$destroy', function() {
                console.log("Cleaning up VRMT");
                $interval.cancel(stop);
                stop = undefined;
            });
        }])

    .controller("ModalInstanceCtrl", function ($scope, $modalInstance, event) {
        $scope.loc = event;
    });

function createTimelineSegments() {
    return [
        {
            color: "#FFFF00",
            x1: 0,
            x2: 100,
            y1: 100,
            y2: 100
        },
        {
            color: "#FFFF00",
            x1: 100,
            x2: 100,
            y1: 100,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 100,
            x2: 200,
            y1: 150,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 200,
            x2: 200,
            y1: 150,
            y2: 50
        },
        {
            color: "#FF0000",
            x1: 200,
            x2: 300,
            y1: 50,
            y2: 50
        }
    ];

}

function indexToPixels(baseline, index, maxIndex) {
    return (baseline / maxIndex) * index;
}

function createDimensions() {
    var d = {};
    d.width = 600;
    d.height = 250;
    d.offset = 1;
    d.baseline = d.height - 30;
    d.yellowThreshold = indexToPixels(d.baseline, 1000, 3000);
    d.redThreshold = indexToPixels(d.baseline, 2000, 3000);
    return d;
}