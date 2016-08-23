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

    describe('RiskAssessment', function() {
        var params = {
            assessmentLocation: "",
            scores: []
        };

        it('should should assign param.assessmentLocation to location ', function() {
            params.assessmentLocation = "a location";

            var cut = new RiskAssessment(params);

            expect(cut.location).toEqual(params.assessmentLocation);
        });
    });

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
