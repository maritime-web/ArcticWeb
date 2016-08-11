(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentService', RiskAssessmentService);

    RiskAssessmentService.$inject = ['$q', 'RiskAssessmentDataService'];

    function RiskAssessmentService($q, RiskAssessmentDataService) {

        /**
         * Finds the latest assessments for the given route. If an assessment location doesn't have an associated
         * assessment yet an empty will be provided.
         *
         * @param routeId
         * @returns {deferred.promise|{then, catch, finally}}
         */
        this.getLatestRiskAssessmentsForRoute = getLatestRiskAssessmentsForRoute;
        /**
         * Creates a new Risk assessment for the given route and location.
         *
         * @param routeId
         * @param locationId
         * @param scores
         * @returns {deferred.promise|{then, catch, finally}}
         */
        this.createRiskAssessment = createRiskAssessment;

        function getLatestRiskAssessmentsForRoute(routeId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(getLatestRiskAssessmentsForRoute_);

            function getLatestRiskAssessmentsForRoute_(assessmentData) {
                return assessmentData
                    .map(toRiskAssessment)
                    .filter(function (assessment) {
                        return assessment && assessment != null;
                    });

                function toRiskAssessment(entry) {
                    var hasAssessments = entry.assessments.length > 0;
                    return hasAssessments ? getMostRecent(entry.assessments) : new RiskAssessment({
                        assessmentLocation: entry.location,
                        scores: [],
                        id: 1
                    });
                }

                function getMostRecent(assessments) {
                    return assessments.sort(compare)[0];

                    function compare(assessmentOne, assessmentTwo) {
                        var timeOne = assessmentOne.time;
                        var timeTwo = assessmentTwo.time;
                        return -timeOne.localeCompare(timeTwo);
                    }
                }
            }
        }

        function createRiskAssessment(routeId, locationId, scores) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (assessmentData) {
                    var entry = assessmentData.find(function (e) {
                        return e.location.id === locationId;
                    });
                    if (entry) {
                        var assessment = createAssessment(entry);
                        entry.assessments.push(assessment);
                        return RiskAssessmentDataService.storeAssessmentData(routeId, assessmentData)
                            .then(function () {
                                return $q.when(assessment);
                            });
                    } else {
                        $q.reject("Could not find assessment data for location defined by " + locationId);
                    }
                });

            function createAssessment(entry) {
                return new RiskAssessment({
                    id: entry.assessments.length + 1,
                    time: new Date(),
                    assessmentLocation: entry.location,
                    scores: scores
                });
            }
        }
    }
})();