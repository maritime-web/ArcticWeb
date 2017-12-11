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
        routeId = "44ce72c0-3d44-411f-a19f-c412b10cda22";
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
            "routeId": routeId,
            "id": 1,
            "name": "Nuuk",
            "eta": moment().utc(),
            "lat": 64.16990200118559,
            "lon": -51.72088623046876
        };
        locationAssessment = new LocationAssessment({time: moment().utc(), routeLocation: location, scores: []});
        assessmentOne = new Assessment({
            id: 1,
            routeId: location.routeId,
            started: moment().utc(),
            finished: moment().utc(),
            locationsToAssess: [location],
            locationAssessments: [[location.id, locationAssessment]]
        });

        assessmentTwo = new Assessment({
            id: 2,
            routeId: location.routeId,
            started: moment().utc(),
            finished: moment().utc(),
            locationsToAssess: [location],
            locationAssessments: [[location.id, locationAssessment]]
        });
        emptyData = {
            routeLocationSequence: 1,
            routeLocations: [],
            currentAssessment: null,
            currentRoute: createTestRoute(),
            assessments: []
        };
        withCurrentAssessment = {
            routeLocationSequence: 1,
            routeLocations: [location],
            currentAssessment: assessmentOne,
            currentRoute: createTestRoute(),
            assessments: []
        };

    }

    beforeEach(initializeTestData);
    beforeEach(function () {
            try {
                module('vrmt.app');
            } catch (e) {
                console.log(e.message);
            }

        }
    );
    beforeEach(function () {
        module(function ($provide) {
            var RiskAssessmentDataService = {
                getAssessmentData: getFunctionRejectingWith("DUMMY IMPLEMENTATION REJECT 'getAssessmentData'"),
                storeAssessmentData: getFunctionRejectingWith("DUMMY IMPLEMENTATION REJECT 'storeAssessmentData'")
            };
            $provide.value('RiskAssessmentDataService', RiskAssessmentDataService);
        })
    });

    beforeEach(function () {
            inject(function (RiskAssessmentService, RiskAssessmentDataService, _$q_, _$rootScope_) {
                cut = RiskAssessmentService;
                $q = _$q_;
                $rootScope = _$rootScope_;
                dataService = RiskAssessmentDataService;
            })
        }
    );

    describe('updateCurrentRoute', function () {
        it('should store the given route as current route', function () {
            spyOn(dataService, "storeAssessmentData").and.callFake(getFunctionResolving());
            dataService.getAssessmentData = getFunctionResolving(withCurrentAssessment);

            var route = createTestRoute();
            cut.updateCurrentRoute(route).then(function () {

            }).catch(function (e) {
                console.log(e.message);
                console.log(e);
            });

            $rootScope.$apply();

            expect(dataService.storeAssessmentData).toHaveBeenCalledWith(route.id, jasmine.anything());
        });

    });

    describe('createLocationAssessment', function () {
        it('should call RiskAssessmentDataService.storeAssessmentData with an updated current assessment', function () {
            setActiveRoute().catch(function () {/*Not nice, but active route gets set */});
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving(withCurrentAssessment));
            spyOn(dataService, "storeAssessmentData").and.callFake(getFunctionResolving());

            cut.createLocationAssessment(location.id, scores)
                .catch(function (e) {
                    fail("createLocationAssessment failed with message: " + e);
                });

            $rootScope.$apply();

            expect(dataService.storeAssessmentData).toHaveBeenCalledWith(location.routeId, jasmine.anything());

            var dataToStore = dataService.storeAssessmentData.calls.mostRecent().args[1];
            expect(dataToStore.currentAssessment.getLocationAssessment(location.id).scores).toEqual(scores);
        });

        it('should fail if no data found', function () {
            var capturedErrorReason = undefined;
            var expectedErrorReason = "Error retrieving data";
            dataService.getAssessmentData = getFunctionRejectingWith(expectedErrorReason);

            cut.createLocationAssessment(location.id, scores)
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

            cut.createLocationAssessment(location.id, scores)
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

            cut.createLocationAssessment(location.id, scores)
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

            cut.createLocationAssessment(location.id, scores)
                .then(function (data) {
                    theNewAssessment = data;
                });

            $rootScope.$apply();

            expect(theNewAssessment.scores[0].name).toEqual(expectedName);
        });

    });

    describe('createRouteLocation', function () {
        it('should return the new location', function () {
            var route = createTestRoute();
            var theNewlocation = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving({
                routeLocationSequence: 1,
                routeLocations: [],
                currentRoute: route,
                currentAssessment: null,
                assessments: []
            });

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

    describe('getCompletedAssessmentsAllRoutes', function () {
        it('should sort with latest departure first', function () {
            var assessmentDataDepartureLatest = {
                currentRoute: {
                    id: 1,
                    etaDep: new Date(2016, 3, 30)
                },
                assessments: [assessmentOne]

            };
            var assessmentDataDepartureOldest = {
                currentRoute: {
                    id: 2,
                    etaDep: new Date(2015, 3, 30)
                },
                assessments: [assessmentTwo]

            };
            dataService.getAssessmentDataForAllRoutes = getFunctionResolving([assessmentDataDepartureOldest, assessmentDataDepartureLatest]);

            var result = [];
            cut.getCompletedAssessmentsAllRoutes().then(function (res) {
                result = res;
            }).catch(function (e) {
                console.log(e.message);
                console.log(e);
            });

            $rootScope.$apply();

            expect(result[0].route.id).toEqual(1);
            expect(result[1].route.id).toEqual(2);
        });

    });

    function setActiveRoute() {
        return cut.updateCurrentRoute(createTestRoute());
    }

    function createTestRoute() {
        return {
            id: routeId,
            etaDep: new Date(2016, 3, 30),
            wps: [
                {latitude: -20, longitude: 70, speed: 4, eta: new Date(2016, 3, 30)},
                {latitude: -21, longitude: 73, speed: 4, eta: new Date(2016, 3, 31, 23, 51)},
                {latitude: -22, longitude: 75, eta: new Date(2016, 4, 1, 13)}
            ]
        };
    }

});
