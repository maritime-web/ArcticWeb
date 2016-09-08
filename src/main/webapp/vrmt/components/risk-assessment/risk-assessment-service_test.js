'use strict';

describe('RiskAssessmentService', function () {
    //Class under test
    var cut;

    var dataService;

    //Test data
    var routeId, scores, location, locationAssessment, assessmentOne, assessmentTwo, emptyData, withCurrentAssessment;

    //angular stuf
    var $q, $rootScope;

    //Utilities
    var latestAssessments;
    var storeLatestAssessments = function (data) {
        latestAssessments = data;
    };

    function getFunctionRejectingWith(reason) {
        return function () {
            return $q.reject(reason);
        }
    }

    function getFunctionResolving(data) {
        return function () {
            return $q.when(data);
        }
    }

    function initializeTestData() {
        routeId = "1qw2";
        scores = [
            {
                "riskFactor": {
                    "vesselId": "220443000",
                    "name": "1. Regions",
                    "scoringOptions": [
                        {
                            "name": "Region AA",
                            "index": 40
                        }
                    ]
                },
                "index": 0,
                "factorName": "1. Regions",
                "name": "-"
            }
        ];
        location = {
            "routeId": "44ce72c0-3d44-411f-a19f-c412b10cda22",
            "id": 1,
            "name": "Nuuk",
            "eta": moment(),
            "lat": 64.16990200118559,
            "lon": -51.72088623046876
        };
        locationAssessment = new LocationAssessment({time: moment(), routeLocation: location, scores: []});
        assessmentOne = new Assessment({id: 1, routeId: location.routeId, started: moment(), finished: moment(), locationsToAssess: [location], locationAssessments: [[location.id, locationAssessment]]});

        assessmentTwo = {
            "id": 2,
            "time": "2016-06-27T13:19:37.235Z",
            "location": location,
            "scores": [
                {
                    "riskFactor": {
                        "vesselId": "220443000",
                        "name": "1. Regions",
                        "scoringOptions": [
                            {
                                "name": "Region AA",
                                "index": 40
                            }
                        ]
                    },
                    "index": 0,
                    "factorName": "1. Regions",
                    "name": "-"
                }
            ],
            "index": 120
        };
        emptyData = {
            routeLocationSequence: 1,
            routeLocations: [],
            currentAssessment: null,
            assessments: []
        };
        withCurrentAssessment = {
            routeLocationSequence: 1,
            routeLocations: [location],
            currentAssessment: assessmentOne,
            assessments: []
        };
    }

    beforeEach(initializeTestData);
    beforeEach(module('vrmt.app'));
    beforeEach(inject(function (RiskAssessmentService, RiskAssessmentDataService, _$q_, _$rootScope_) {
        cut = RiskAssessmentService;
        $q = _$q_;
        $rootScope = _$rootScope_;
        dataService = RiskAssessmentDataService;
    }));

    describe('createLocationAssessment', function () {
        it('should call RiskAssessmentDataService.storeAssessmentData with an updated current assessment', function () {
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving(withCurrentAssessment));
            spyOn(dataService, "storeAssessmentData").and.callFake(getFunctionResolving());

            cut.createLocationAssessment(location.routeId, location.id, scores);

            $rootScope.$apply();

            expect(dataService.storeAssessmentData).toHaveBeenCalledWith(location.routeId, jasmine.anything());

            var dataToStore = dataService.storeAssessmentData.calls.argsFor(0)[1];
            expect(dataToStore.currentAssessment.getLocationAssessment(location.id).scores).toEqual(scores);
        });

        it('should fail if no data found', function () {
            var capturedErrorReason = undefined;
            var expectedErrorReason = "Error retrieving data";
            dataService.getAssessmentData = getFunctionRejectingWith(expectedErrorReason);

            cut.createLocationAssessment(location.routeId, location.id, scores)
                .catch(function (reason) {
                    capturedErrorReason = reason;
                });

            $rootScope.$apply();

            expect(capturedErrorReason).toEqual(expectedErrorReason);
        });

        it('should fail if data can not be stored', function () {
            var capturedErrorReason = undefined;
            var expectedErrorReason = "Error storing data";
            dataService.storeAssessmentData = getFunctionRejectingWith(expectedErrorReason);
            dataService.getAssessmentData = getFunctionResolving(withCurrentAssessment);

            cut.createLocationAssessment(location.routeId, location.id, scores)
                .catch(function (reason) {
                    capturedErrorReason = reason;
                });

            $rootScope.$apply();

            expect(capturedErrorReason).toEqual(expectedErrorReason);
        });

        it('should return the new assessment', function () {
            var theNewAssessment = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving(withCurrentAssessment);

            cut.createLocationAssessment(location.routeId, location.id, scores)
                .then(function (data) {
                    theNewAssessment = data;
                });

            $rootScope.$apply();

            expect(theNewAssessment).toBeDefined();
        });

        it('should return assessment containing a score named - Special area 1A -', function () {
            var theNewAssessment = undefined;
            var expectedName = "Special area 1A";
            scores[0].name = expectedName;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving(withCurrentAssessment);

            cut.createLocationAssessment(location.routeId, location.id, scores)
                .then(function (data) {
                    theNewAssessment = data;
                });

            $rootScope.$apply();

            expect(theNewAssessment.scores[0].name).toEqual(expectedName);
        });

    });

    describe('createRouteLocation', function () {
        it('should return the new location', function () {
            var theNewlocation = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving({
                routeLocationSequence: 1,
                routeLocations: [],
                currentAssessment: null,
                assessments: []
            });

            var route = createTestRoute();
            cut.createRouteLocation(route, {name: "a", lat: -21, lon: 73})
                .then(function (data) {
                    theNewlocation = data;
                })
                .catch(function (e) {
                    throw e;
                });

            $rootScope.$apply();

            expect(theNewlocation).toBeDefined();
        });

    });

    function createTestRoute() {
        return {
            id: "nice route id",
            etaDep: new Date(2016, 3, 30),
            wps: [
                {latitude: -20, longitude: 70, speed: 4, eta: new Date(2016, 3, 30)},
                {latitude: -21, longitude: 73, speed: 4, eta: new Date(2016, 3, 31, 23, 51)},
                {latitude: -22, longitude: 75, eta: new Date(2016, 4, 1, 13)}
            ]
        };
    }

});
