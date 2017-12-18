(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskFactorAssessorService', RiskFactorAssessorService);

    RiskFactorAssessorService.$inject = ['$q', '$rootScope', 'NotifyService', 'VrmtEvents', 'RouteFactory', '$http'];

    function RiskFactorAssessorService($q, $rootScope, NotifyService, VrmtEvents, RouteFactory, $http) {
        this.chooseOption = chooseOption;

        function chooseOption(assessmentLocation, riskFactor) {
            return mapper[riskFactor.id](new RouteLocation(assessmentLocation), riskFactor);
        }

        var route;
        var mapper = {
            1: getDefaultOption,
            2: chooseTypeOfSeason,
            3: chooseLandingSite,
            4: getDefaultOption,
            5: getDefaultOption,
            6: getDefaultOption,
            7: getDefaultOption,
            8: getDefaultOption,
            9: getDefaultOption,
            10: getDefaultOption,
            11: getDefaultOption,
            12: getDefaultOption,
            13: getDefaultOption,
            14: getDefaultOption
        };


        var defaultOption = {name: '-', index: 0, source: null};
        function getDefaultOption() {
            return $q.when(defaultOption);
        }

        /**
         * Determine the month of year when the vessel arrives at the given location and return the
         * matching risk factor option or a default option if none matches.
         * @param routeLocation
         * @param riskFactor
         * @returns {{name: string, index: number, source: string}}
         */
        function chooseTypeOfSeason(routeLocation, riskFactor) {
            var monthNumber = getArrivalMonthAtLocation();
            var res = riskFactor.scoreOptions.find(function (scoreOption) {
                return monthToNumber(scoreOption.name) === monthNumber;
            });

            if (res) {
                res.source = "AW";
            }

            return $q.when(res || getDefaultOption()) ;

            function getArrivalMonthAtLocation() {
                return moment(routeLocation.eta).utc().month();
            }

            function monthToNumber(monthString) {
                return moment().utc().month(monthString).month();
            }
        }

        function chooseLandingSite(routeLocation, riskFactor) {
            var berthUrl = embryo.baseUrl + 'rest/berth/search';
            var berths = undefined;
            var res = undefined;

            return $http.get(berthUrl, {cache: true})
                .then(function (response) {
                    berths = response.data;
                    if (isRouteLocationLandingSite()) {
                        res = matchOption(routeLocation.name, riskFactor.scoreOptions);

                        if (res) {
                            res.source = "AW";
                        }
                    }
                    return res || getDefaultOption();

                })
                .catch(function (response) {
                    console.error("Failed to get berths");
                    console.error(response);
                    return $q.reject(response);
                });


            function isRouteLocationLandingSite() {
                return berths.some(function (berth) {
                    var lowerCaseBerth = berth.value.toLowerCase();
                    return lowerCaseBerth.startsWith(route.dep.toLowerCase()) ||
                        lowerCaseBerth.startsWith(route.des.toLowerCase())
                });
            }

            function matchOption(name, scoringOptions) {
                return scoringOptions.find(function (scoreOption) {
                    return name.toLowerCase().startsWith(scoreOption.name.toLowerCase());
                });
            }
        }

        NotifyService.subscribe($rootScope, VrmtEvents.RouteChanged, function (event, newRoute) {
            route = RouteFactory.create(newRoute);
        });
    }

})();
