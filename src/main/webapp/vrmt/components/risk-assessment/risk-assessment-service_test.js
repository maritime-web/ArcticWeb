'use strict';

describe('RiskAssessmentService', function () {
    //Class under test
    var cut;

    var dataService;

    //Test data
    var routeId;
    var scores;
    var location;
    var assessmentOne;
    var assessmentTwo;
    var locationWithNoAssessments;
    var locationWithTwoAssessments;

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
            "lat": 64.16990200118559,
            "lon": -51.72088623046876
        };
        assessmentOne = {
            "id": 1,
            "time": "2016-06-28T13:19:37.235Z",
            "location": location,
            "scores": scores,
            "index": 300
        };
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
        locationWithNoAssessments = [{
            "location": location,
            "assessments": []
        }];
        locationWithTwoAssessments = [{
            "location": location,
            "assessments": [
                assessmentOne,
                assessmentTwo
            ]
        }];
    }

    beforeEach(initializeTestData);
    beforeEach(module('vrmt.app'));
    beforeEach(inject(function (RiskAssessmentService, RiskAssessmentDataService, _$q_, _$rootScope_) {
        cut = RiskAssessmentService;
        $q = _$q_;
        $rootScope = _$rootScope_;
        dataService = RiskAssessmentDataService;
    }));

    describe('getLatestRiskAssessmentsForRoute', function () {

        it('should call RiskAssessmentDataService with routeId', function () {
            var routeId = "44ce72c0-3d44-411f-a19f-c412b10cda22";
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving([]));

            cut.getLatestRiskAssessmentsForRoute(routeId);

            expect(dataService.getAssessmentData).toHaveBeenCalledWith(routeId);
        });

        it('should return empty array when no locations exist for the given route', function () {
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving([]));

            cut.getLatestRiskAssessmentsForRoute(routeId).then(storeLatestAssessments);

            $rootScope.$apply();

            expect(latestAssessments).toEqual([]);
        });

        it('should return an assessment with no scores for unassessed locations', function () {
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving(locationWithNoAssessments));

            cut.getLatestRiskAssessmentsForRoute(routeId).then(storeLatestAssessments);

            $rootScope.$apply();

            expect(latestAssessments.length).toEqual(1);
            expect(latestAssessments[0] instanceof RiskAssessment).toBe(true);
            expect(latestAssessments[0].scores).toEqual([]);
        });

        it('should return the assessment with the most recent timestamp for each location', function () {
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving(locationWithTwoAssessments));

            cut.getLatestRiskAssessmentsForRoute(routeId).then(storeLatestAssessments);

            $rootScope.$apply();

            expect(latestAssessments[0]).toBe(assessmentOne);
        });
    });

    describe('createRiskAssessment', function () {
        it('should call RiskAssessmentDataService.storeAssessmentData with a new RiskAssessment', function () {
            spyOn(dataService, "getAssessmentData").and.callFake(getFunctionResolving(locationWithNoAssessments));
            spyOn(dataService, "storeAssessmentData").and.callFake(getFunctionResolving());

            cut.createRiskAssessment(location.routeId, location.id, scores);

            $rootScope.$apply();

            expect(dataService.storeAssessmentData).toHaveBeenCalledWith(location.routeId, jasmine.anything());

            var locationDataToStore = dataService.storeAssessmentData.calls.argsFor(0)[1];
            expect(locationDataToStore[0].assessments.length).toEqual(1);
        });

        it('should fail if no data found', function () {
            var capturedErrorReason = undefined;
            var expectedErrorReason = "Error retrieving data";
            dataService.getAssessmentData = getFunctionRejectingWith(expectedErrorReason);

            cut.createRiskAssessment(location.routeId, location.id, scores)
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
            dataService.getAssessmentData = getFunctionResolving(locationWithNoAssessments);

            cut.createRiskAssessment(location.routeId, location.id, scores)
                .catch(function (reason) {
                    capturedErrorReason = reason;
                });

            $rootScope.$apply();

            expect(capturedErrorReason).toEqual(expectedErrorReason);
        });

        it('should return the new assessment', function () {
            var theNewAssessment = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving(locationWithNoAssessments);

            cut.createRiskAssessment(location.routeId, location.id, scores)
                .then(function (data) {
                    theNewAssessment = data;
                });

            $rootScope.$apply();

            expect(theNewAssessment).toBeDefined();
        });

    });
});
