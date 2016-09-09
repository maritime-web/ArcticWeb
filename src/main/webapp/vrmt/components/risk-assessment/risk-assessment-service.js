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
        this.deleteLocation = deleteLocation;
        this.updateCurrentRoute = updateCurrentRoute;
        this.createRouteLocation = createRouteLocation;
        this.deleteRouteLocation = deleteRouteLocation;
        this.getRouteLocations = getRouteLocations;

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
        
        function deleteLocation(routeId, locationId) {
            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        if (data.currentAssessment) {
                            data.currentAssessment = new Assessment(data.currentAssessment);
                            data.currentAssessment.deleteLocation(locationId);

                            return RiskAssessmentDataService.storeAssessmentData(routeId, data)
                                .then(function () {
                                    return $q.when(data.currentAssessment);
                                });
                        } else {
                            return $q.reject("No active assessment.");
                        }
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
        }

        function updateCurrentRoute(route) {
            return RiskAssessmentDataService.getAssessmentData(route.id)
                .then(function (data) {
                    if (data.currentRoute) {
                        console.log("currentRoute found");
                        var currentRoute = new Route(data.currentRoute);
                        var newRouteVersion = new Route(route);
                        var isChanged = !currentRoute.equals(newRouteVersion);

                        if (isChanged) {
                            console.log("Route has changed!!!");
                            data.currentAssessment = null;
                            data.routeLocations = data.routeLocations.filter(function (loc) {
                                return newRouteVersion.isOnRoute(loc);
                            });

                            data.routeLocations.forEach(function (loc) {
                                loc.eta = newRouteVersion.getTimeAtPosition(new RouteLocation(loc).asPosition());
                                console.log(loc.eta.format());
                            })
                        }
                    }

                    data.currentRoute = route;

                    return saveAssessmentData(route.id, data);
                });
        }

        function createRouteLocation(route, locationAttributes) {
            var routeId = route.id;

            return RiskAssessmentDataService.getAssessmentData(routeId)
                .then(function (data) {
                    try {
                        var routeLocation = new RouteLocation(locationAttributes);
                        routeLocation.id = data.routeLocationSequence++;
                        routeLocation.routeId = routeId;
                        routeLocation.eta = new Route(route).getTimeAtPosition(routeLocation.asPosition());
                        data.routeLocations.push(routeLocation);
                        return RiskAssessmentDataService.storeAssessmentData(routeId, data)
                            .then(function () {
                                return $q.when(routeLocation);
                            });
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
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