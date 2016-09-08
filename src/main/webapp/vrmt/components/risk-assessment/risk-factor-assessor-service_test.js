'use strict';

describe('RiskFactorAssessorService', function () {
    //Class under test
    var cut;

    //Test data
    var route, routeLocation, riskFactor;

    //angular stuf
    var $rootScope;

    beforeEach(module('vrmt.app'));
    beforeEach(createTestData);
    beforeEach(inject(function (RiskFactorAssessorService, _$rootScope_, NotifyService, Events) {
        cut = RiskFactorAssessorService;
        $rootScope = _$rootScope_;
        NotifyService.notify(Events.RouteChanged, route);
    }));


    describe('chooseOption', function () {
        it("should return default option for risk factor 1. Regions", function () {
            riskFactor.id = 1;
            var result = null;

            cut.chooseOption(routeLocation, riskFactor).then(function (res) {
                result = res;
            });

            $rootScope.$apply();

            expect(result.index).toEqual(0);
            expect(result.name).toEqual("-");
        });

        it("should return option with name May and index 300 for risk factor 2. Time of the season", function () {
            riskFactor.id = 2;
            riskFactor.scoreOptions.push({name: 'May', index: 300});
            routeLocation.eta = moment().year(2016).month(4).date(5);
            var result = null;

            cut.chooseOption(routeLocation, riskFactor).then(function (res) {
                result = res;
            });

            $rootScope.$apply();

            expect(result.index).toEqual(300);
            expect(result.name).toEqual("May");
        });

        it("should convert May to month number 4", function () {
            expect(moment().month("May").month()).toBe(4);
        })
    });

    function createTestData() {
        route = {
            etaDep: new Date(2016, 3, 30),
            wps: [
                {latitude: -20, longitude: 70, speed: 4, eta: new Date(2016, 3, 30)},
                {latitude: -21, longitude: 73, speed: 4, eta: new Date(2016, 3, 31, 23, 51)},
                {latitude: -22, longitude: 75, eta: new Date(2016, 4, 1, 13)}
                ]
        };
        routeLocation = new RouteLocation({
            routeId: "1q1q1q1q",
            id: "1",
            name: "location",
            lat: -21.4,
            lon: 74
        });

        riskFactor = new RiskFactor({
            vesselId: "dkfjhswkfhfk",
            id: 1,
            name: 'Some risk factor',
            scoreOptions: []
        });
    }

});

