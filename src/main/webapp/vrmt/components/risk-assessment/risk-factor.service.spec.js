'use strict';

describe('RiskFactor Service', function () {
    //Class under test
    var cut;

    //Mock service
    var RiskAssessmentDataService;

    //Test data
    var route, routeLocation, riskFactor;

    //angular stuf
    var $rootScope, $q;

    beforeEach(module('vrmt.app'));
    beforeEach(module(function ($provide) {
            var RiskAssessmentDataService = {
                getRiskFactorData: function () {return $q.when("DUMMY")}
            };
            $provide.value('RiskAssessmentDataService', RiskAssessmentDataService);
        })
    );

    beforeEach(inject(function (RiskFactorService, _$rootScope_, _RiskAssessmentDataService_, _$q_) {
        cut = RiskFactorService;
        $rootScope = _$rootScope_;
        RiskAssessmentDataService = _RiskAssessmentDataService_;
        $q = _$q_;
    }));


    describe('getRiskFactors', function () {
        it("should add source attribute if not present", function () {
            var vesselId = 800111222;
            var riskFactor = {
                vesselId: vesselId,
                scoreOptions: [
                    {name: "Take me", index: 10},
                    {name: "I'm harder", index: 75},
                    {name: "I defined this my self", index: 275}
                ]
            };
            RiskAssessmentDataService.getRiskFactorData = function () {
                return $q.when([riskFactor]);
            };

            var result = null;
            cut.getRiskFactors().then(function (riskFactors) {
                result = riskFactors[0];
            });

            $rootScope.$apply();

            expect(result.scoreOptions[1].index).toEqual(75);
            expect(result.scoreOptions[0].source).toEqual("Manual");
            expect(result.scoreOptions[1].source).toEqual("Manual");
            expect(result.scoreOptions[2].source).toEqual("Manual");
        });
    });
});

