(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskFactorAssessorService', RiskFactorAssessorService);

    RiskFactorAssessorService.$inject = ['$q', '$window', '$timeout', '$rootScope', 'NotifyService', 'Events'];

    function RiskFactorAssessorService($q, $window, $timeout, $rootScope, NotifyService, Events) {
        this.chooseOption = chooseOption;

        function chooseOption(assessmentLocation, riskFactor) {
            var deferred = $q.defer();
            deferred.resolve(mapper[riskFactor.id](new RouteLocation(assessmentLocation), riskFactor));
            return deferred.promise;
        }

        var route;
        var mapper = {
            1: defaultOption,
            2: chooseTypeOfSeason,
            3: defaultOption,
            4: defaultOption,
            5: defaultOption,
            6: defaultOption,
            7: defaultOption,
            8: defaultOption,
            9: defaultOption,
            10: defaultOption,
            11: defaultOption,
            12: defaultOption,
            13: defaultOption,
            14: defaultOption
        };

        var defaultScoreOption = {name: '-', index: 0};

        function defaultOption() {
            return defaultScoreOption;
        }

        /**
         * Determine the month of year when the vessel arrives at the given location and return the
         * matching risk factor option or a default option if none matches.
         * @param assessmentLocation
         * @param riskFactor
         * @returns {{name: string, index: number}}
         */
        function chooseTypeOfSeason(assessmentLocation, riskFactor) {
            var monthNumber = getArrivalMonthAtLocation(assessmentLocation);
            var res = riskFactor.scoreOptions.find(function (scoreOption) {
                return monthToNumber(scoreOption.name) == monthNumber;
            });
            return res || defaultScoreOption;

            function getArrivalMonthAtLocation(location) {
                return route.getTimeAtPosition(location.getLatLon()).month();
            }

            function monthToNumber(monthString) {
                return moment().month(monthString).month();
            }
        }

        NotifyService.subscribe($rootScope, Events.RouteChanged, function (event, newRoute) {
            route = new Route(newRoute);
        });
    }

})();
