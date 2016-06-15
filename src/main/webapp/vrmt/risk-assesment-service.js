function AssesmentLocation(parameters) {
    this.id = parameters.id;
    this.name = parameters.name;
    this.routeId = parameters.routeId;
    this.lat = parameters.lat;
    this.lon = parameters.lon;
}

function RiskAssesment(parameters) {
    var getIndex = function (factorAssesments) {
        var accumulatedIndex = 0;
        factorAssesments.forEach(function (factorAssesment) {
            accumulatedIndex += factorAssesment.index;
        });
        return accumulatedIndex;
    };
    this.id = parameters.id;
    this.time = parameters.time;
    this.location = parameters.assesmentLocation;
    this.factorAssesments = parameters.factorAssesments;
    this.index = getIndex(this.factorAssesments);
}

var dummyAssesments = [
    new RiskAssesment({
        id: 1,
        time: new Date(),
        assesmentLocation: new AssesmentLocation({
            id: 1,
            name: 'Near Nuuk',
            routeId: 123434,
            lat: 62.23,
            lon: -40.02
        }),
        factorAssesments: [
            {
                factor: 'Ice conditions',
                value: 'One year sea ice 5/10',
                index: 25
            },
            {
                factor: 'Wind speed',
                value: '3',
                index: 25
            },
            {
                factor: 'Air temperature',
                value: '-10',
                index: 100
            },
            {
                factor: 'Sea conditions',
                value: '2',
                index: 125
            }
        ]
    }),
    new RiskAssesment({
        id: 2,
        time: new Date(),
        assesmentLocation: new AssesmentLocation({
            id: 2,
            name: 'Far from Nuuk',
            routeId: 123434,
            lat: 72.23,
            lon: -56.02
        }),
        factorAssesments: [
            {
                factor: 'Ice conditions',
                value: 'One year sea ice 10/10',
                index: 455
            },
            {
                factor: 'Wind speed',
                value: '11',
                index: 250
            },
            {
                factor: 'Air temperature',
                value: '-20',
                index: 300
            },
            {
                factor: 'Sea conditions',
                value: '2',
                index: 125
            }
        ]
    })
];

var assesmentLocationWithNoAssesments = new AssesmentLocation({
    id: 3,
    name: 'Far out',
    routeId: 123434,
    lat: 74.23,
    lon: -58.02
});

angular.module('vrmt.app')
    .service('RiskAssesmentService', ['$q', '$window', '$timeout', function ($q, $window, $timeout) {
        'use strict';

        var getAssesmentData = function (routeId) {
            var assesmentData = $window.localStorage.getItem(routeId);
            if (assesmentData) {
                assesmentData = angular.fromJson(assesmentData)
            } else {
                assesmentData = [
                    {location: dummyAssesments[0].location, assesments: [dummyAssesments[0]]},
                    {location: dummyAssesments[1].location, assesments: [dummyAssesments[1]]},
                    {location: assesmentLocationWithNoAssesments, assesments: []}
                ]
            }
            return assesmentData;
        };

        function storeAssesmentData(routeId, assesmentData) {
            $window.localStorage.setItem(routeId, angular.toJson(assesmentData));
        }


        this.getRouteAssesmentLocations = function (routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                var assesmentData = getAssesmentData(routeId);
                deferred.resolve(assesmentData.map(function (entry) {
                    return entry.location;
                }));
            });

            return deferred.promise;
        };

        this.getRiskAssesment = function (routeId, assesmentLocation) {
            var deferred = $q.defer();

            if (!assesmentLocation) {
                deferred.reject("Assesment location must not be null");
                return deferred.promise;
            }

            $timeout(function () {
                var assesmentData = getAssesmentData(routeId);

                var res = assesmentData.find(function (entry) {
                    return entry.location.id == assesmentLocation.id;
                });

                if (res && res.assesments.length > 0) {
                    deferred.resolve(res.assesments[res.assesments.length - 1]);
                } else {
                    deferred.reject("Could not find any risk assesment for the given location");
                }
            });

            return deferred.promise;
        };

        /**
         * Finds the latest assesments for the given route. If an assesment location doesn't have an associated 
         * assesment yet an empty will be provided.
         * 
         * @param routeId
         * @returns {deferred.promise|{then, catch, finally}}
         */
        this.getLatestRiskAssesmentsForRoute = function (routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                var assesmentData = getAssesmentData(routeId);

                deferred.resolve(assesmentData
                    .map(function (entry) {
                        var hasAssesments = entry.assesments.length > 0;
                        return hasAssesments ? entry.assesments[entry.assesments.length - 1] : new RiskAssesment({assesmentLocation: entry.location, factorAssesments: [], id: 1});
                    })
                    .filter(function (assesment) {
                        return assesment && assesment != null;
                    }));
            });

            return deferred.promise;
        };

        function getNextAssesmentLocationId(routeId) {
            var assesmentData = getAssesmentData(routeId);
            return assesmentData.length + 1;
        }

        this.createAssesmentLocation = function (locationAttributes) {
            var deferred = $q.defer();

            $timeout(function () {
                var routeId = locationAttributes.routeId;
                var assesmentData = getAssesmentData(routeId);

                locationAttributes.id = getNextAssesmentLocationId(routeId);
                var assesmentLocation = new AssesmentLocation(locationAttributes);
                assesmentData.push({location: assesmentLocation, assesments: []});
                storeAssesmentData(routeId, assesmentData);

                deferred.resolve(assesmentLocation);
            });
            return deferred.promise;
        };
    }]);
