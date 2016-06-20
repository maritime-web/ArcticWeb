function AssessmentLocation(parameters) {
    this.id = parameters.id;
    this.name = parameters.name;
    this.routeId = parameters.routeId;
    this.lat = parameters.lat;
    this.lon = parameters.lon;
}

function RiskAssessment(parameters) {
    var getIndex = function (factorAssessments) {
        var accumulatedIndex = 0;
        factorAssessments.forEach(function (factorAssessment) {
            accumulatedIndex += factorAssessment.index;
        });
        return accumulatedIndex;
    };
    this.id = parameters.id;
    this.time = parameters.time;
    this.location = parameters.assessmentLocation;
    this.factorAssessments = parameters.factorAssessments;
    this.index = getIndex(this.factorAssessments);
}

function FactorAssessment(parameters) {
    this.factor = parameters.factor;
    this.value = parameters.value;
    this.index = parameters.index;
}

var dummyAssessments = [
    new RiskAssessment({
        id: 1,
        time: new Date(),
        assessmentLocation: new AssessmentLocation({
            id: 1,
            name: 'Near Nuuk',
            routeId: 123434,
            lat: 62.23,
            lon: -40.02
        }),
        factorAssessments: [
            new FactorAssessment({
                factor: 'Ice conditions',
                value: 'One year sea ice 5/10',
                index: 25
            }),
            new FactorAssessment({
                factor: 'Wind speed',
                value: '3',
                index: 25
            }),
            new FactorAssessment({
                factor: 'Air temperature',
                value: '-10',
                index: 100
            }),
            new FactorAssessment({
                factor: 'Sea conditions',
                value: '2',
                index: 125
            })
        ]
    }),
    new RiskAssessment({
        id: 2,
        time: new Date(),
        assessmentLocation: new AssessmentLocation({
            id: 2,
            name: 'Far from Nuuk',
            routeId: 123434,
            lat: 72.23,
            lon: -56.02
        }),
        factorAssessments: [
            new FactorAssessment({
                factor: 'Ice conditions',
                value: 'One year sea ice 10/10',
                index: 455
            }),
            new FactorAssessment({
                factor: 'Wind speed',
                value: '11',
                index: 250
            }),
            new FactorAssessment({
                factor: 'Air temperature',
                value: '-20',
                index: 300
            }),
            new FactorAssessment({
                factor: 'Sea conditions',
                value: '2',
                index: 125
            })
        ]
    })
];

var assessmentLocationWithNoAssessments = new AssessmentLocation({
    id: 3,
    name: 'Far out',
    routeId: 123434,
    lat: 74.23,
    lon: -58.02
});

angular.module('vrmt.app')
    .service('RiskAssessmentService', ['$q', '$window', '$timeout', function ($q, $window, $timeout) {
        'use strict';

        var getAssessmentData = function (routeId) {
            var assessmentData = $window.localStorage.getItem(routeId);
            if (assessmentData) {
                assessmentData = angular.fromJson(assessmentData)
            } else {
                assessmentData = [
                    {location: dummyAssessments[0].location, assessments: [dummyAssessments[0]]},
                    {location: dummyAssessments[1].location, assessments: [dummyAssessments[1]]},
                    {location: assessmentLocationWithNoAssessments, assessments: []}
                ]
            }
            return assessmentData;
        };

        function storeAssessmentData(routeId, assessmentData) {
            $window.localStorage.setItem(routeId, angular.toJson(assessmentData));
        }


        this.getRouteAssessmentLocations = function (routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                var assessmentData = getAssessmentData(routeId);
                deferred.resolve(assessmentData.map(function (entry) {
                    return entry.location;
                }));
            });

            return deferred.promise;
        };

        this.getRiskAssessment = function (routeId, assessmentLocation) {
            var deferred = $q.defer();

            if (!assessmentLocation) {
                deferred.reject("assessment location must not be null");
                return deferred.promise;
            }

            $timeout(function () {
                var assessmentData = getAssessmentData(routeId);

                var res = assessmentData.find(function (entry) {
                    return entry.location.id == assessmentLocation.id;
                });

                if (res && res.assessments.length > 0) {
                    deferred.resolve(res.assessments[res.assessments.length - 1]);
                } else {
                    deferred.reject("Could not find any risk assessment for the given location");
                }
            });

            return deferred.promise;
        };

        /**
         * Finds the latest assessments for the given route. If an assessment location doesn't have an associated
         * assessment yet an empty will be provided.
         *
         * @param routeId
         * @returns {deferred.promise|{then, catch, finally}}
         */
        this.getLatestRiskAssessmentsForRoute = function (routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                var assessmentData = getAssessmentData(routeId);

                deferred.resolve(assessmentData
                    .map(function (entry) {
                        var hasAssessments = entry.assessments.length > 0;
                        return hasAssessments ? entry.assessments[entry.assessments.length - 1] : new RiskAssessment({
                            assessmentLocation: entry.location,
                            factorAssessments: [],
                            id: 1
                        });
                    })
                    .filter(function (assessment) {
                        return assessment && assessment != null;
                    }));
            });

            return deferred.promise;
        };

        function getNextAssessmentLocationId(routeId) {
            var assessmentData = getAssessmentData(routeId);
            return assessmentData.length + 1;
        }

        this.createAssessmentLocation = function (locationAttributes) {
            var deferred = $q.defer();

            $timeout(function () {
                var routeId = locationAttributes.routeId;
                var assessmentData = getAssessmentData(routeId);

                locationAttributes.id = getNextAssessmentLocationId(routeId);
                var assessmentLocation = new AssessmentLocation(locationAttributes);
                assessmentData.push({location: assessmentLocation, assessments: []});
                storeAssessmentData(routeId, assessmentData);

                deferred.resolve(assessmentLocation);
            });
            return deferred.promise;
        };

        this.createRiskAssessment = function (routeId, locationId, factorAssessments) {
            var deferred = $q.defer();

            $timeout(function () {
                var assessmentData = getAssessmentData(routeId);

                var entry = assessmentData.find(function (e) {
                    return e.location.id === locationId;
                });
                if (entry) {
                    var riskAssessment = new RiskAssessment({
                        id: entry.assessments.length + 1,
                        time: new Date(),
                        assessmentLocation: entry.location,
                        factorAssessments: factorAssessments
                    });
                    entry.assessments.push(riskAssessment);
                    storeAssessmentData(routeId, assessmentData);

                    deferred.resolve(riskAssessment);
                } else {
                    deferred.reject("Could not find assessment data for location defined by " + locationId);
                }
            });

            return deferred.promise;
        };
    }]);
