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
                        assessmentData = [];
                    }
                    deferred.resolve(assessmentData);
                } catch (e) {
                    deferred.reject(e);
                }
            });

            return deferred.promise;
        }

        function storeAssessmentData(routeId, assessmentData) {
            var deferred = $q.defer();

            $timeout(function () {
               try {
                   $window.localStorage.setItem(routeId, angular.toJson(assessmentData));
                   deferred.resolve();
               } catch (e) {
                   deferred.reject(e);
               }
            });

            return deferred.promise;
        }
    }

})();