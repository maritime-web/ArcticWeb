(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentService', RiskAssessmentService);

    RiskAssessmentService.$inject = ['$q', 'RiskAssessmentDataService', 'NotifyService', 'Events'];

    function RiskAssessmentService($q, RiskAssessmentDataService, NotifyService, Events) {

        this.getCurrentAssessment = getCurrentAssessment;
        this.startNewAssessment = startNewAssessment;
        this.endAssessment = endAssessment;
        this.discardAssessment = discardAssessment;
        this.createLocationAssessment = createLocationAssessment;
        this.getCompletedAssessments = getCompletedAssessments;
        this.deleteLocation = deleteLocation;
        this.updateCurrentRoute = updateCurrentRoute;
        this.createRouteLocation = createRouteLocation;
        this.deleteRouteLocation = deleteRouteLocation;
        this.getRouteLocations = getRouteLocations;

        var currentRouteId = null;
        /**
         * Returns the assessment currently being created
         * @returns {*}
         */
        function getCurrentAssessment() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    if (data.currentAssessment) {
                        return new Assessment(/** @type {AssessmentOptions} */data.currentAssessment);
                    }
                    return $q.reject("There is no current assessment for route '" +currentRouteId+ "'");
                });
        }

        /**
         * Starts a new assessment and assigns it as the assessment currently under construction.
         * @returns {promise} a promise of the newly created assessment
         */
        function startNewAssessment() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    discardCurrentAssessment();
                    assertThatRouteIsAssessable();
                    data.currentAssessment = createNewAssessment();
                    return saveAssessmentData(data);

                    function discardCurrentAssessment() {
                        data.currentAssessment = null;
                    }

                    function assertThatRouteIsAssessable() {
                        var currentRoute = new embryo.vrmt.Route(data.currentRoute);
                        if (currentRoute.isCompleted()) {
                            throw new Error("Can not start a new assessment since the route is already completed");
                        }
                    }

                    function createNewAssessment() {
                        var locationsToAssess = getLocationsNotYetPassed();
                        var result = new Assessment({id: moment().utc().unix(), routeId: currentRouteId, started: moment().utc(), locationsToAssess: locationsToAssess});
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

                        return result;
                    }

                    function getLocationsNotYetPassed() {
                        var currentTime = moment().utc().subtract(1, 'h');
                        return data.routeLocations.filter(function (location) {
                            return currentTime.isSameOrBefore(location.eta);
                        });
                    }

                    function getLastAssessment() {
                        if (data.assessments.length === 0) return null;

                        return data.assessments.reduce(function (cur, prev) {
                            return moment(cur.finished).isAfter(prev.finished) ? cur : prev;
                        });
                    }
                });

        }

        /**
         * Ends the current assessment and adds it to the list of completed assessments
         */
        function endAssessment() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    data.currentAssessment.finished = moment().utc();
                    data.assessments.push(data.currentAssessment);
                    data.currentAssessment = null;
                    return saveAssessmentData(data);
                });
        }

        /**
         * Discards the current assessment.
         */
        function discardAssessment() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    data.currentAssessment = null;
                    return saveAssessmentData(data);
                });
        }

        function saveAssessmentData(data, returnValue) {
            return RiskAssessmentDataService.storeAssessmentData(currentRouteId, data)
                .then(function () {
                    return returnValue || data.currentAssessment;
                });
        }

        /**
         * Creates a new Risk assessment for the given route and location.
         *
         * @param locationId
         * @param scores
         * @param note
         * @returns {deferred.promise|{then, catch, finally}}
         */
        function createLocationAssessment(locationId, scores, note) {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    try {
                        if (data.currentAssessment) {
                            data.currentAssessment = new Assessment(/** @type {AssessmentOptions} */data.currentAssessment);
                            data.currentAssessment.updateLocationAssessment(locationId, scores, note);

                            return RiskAssessmentDataService.storeAssessmentData(currentRouteId, data)
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

        function getCompletedAssessments() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    return data.assessments.map(function (assessment) {
                        return new Assessment(assessment);
                    })
                })
        }

        function deleteLocation(locationId) {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    try {
                        if (data.currentAssessment) {
                            data.currentAssessment = new Assessment(/** @type {AssessmentOptions} */data.currentAssessment);
                            data.currentAssessment.deleteLocation(locationId);

                            return RiskAssessmentDataService.storeAssessmentData(currentRouteId, data)
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
            currentRouteId = route.id;
            return RiskAssessmentDataService.getAssessmentData(route.id)
                .then(function (data) {
                    if (data.currentRoute) {
                        var currentRoute = new embryo.vrmt.Route(data.currentRoute);
                        var newRouteVersion = new embryo.vrmt.Route(route);
                        var isChanged = !currentRoute.equals(newRouteVersion);

                        if (isChanged) {
                            data.currentAssessment = null;
                            data.routeLocations = data.routeLocations.filter(function (loc) {
                                return newRouteVersion.isOnRoute(loc);
                            });

                            data.routeLocations.forEach(function (loc) {
                                loc.eta = newRouteVersion.getTimeAtPosition(new RouteLocation(loc).asPosition());
                            })
                        }
                    }

                    data.currentRoute = route;
                    var defaultRouteLocations = createDefaultRouteLocationsIfNotPresent(data);
                    data.routeLocations = data.routeLocations.concat(defaultRouteLocations);

                    return saveAssessmentData(data, data.currentRoute)
                        .then(function () {
                            NotifyService.notify(Events.RouteChanged, data.currentRoute);
                        });
                });

            function createDefaultRouteLocationsIfNotPresent(data) {
                var result = [];
                var route = new embryo.vrmt.Route(data.currentRoute);

                var firstWp = route.wps[0];
                var found = data.routeLocations.find(function (loc) {
                    return closeTo(firstWp.latitude, loc.lat) && closeTo(firstWp.longitude, loc.lon);
                });
                if (!found) {
                    result.push(createRouteLocationFromWaypoint(data, firstWp, route.dep));
                }

                var lastWp = route.wps[route.wps.length - 1];
                found = data.routeLocations.find(function (loc) {
                    return closeTo(lastWp.latitude, loc.lat) && closeTo(lastWp.longitude, loc.lon);
                });
                if (!found) {
                    result.push(createRouteLocationFromWaypoint(data, lastWp, route.des));
                }

                return result;

                function closeTo(operand1, operand2) {
                    return Math.abs(operand1 - operand2) < 0.0000001;
                }
            }
        }

        function createRouteLocation(locationAttributes) {

            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    try {
                        var routeLocation = createRouteLocation_(data, locationAttributes);
                        data.routeLocations.push(routeLocation);
                        return RiskAssessmentDataService.storeAssessmentData(currentRouteId, data)
                            .then(function () {
                                return $q.when(routeLocation);
                            });
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
        }

        function createRouteLocationFromWaypoint(data, wp, name) {
            return createRouteLocation_(data, {lat: wp.latitude, lon: wp.longitude, name: name ? name : wp.name})
        }

        function createRouteLocation_(data, locationAttributes) {
            var routeLocation = new RouteLocation(locationAttributes);
            routeLocation.id = data.routeLocationSequence++;
            routeLocation.routeId = data.currentRoute.id;
            routeLocation.eta = new embryo.vrmt.Route(data.currentRoute).getTimeAtPosition(routeLocation.asPosition());
            return routeLocation;
        }

        function deleteRouteLocation(routeLocationToDelete) {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    try {
                        var routeLocations = data.routeLocations;
                        var index = routeLocations.findIndex(function (entry) {
                            return entry.id === routeLocationToDelete.id;
                        });

                        var deletedRouteLocationArray = routeLocations.splice(index, 1);

                        RiskAssessmentDataService.storeAssessmentData(currentRouteId, data)
                            .then(function () {
                                return $q.when(deletedRouteLocationArray);
                            });
                    } catch (e) {
                        return $q.reject(e);
                    }
                });
        }

        function getRouteLocations() {
            return RiskAssessmentDataService.getAssessmentData(currentRouteId)
                .then(function (data) {
                    return data.routeLocations;
                })
        }
    }
})();