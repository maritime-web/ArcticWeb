'use strict';

describe('RiskAssessmentLocationService', function () {
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
    beforeEach(inject(function (RiskAssessmentLocationService, RiskAssessmentDataService, _$q_, _$rootScope_) {
        cut = RiskAssessmentLocationService;
        $q = _$q_;
        $rootScope = _$rootScope_;
        dataService = RiskAssessmentDataService;
    }));

    describe('createAssessmentLocation', function () {
        it('should return the new location', function () {
            var theNewlocation = undefined;
            dataService.storeAssessmentData = getFunctionResolving();
            dataService.getAssessmentData = getFunctionResolving([]);

            cut.createAssessmentLocation({routeId: "xxxxxx", name: "a", lat: 1.324, lon: 3.456})
                .then(function (data) {
                    theNewlocation = data;
                });

            $rootScope.$apply();

            expect(theNewlocation).toBeDefined();
        });

    });
});
