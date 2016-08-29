'use strict';

describe('Risk Assessment Classes', function() {

    describe('RiskFactor', function() {
        var params = {
            scoreOptions: [new ScoreOption({name: '', index: ''})],
            scoreInterval: new ScoreInterval({minIndex: 0, maxIndex: 1})
        };

        it('should throw error when initialized with both score options and score interval', function() {
            expect(function () {
                new RiskFactor(params)
            }).toThrowError(Error, "A risk factor can't have both score options and score interval");
        });
    });

    describe('Assessment', function() {
        var routeId = "r1";
        var routeLocation, scoreOption, riskFactor, scores, assessment, locationAssessment;

        beforeEach(function () {
            routeLocation = new RouteLocation({routeId: routeId, id: 1, name: 'Nuuk', lat: -21.345, lon: 68.231});
            scoreOption = new ScoreOption({name: 'Region AA', index: 40});
            riskFactor = new RiskFactor({vesselId: '223344', id: 1, name: '1. Regions', scoreOptions: [scoreOption]});
            scores = [new Score({riskFactor: riskFactor, scoreOption: scoreOption, index: 87})];
            locationAssessment = new LocationAssessment({time: moment(), routeLocation: routeLocation, scores: []});

            assessment = new Assessment({id: 1, routeId: 'r1', started: moment(), finished: moment(), locationsToAssess: [routeLocation], locationAssessments: [[routeLocation.id, locationAssessment]]});
        });

        it('should be able to instantiate from a serialized version', function() {
            assessment.updateLocationAssessment(routeLocation.id, scores);
            var serializedVersion = angular.toJson(assessment);
            var deserializedAssessment = new Assessment(angular.fromJson(serializedVersion));

            expect(deserializedAssessment.started.unix()).toEqual(assessment.started.unix());
            expect(deserializedAssessment.locationAssessments.get(1)).toBeDefined();
        });

        it('should test map serialization for empty map', function() {
            var a = new Map();

            var serialized = angular.toJson(a);
            var deSerialized = angular.fromJson(serialized);
            var mapFromSerializedMap = new Map(deSerialized);

            expect(mapFromSerializedMap.size).toBe(0);
        });

        it('should test map serialization for map with entries', function() {
            var a = new Map();
            a.set(1, "hello");
            a.set(2, "world");
            a.set(3, "!");

            var ja = angular.toJson(a);
            var mapFromSerializedMap = new Map(angular.fromJson(ja));

            expect(mapFromSerializedMap.get(1)).toBe("hello");
            expect(Array.from(mapFromSerializedMap.values())).toContain("hello");
            expect(Array.from(mapFromSerializedMap.values())).toContain("world");
            expect(Array.from(mapFromSerializedMap.values())).toContain("!");
        });

        describe('updateLocationAssessment', function() {
            it('should update location assessment for route location to a new LocationAssessment containing the given scores', function() {
                assessment.updateLocationAssessment(routeLocation.id, scores);

                expect(assessment.getLocationAssessment(routeLocation.id).scores).toEqual(scores);
            });

        });
        describe('getMaxScore', function() {
            it('should get 87', function() {
                assessment.updateLocationAssessment(routeLocation.id, scores);

                expect(assessment.getMaxScore()).toBe(87);
            });

        })
    });

/*
    describe('LocationAssessment', function() {
        var params = {
            routeLocation: "",
            scores: []
        };

        it('should should assign param.assessmentLocation to location ', function() {
            params.routeLocation = "a location";

            var cut = new LocationAssessment(params);

            expect(cut.location).toEqual(params.routeLocation);
        });
    });
*/

    describe('Route', function() {
        describe('getTimeAtPosition', function() {
            it('should throw exception if given point is more than 10 miles from the rute', function() {
                var route = {
                    etaDep: new Date(2016, 3, 30),
                    wps: [
                        {latitude: -20, longitude: 70, speed: 4, eta: new Date(2016, 3, 30)},
                        {latitude: -22, longitude: 75, speed: 4, eta: new Date(2016, 4, 1, 13)},
                        {latitude: -23, longitude: 78, eta: new Date(2016, 4, 2, 8)}
                        ]
                };

                var cut = new Route(route);

                expect(function() {
                    return cut.getTimeAtPosition([-25, 72]);
                }).toThrow();
            });

            it('should test arc', function() {
                var p1 = {x: -20, y: 62};
                var p2 = {x: -29, y: 64};
                var generator = new arc.GreatCircle(p1, p2);
                var line = generator.Arc(8).json();
                // console.log(line.geometry.coordinates);
                // var coords = line.geometry.coordinates;
                // for(var i = 0; i < coords.length; i+=2) {
                //     console.log(coords[i]);
                //     console.log(coords[i+1]);
                // }
            });

        });

    });
});
