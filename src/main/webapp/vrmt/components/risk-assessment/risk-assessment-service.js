(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentService', RiskAssessmentService);

    RiskAssessmentService.$inject = ['RiskAssessmentDataService', '$q', '$timeout'];

    function RiskAssessmentService(RiskAssessmentDataService, $q, $timeout) {

        /**
         * Finds the latest assessments for the given route. If an assessment location doesn't have an associated
         * assessment yet an empty will be provided.
         *
         * @param routeId
         * @returns {deferred.promise|{then, catch, finally}}
         */
        this.getLatestRiskAssessmentsForRoute = getLatestRiskAssessmentsForRoute;
        this.createRiskAssessment = createRiskAssessment;

        function getLatestRiskAssessmentsForRoute(routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                var assessmentData = RiskAssessmentDataService.getAssessmentData(routeId);

                deferred.resolve(assessmentData
                    .map(function (entry) {
                        var hasAssessments = entry.assessments.length > 0;
                        return hasAssessments ? entry.assessments[entry.assessments.length - 1] : new RiskAssessment({
                            assessmentLocation: entry.location,
                            scores: [],
                            id: 1
                        });
                    })
                    .filter(function (assessment) {
                        return assessment && assessment != null;
                    }));
            });

            return deferred.promise;
        }

        function createRiskAssessment(routeId, locationId, scores) {
            var deferred = $q.defer();

            $timeout(function () {
                var assessmentData = RiskAssessmentDataService.getAssessmentData(routeId);

                var entry = assessmentData.find(function (e) {
                    return e.location.id === locationId;
                });
                if (entry) {
                    var riskAssessment = new RiskAssessment({
                        id: entry.assessments.length + 1,
                        time: new Date(),
                        assessmentLocation: entry.location,
                        scores: scores
                    });
                    entry.assessments.push(riskAssessment);
                    RiskAssessmentDataService.storeAssessmentData(routeId, assessmentData);

                    deferred.resolve(riskAssessment);
                } else {
                    deferred.reject("Could not find assessment data for location defined by " + locationId);
                }
            });

            return deferred.promise;
        }
    }
})();