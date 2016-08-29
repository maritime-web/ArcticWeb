'use strict';

describe('RouteLocationService', function () {
    var cut;

    var dataService;

    //angular stuf
    var $q, $rootScope;

    function getFunctionResolving(data) {
        return function () {
            return $q.when(data);
        }
    }

    beforeEach(module('vrmt.app'));
    beforeEach(inject(function (RouteLocationService, RiskAssessmentDataService, _$q_, _$rootScope_) {
        cut = RouteLocationService;
        $q = _$q_;
        $rootScope = _$rootScope_;
        dataService = RiskAssessmentDataService;
    }));

    describe('createRouteLocation', function () {
        it('should return the new location', function () {
            var theNewlocation = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving({
                routeLocationSequence: 1,
                routeLocations: [],
                currentAssessment: null,
                assessments: []
            });

            var route = createTestRoute();
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

    function createTestRoute() {
        return {
            id: "nice route id",
            etaDep: new Date(2016, 3, 30),
            wps: [
                {latitude: -20, longitude: 70, speed: 4, eta: new Date(2016, 3, 30)},
                {latitude: -21, longitude: 73, speed: 4, eta: new Date(2016, 3, 31, 23, 51)},
                {latitude: -22, longitude: 75, eta: new Date(2016, 4, 1, 13)}
            ]
        };
    }

});
