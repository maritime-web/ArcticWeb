(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RouteLocationService', RouteLocationService);

    RouteLocationService.$inject = ['$rootScope', '$q', 'RiskAssessmentDataService', 'NotifyService', 'Events'];

    function RouteLocationService($rootScope, $q, RiskAssessmentDataService, NotifyService, Events) {
        var activeRoute;
        this.createRouteLocation = createRouteLocation;
        this.deleteRouteLocation = deleteRouteLocation;
        this.getRouteLocations = getRouteLocations;

        function createRouteLocation(route, locationAttributes) {
            var routeId = route.id;

            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        locationAttributes.id = data.routeLocationSequence++;
                        locationAttributes.routeId = routeId;
                        locationAttributes.eta = calculateEta();
                        var routeLocation = new RouteLocation(locationAttributes);
                        data.routeLocations.push(routeLocation);
                        return RiskAssessmentDataService.storeAssessmentData(routeId, data)
                            .then(function () {
                                return $q.when(routeLocation);
                            });
                    } catch (e) {
                        return $q.reject(e);
                    }
                });

            function calculateEta() {
                var latLon = [locationAttributes.lat, locationAttributes.lon];
                return new Route(route).getTimeAtPosition(latLon);
            }
        }

        function deleteRouteLocation(routeLocationToDelete) {
            var routeId = routeLocationToDelete.routeId;
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        var routeLocations = data.routeLocations;
                        var index = routeLocations.findIndex(function (entry) {
                            return entry.id === routeLocationToDelete.id;
                        });

                        var deletedRouteLocationArray = routeLocations.splice(index, 1);

                        RiskAssessmentDataService.storeAssessmentData(routeId, data)
                            .then(function () {
                                return $q.when(deletedRouteLocationArray);
                            });
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
        }

        function getRouteLocations(routeId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    return data.routeLocations;
                })
        }
    }

})();