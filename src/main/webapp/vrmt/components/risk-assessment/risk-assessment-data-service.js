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
            var assessmentData = $window.localStorage.getItem(routeId);
            if (assessmentData) {
                assessmentData = angular.fromJson(assessmentData);
            } else {
                assessmentData = [];
            }
            return assessmentData;
        }

        function storeAssessmentData(routeId, assessmentData) {
            $window.localStorage.setItem(routeId, angular.toJson(assessmentData));
        }
    }

})();