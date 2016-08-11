(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentLocationService', RiskAssessmentLocationService);

    RiskAssessmentLocationService.$inject = ['$q', 'RiskAssessmentDataService'];

    function RiskAssessmentLocationService($q, RiskAssessmentDataService) {

        this.createAssessmentLocation = createAssessmentLocation;
        this.deleteAssessmentLocation = deleteAssessmentLocation;

        function getNextAssessmentLocationId(assessmentData) {
            return assessmentData.length + 1;
        }

        function createAssessmentLocation(locationAttributes) {
            var routeId = locationAttributes.routeId;
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (assessmentData) {
                    try {
                        locationAttributes.id = getNextAssessmentLocationId(assessmentData);
                        var assessmentLocation = new RiskAssessmentLocation(locationAttributes);
                        assessmentData.push({location: assessmentLocation, assessments: []});
                        return RiskAssessmentDataService.storeAssessmentData(routeId, assessmentData)
                            .then(function () {
                                return $q.when(assessmentLocation);
                            });
                    } catch (e) {
                        $q.reject(e);
                    }
                });
        }

        function deleteAssessmentLocation(assessmentLocation) {
            var routeId = assessmentLocation.routeId;
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        var index = data.findIndex(function (entry) {
                            return entry.location.id === assessmentLocation.id;
                        });

                        var deletedAssessmentLocationArray = data.splice(index, 1);

                        RiskAssessmentDataService.storeAssessmentData(routeId, data)
                            .then(function () {
                                return $q.when(deletedAssessmentLocationArray);
                            });
                    } catch (e) {
                        $q.reject(e);
                    }

                });

        }
    }

})();