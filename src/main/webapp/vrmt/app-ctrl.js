function FactorAssessmentViewModel(param) {
    this.factor = param.factor;
    this.choices = param.values;
    this.model = param.value;
    this.hasChoices = param.values && param.values.length > 0;
    this.minIndex = param.minIndex;
    this.maxIndex = param.maxIndex;
}
FactorAssessmentViewModel.prototype.toFactorAssessment = function () {
    return new FactorAssessment({
        factor: this.factor,
        value: this.model.text,
        index: this.model.index
    });
};

angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', 'MapService', 'RouteService', 'VesselService', 'RiskAssessmentService', '$modal',
        function ($scope, $http, $window, $timeout, MapService, RouteService, VesselService, RiskAssessmentService, $modal) {

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

            /**
             * Load data
             */
            VesselService.details(mmsi, function (v) {
                console.log("Got vessel info for " + mmsi);
                $scope.vessel = v;
            });

            RouteService.getActive(mmsi, function (r) {
                $scope.route = r;
                $scope.assessmentLocationState['route'] = r;
                // loadLatestAssessments();
            });

            function loadLatestAssessments() {
                RiskAssessmentService.getLatestRiskAssessmentsForRoute($scope.route.id)
                    .then(function (assessments) {
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
                    loadLatestAssessments();
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
                hidden: false,
                toggleVisibility: function () {
                    this.hidden = !this.hidden;
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
                this.factorAssessments = assessment.factorAssessments || [];
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
                        return fa.toFactorAssessment()
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
                    this.hide = false;
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
                factorAssessments: [
                    new FactorAssessmentViewModel({
                        factor: '1. Regions',
                        values: [
                            {text: 'Region AA', index: 40},
                            {text: 'Region BA', index: 160},
                            {text: 'Region CA', index: 200},
                            {text: 'Region DA', index: 30},
                            {text: 'Region EA', index: 500},
                            {text: 'Special area 1A', index: 300},
                            {text: 'Special area 2A', index: 140},
                            {text: 'Special area 3A', index: 300},
                            {text: 'Special area 4A', index: 200}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '2. Time of the season',
                        values: [
                            {text: 'May', index: 300},
                            {text: 'June', index: 200},
                            {text: 'July', index: 50},
                            {text: 'August', index: 25},
                            {text: 'September', index: 140}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '3. Landing sites',
                        values: [
                            {text: 'Nuuk', index: 300},
                            {text: 'Longyearbyen', index: 300},
                            {text: 'Sorgfjorden', index: 500},
                            {text: 'Paamiut', index: 200},
                            {text: 'Quaqortoq', index: 50},
                            {text: 'Nanortalik', index: 25},
                            {text: 'Kulusuk', index: 340},
                            {text: 'Tasiilaq', index: 450}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '4. Tide',
                        values: [
                            {text: 'HW Spring', index: 300},
                            {text: 'HW Nip', index: 100},
                            {text: 'LW Spring', index: 50},
                            {text: 'LW Nip', index: 80}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '5. Current Expected',
                        values: [
                            {text: 'No current, slack', index: 0},
                            {text: 'Weak current', index: 40},
                            {text: 'Medium current', index: 100},
                            {text: 'Strong current', index: 400}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '6. Distance to SAR facilities, other ships',
                        values: [
                            {text: '10 nm One vessel', index: 10},
                            {text: '20 nm One vessel', index: 20},
                            {text: '40 nm One vessel', index: 35},
                            {text: '60 nm One vessel', index: 55},
                            {text: '80 nm One vessel', index: 80},
                            {text: '100 nm One vessel', index: 110},
                            {text: '120 nm One vessel', index: 140},
                            {text: '140 nm One vessel', index: 190},
                            {text: '160 nm One vessel', index: 270},
                            {text: '180 nm One vessel', index: 500},
                            {text: '200 nm One vessel', index: 800},
                            {text: '10 nm Two vessels', index: 10},
                            {text: '20 nm Two vessels', index: 15},
                            {text: '40 nm Two vessels', index: 30},
                            {text: '60 nm Two vessels', index: 40},
                            {text: '80 nm Two vessels', index: 60},
                            {text: '100 nm Two vessels', index: 80},
                            {text: '120 nm Two vessels', index: 115},
                            {text: '140 nm Two vessels', index: 155},
                            {text: '160 nm Two vessels', index: 205},
                            {text: '180 nm Two vessels', index: 260},
                            {text: '200 nm Two vessels', index: 320},
                            {text: '220 nm Two vessels', index: 400},
                            {text: '240 nm Two vessels', index: 750},
                            {text: '10 nm Three or more vessels', index: 10},
                            {text: '20 nm Three or more vessels', index: 15},
                            {text: '40 nm Three or more vessels', index: 20},
                            {text: '60 nm Three or more vessels', index: 25},
                            {text: '80 nm Three or more vessels', index: 40},
                            {text: '100 nm Three or more vessels', index: 55},
                            {text: '120 nm Three or more vessels', index: 80},
                            {text: '140 nm Three or more vessels', index: 100},
                            {text: '160 nm Three or more vessels', index: 135},
                            {text: '180 nm Three or more vessels', index: 170},
                            {text: '200 nm Three or more vessels', index: 220},
                            {text: '220 nm Three or more vessels', index: 280},
                            {text: '240 nm Three or more vessels', index: 340},
                            {text: '260 nm Three or more vessels', index: 410},
                            {text: '300 nm Three or more vessels', index: 500}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '7. Ice cover and type of ice',
                        values: [
                            {text: '1/10 - One year sea ice', index: 0},
                            {text: '2/10 - One year sea ice', index: 10},
                            {text: '3/10 - One year sea ice', index: 30},
                            {text: '4/10 - One year sea ice', index: 50},
                            {text: '5/10 - One year sea ice', index: 150},
                            {text: '6/10 - One year sea ice', index: 250},
                            {text: '7/10 - One year sea ice', index: 500},
                            {text: '8/10 - One year sea ice', index: 1200},
                            {text: '9/10 - One year sea ice', index: 2000},
                            {text: '10/10 - One year sea ice', index: 2000},
                            {text: '+10/10 - One year sea ice', index: 2000},
                            {text: '1/10 - Two-three year sea ice', index: 30},
                            {text: '2/10 - Two-three year sea ice', index: 50},
                            {text: '3/10 - Two-three year sea ice', index: 150},
                            {text: '4/10 - Two-three year sea ice', index: 250},
                            {text: '5/10 - Two-three year sea ice', index: 500},
                            {text: '6/10 - Two-three year sea ice', index: 1200},
                            {text: '7/10 - Two-three year sea ice', index: 2000},
                            {text: '8/10 - Two-three year sea ice', index: 2000},
                            {text: '9/10 - Two-three year sea ice', index: 2000},
                            {text: '10/10 - Two-three year sea ice', index: 2000},
                            {text: '+10/10 - Two-three year sea ice', index: 2000},
                            {text: '1/10 - Multi year sea ice', index: 50},
                            {text: '2/10 - Multi year sea ice', index: 100},
                            {text: '3/10 - Multi year sea ice', index: 500},
                            {text: '4/10 - Multi year sea ice', index: 1000},
                            {text: '5/10 - Multi year sea ice', index: 2000},
                            {text: '6/10 - Multi year sea ice', index: 2000},
                            {text: '7/10 - Multi year sea ice', index: 2000},
                            {text: '8/10 - Multi year sea ice', index: 2000},
                            {text: '9/10 - Multi year sea ice', index: 2000},
                            {text: '10/10 - Multi year sea ice', index: 2000},
                            {text: '+10/10 - Multi year sea ice', index: 2000},
                            {text: '1/10 - Growler', index: 30},
                            {text: '2/10 - Growler', index: 50},
                            {text: '3/10 - Growler', index: 250},
                            {text: '4/10 - Growler', index: 500},
                            {text: '5/10 - Growler', index: 1000},
                            {text: '6/10 - Growler', index: 2000},
                            {text: '7/10 - Growler', index: 2000},
                            {text: '8/10 - Growler', index: 2000},
                            {text: '9/10 - Growler', index: 2000},
                            {text: '10/10 - Growler', index: 2000},
                            {text: '+10/10 - Growler', index: 2000},
                            {text: '1/10 - Bergy Bits', index: 50},
                            {text: '2/10 - Bergy Bits', index: 100},
                            {text: '3/10 - Bergy Bits', index: 500},
                            {text: '4/10 - Bergy Bits', index: 1000},
                            {text: '5/10 - Bergy Bits', index: 2000},
                            {text: '6/10 - Bergy Bits', index: 2000},
                            {text: '7/10 - Bergy Bits', index: 2000},
                            {text: '8/10 - Bergy Bits', index: 2000},
                            {text: '9/10 - Bergy Bits', index: 2000},
                            {text: '10/10 - Bergy Bits', index: 2000},
                            {text: '+10/10 - Bergy Bits', index: 2000},
                            {text: '1/10 - Ice berg', index: 50},
                            {text: '2/10 - Ice berg', index: 100},
                            {text: '3/10 - Ice berg', index: 1000},
                            {text: '4/10 - Ice berg', index: 2000},
                            {text: '5/10 - Ice berg', index: 2000},
                            {text: '6/10 - Ice berg', index: 2000},
                            {text: '7/10 - Ice berg', index: 2000},
                            {text: '8/10 - Ice berg', index: 2000},
                            {text: '9/10 - Ice berg', index: 2000},
                            {text: '10/10 - Ice berg', index: 2000},
                            {text: '+10/10 - Ice berg', index: 2000}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '8. Wind speed',
                        values: [
                            {text: '0', index: 0},
                            {text: '1', index: 5},
                            {text: '2', index: 10},
                            {text: '3', index: 25},
                            {text: '4', index: 45},
                            {text: '5', index: 75},
                            {text: '6', index: 110},
                            {text: '7', index: 150},
                            {text: '8', index: 200},
                            {text: '9', index: 400},
                            {text: '10', index: 900},
                            {text: '11', index: 2000},
                            {text: '12', index: 2000}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '9. Air temperature',
                        values: [
                            {text: '10', index: 0},
                            {text: '5', index: 0},
                            {text: '0', index: 0},
                            {text: '-5', index: 50},
                            {text: '-10', index: 100},
                            {text: '-15', index: 175},
                            {text: '-20', index: 250},
                            {text: '-25', index: 500},
                            {text: '-30', index: 1000}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '10. Sea conditions',
                        values: [
                            {text: '0m', index: 0},
                            {text: '1m', index: 50},
                            {text: '2m', index: 125},
                            {text: '3m', index: 225},
                            {text: '4m', index: 325},
                            {text: '5m', index: 425},
                            {text: '6m', index: 540},
                            {text: '7m', index: 675},
                            {text: '8m', index: 825},
                            {text: '9m', index: 1000},
                            {text: '10m', index: 1200},
                            {text: '11m', index: 1350},
                            {text: '12m', index: 1500},
                            {text: '13m', index: 1600},
                            {text: '14m', index: 1675},
                            {text: '15m', index: 1750},
                            {text: '16m', index: 1800},
                            {text: '17m', index: 1850},
                            {text: '18m', index: 1900},
                            {text: '19m', index: 1950}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '11. Visibility',
                        values: [
                            {text: '10nm', index: 0},
                            {text: '9nm', index: 0},
                            {text: '8nm', index: 0},
                            {text: '7nm', index: 0},
                            {text: '6nm', index: 5},
                            {text: '5nm', index: 10},
                            {text: '4nm', index: 15},
                            {text: '3nm', index: 25},
                            {text: '2nm', index: 35},
                            {text: '1nm', index: 45},
                            {text: '0.9nm', index: 55},
                            {text: '0.8nm', index: 70},
                            {text: '0.7nm', index: 85},
                            {text: '0.6nm', index: 100},
                            {text: '0.5nm', index: 120},
                            {text: '0.4nm', index: 140},
                            {text: '0.3nm', index: 175},
                            {text: '0.2nm', index: 225},
                            {text: '0.1nm', index: 500},
                            {text: '0nm', index: 1000}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '12. Quality of maps',
                        values: [
                            {text: 'ENC full detail', index: 0},
                            {text: 'Old meassurements', index: 100},
                            {text: 'No map', index: 500}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '13. Daylight',
                        values: [
                            {text: 'Morning nautical twilight', index: 50},
                            {text: 'Evening nautical twilight', index: 50},
                            {text: 'Night', index: 100},
                            {text: 'Day', index: 0}
                        ],
                        value: {text: '-', index: 0}
                    }),
                    new FactorAssessmentViewModel({
                        factor: '14. Miscellaneous',
                        value: {text: '-', index: 0},
                        minIndex: 0,
                        maxIndex: 500
                    })
                ]
            };

            /**
             * timeline control
             */
            $scope.timeline = {
                hidden: false
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
             * Map state and layers
             */
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();


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
                    assessmentLocationParameters.routeId = $scope.route.id;
                    RiskAssessmentService.createAssessmentLocation(assessmentLocationParameters)
                        .then(function (location) {
                            $scope.newAssessmentLocation = location;
                        });
                }, function (dismissReason) {
                    console.log("assessment Location dismissed with reason '" + dismissReason + "'");
                })
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