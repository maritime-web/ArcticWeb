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
});
