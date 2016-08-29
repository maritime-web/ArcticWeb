(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentService', RiskAssessmentService);

    RiskAssessmentService.$inject = ['$q', 'RiskAssessmentDataService'];

    function RiskAssessmentService($q, RiskAssessmentDataService) {

        this.getCurrentAssessment = getCurrentAssessment;
        this.startNewAssessment = startNewAssessment;
        this.endAssessment = endAssessment;
        this.discardAssessment = discardAssessment;
        this.createLocationAssessment = createLocationAssessment;

        /**
         * Returns the assessment currently being created
         * @param routeId
         * @returns {*}
         */
        function getCurrentAssessment(routeId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    if (data.currentAssessment) {
                        return new Assessment(data.currentAssessment);
                    }
                    return $q.reject("There is no current assessment");
                });
        }

        /**
         * Starts a new assessment and assigns it as the assessment currently under construction.
         * @param route
         * @returns a promise of the newly created assessment
         */
        function startNewAssessment(route) {
            return RiskAssessmentDataService.getAssessmentData(route.id)
                .then(function (data) {
                    data.currentAssessment = null;
                    var locationsToAssess = getLocationsNotYetPassed();
                    var result = new Assessment({id: moment().unix(), routeId: route.id, started: moment(), locationsToAssess: locationsToAssess});
                    var lastAssessment = getLastAssessment();
                    locationsToAssess.forEach(function (location) {
                        result.updateLocationAssessment(location.id);
                    });

                    if (lastAssessment) {
                        lastAssessment = new Assessment(lastAssessment);
                        locationsToAssess.forEach(function (location) {
                            var defaultLocationAssessment = lastAssessment.getLocationAssessment(location.id);
                            if (defaultLocationAssessment) {
                                result.updateLocationAssessment(location.id, defaultLocationAssessment.scores);
                            }
                        });
                    }

                    data.currentAssessment = result;
                    return saveAssessmentData(route.id, data);

                    function getLocationsNotYetPassed() {
                        var currentTime = moment();
                        return data.routeLocations.filter(function (location) {
                            return currentTime.isSameOrBefore(location.eta);
                        });
                    }

                    function getLastAssessment() {
                        if (data.assessments.length == 0) return null;

                        return data.assessments.reduce(function (cur, prev) {
                            return moment(cur.finished).isAfter(prev.finished) ? cur : prev;
                        });
                    }
                });

        }

        /**
         * Ends the current assessment and adds it to the list of completed assessments
         * @param routeId
         */
        function endAssessment(routeId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    data.assessments.push(data.currentAssessment);
                    data.currentAssessment = null;
                    return saveAssessmentData(routeId, data);
                });
        }

        /**
         * Discards the current assessment.
         * @param routeId
         */
        function discardAssessment(routeId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    data.currentAssessment = null;
                    return saveAssessmentData(routeId, data);
                });
        }

        function saveAssessmentData(routeId, data) {
            return RiskAssessmentDataService.storeAssessmentData(routeId, data)
                .then(function () {
                    return data.currentAssessment;
                });
        }

        /**
         * Finds the latest assessments for the given route. If an assessment location doesn't have an associated
         * assessment yet an empty will be provided.
         *
         * @param routeId
         * @returns {deferred.promise|{then, catch, finally}}
         */
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
                    return hasAssessments ? getMostRecent(entry.assessments) : new LocationAssessment({
                        routeLocation: entry.location,
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

        /**
         * Creates a new Risk assessment for the given route and location.
         *
         * @param routeId
         * @param locationId
         * @param scores
         * @returns {deferred.promise|{then, catch, finally}}
         */
        function createLocationAssessment(routeId, locationId, scores) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        if (data.currentAssessment) {
                            data.currentAssessment = new Assessment(data.currentAssessment);
                            data.currentAssessment.updateLocationAssessment(locationId, scores);

                            return RiskAssessmentDataService.storeAssessmentData(routeId, data)
                                .then(function () {
                                    return $q.when(data.currentAssessment.getLocationAssessment(locationId));
                                });
                        } else {
                            return $q.reject("No active assessment.");
                        }
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
        }
    }
})();