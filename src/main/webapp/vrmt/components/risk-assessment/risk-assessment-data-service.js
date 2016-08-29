(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentDataService', RiskAssessmentDataService);

    RiskAssessmentDataService.$inject = ['$q', '$window', '$timeout'];

    function RiskAssessmentDataService($q, $window, $timeout) {

        this.getAssessmentData = getAssessmentData;
        this.storeAssessmentData = storeAssessmentData;

        function getAssessmentData(routeId) {
            var deferred = $q.defer();

            $timeout(function () {
                try {
                    var assessmentData = $window.localStorage.getItem(routeId);

                    if (assessmentData) {
                        assessmentData = angular.fromJson(assessmentData);
                    } else {
                        assessmentData = {
                            routeLocationSequence: 1,
                            routeLocations: [],
                            currentAssessment: null,
                            assessments: []
                        };
                    }
                    deferred.resolve(assessmentData);
                } catch (e) {
                    deferred.reject(e);
                }
            });

            return deferred.promise;
        }

        function storeAssessmentData(routeId, assessmentData) {
            ensureSupportForMapSerialization();
            var deferred = $q.defer();

            $timeout(function () {
               try {
                   if (!routeId) {
                       deferred.reject("No route id specified!");
                   }

                   $window.localStorage.setItem(routeId, angular.toJson(assessmentData));
                   deferred.resolve();
               } catch (e) {
                   deferred.reject(e);
               }
            });

            return deferred.promise;
        }

        function ensureSupportForMapSerialization() {
            if (!Map.prototype.toJSON) {
                Map.prototype.toJSON = function () {
                    return Array.from(this);
                }
            }
        }

    }

})();