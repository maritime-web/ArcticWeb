function AssesmentLocation(parameters) {
    this.id = parameters.id;
    this.name = parameters.name;
    this.routeId = parameters.routeId;
    this.lat = parameters.lat;
    this.lon = parameters.lon;
}

function RiskAssesment(parameters) {
    this.id = parameters.id;
    this.time = parameters.time;
    this.location = parameters.assesmentLocation;
    this.factorAssesments = parameters.factorAssesments;
    this.getIndex = function () {
        var accumulatedIndex = 0;
        this.factorAssesments.forEach(function (factorAssesment) {
            accumulatedIndex += factorAssesment.index;
        });
        return accumulatedIndex;
    }
}

var dummyAssesments = [
    new RiskAssesment({
        id: 1,
        time: new Date(),
        assesmentLocation: new AssesmentLocation({
            id: 1,
            name: 'Near Nuuk',
            routeId: 123434,
            lat: -40.02,
            lon: 62.23
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
                factor:  'Air temperature',
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
            lat: -55.02,
            lon: 72.23
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
                factor:  'Air temperature',
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

angular.module('vrmt.app')
    .service('RiskAssesmentService', ['$q', function ($q) {
        'use strict';

        this.getRouteAssesmentLocations = function (routeId) {
            var deferred = $q.defer();
            var dummyLocations = [
                dummyAssesments[0].assesmentLocation,
                dummyAssesments[1].assesmentLocation
            ];
            deferred.resolve(dummyLocations);
            return deferred.promise;
        };

        this.getRiskAssesment = function (assesmentLocation) {
            var deferred = $q.defer();
            if (!assesmentLocation) {
                deferred.reject("Assesment location must not be null");
                return deferred.promise;
            }
            var dummyAssesment = dummyAssesments[0];

            if (assesmentLocation.id == 2) {
                dummyAssesment = dummyAssesments[1];
            }
            deferred.resolve(dummyAssesment);
            return deferred.promise;
        };

        this.getLatestRiskAssesmentsForRoute = function (routeId) {
            var deferred = $q.defer();
            deferred.resolve(dummyAssesments);
            return deferred.promise;
        };
    }]);
