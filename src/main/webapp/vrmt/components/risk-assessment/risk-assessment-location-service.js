(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentLocationService', RiskAssessmentLocationService);

    RiskAssessmentLocationService.$inject = ['RiskAssessmentDataService', '$q', '$timeout'];

    function RiskAssessmentLocationService(RiskAssessmentDataService, $q, $timeout) {

        this.createAssessmentLocation = createAssessmentLocation;
        this.deleteAssessmentLocation = deleteAssessmentLocation;

        function getNextAssessmentLocationId(routeId) {
            var assessmentData = RiskAssessmentDataService.getAssessmentData(routeId);
            return assessmentData.length + 1;
        }

        function createAssessmentLocation(locationAttributes) {
            var deferred = $q.defer();

            $timeout(function () {
                var routeId = locationAttributes.routeId;
                var assessmentData = RiskAssessmentDataService.getAssessmentData(routeId);

                locationAttributes.id = getNextAssessmentLocationId(routeId);
                var assessmentLocation = new RiskAssessmentLocation(locationAttributes);
                assessmentData.push({location: assessmentLocation, assessments: []});
                RiskAssessmentDataService.storeAssessmentData(routeId, assessmentData);

                deferred.resolve(assessmentLocation);
            });
            return deferred.promise;
        }

        function deleteAssessmentLocation(assessmentLocation) {
            var deferred = $q.defer();
            $timeout(function () {
                try {
                    var routeId = assessmentLocation.routeId;
                    var data = RiskAssessmentDataService.getAssessmentData(routeId);
                    var index = data.findIndex(function (entry) {
                        return entry.location.id === assessmentLocation.id;
                    });

                    var deletedAssessmentLocationArray = data.splice(index, 1);

                    RiskAssessmentDataService.storeAssessmentData(routeId, data);
                    deferred.resolve(deletedAssessmentLocationArray);
                } catch (e) {
                    deferred.reject(e);
                }
            });

            return deferred.promise;
        }
    }

})();