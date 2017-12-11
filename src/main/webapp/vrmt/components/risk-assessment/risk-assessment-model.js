embryo.vrmt = {};

/**
 * @typedef {{
 * id: (string),
 * routeId: (string)
 * locationsToAssess: (Array<RouteLocation>),
 * started: (number|undefined),
 * finished: (number|undefined),
 * locationAssessments: (Array<Array<LocationAssessment>>|undefined)
 * }} AssessmentOptions
 */

/**
 * @classdesc
 * Represents risk assessment of a route.
 * @constructor
 * @param {AssessmentOptions} parameters
 */
function Assessment(parameters) {
    /**
     * Unique id
     * @type {string}
     */
    this.id = parameters.id;
    /**
     * Reference to the route this risk assessment is made for.
     * @type {string}
     */
    this.routeId = parameters.routeId;
    /**
     * The time where the assessment was started.
     * @type {number|undefined}
     */
    this.started = parameters.started ? moment(parameters.started).utc(): undefined;
    /**
     * The time where the assessment was completed.
     * @type {number|undefined}
     */
    this.finished = parameters.finished ? moment(parameters.finished).utc() : undefined;
    /**
     * The locations along the route which must be assessed.
     * @type {Array<RouteLocation>}
     */
    this.locationsToAssess = parameters.locationsToAssess;
    /**
     * The assessments made on locations to assess.
     * @type {Map<LocationAssessment>}
     */
    this.locationAssessments = null;

    if (!parameters.locationsToAssess) {
        throw "There must be at least one route location";
    }
    if (parameters.locationAssessments) {
        this.locationAssessments = new Map(parameters.locationAssessments);
    } else {
        var locationAssessments = new Map();
        this.locationsToAssess.forEach(function (loc) {
            locationAssessments.set(loc.id, null);
        });
        this.locationAssessments = locationAssessments;
    }

    this.deleteLocation = function (locationId) {
        if (this.locationsToAssess.length <= 1) {
            throw "It's illegal to delete the last route location from an assessment";
        }

        var indexToDelete = this.locationsToAssess.findIndex(function (loc) {
            return loc.id == locationId;
        });

        if (indexToDelete < 0) {
            throw "Can not delete location with id '"+locationId+"' because it is not included in this assessment.";
        }

        this.locationsToAssess.splice(indexToDelete, 1);
        this.locationAssessments.delete(locationId);
    };

    this.getMaxScore = function () {
        return Array.from(this.locationAssessments.values()).reduce(function (prev, cur) {
            return Math.max(prev, cur.index);
        }, 0);
    };

    this.getLocationAssessment = function (routeLocationId) {
        return this.locationAssessments.get(routeLocationId);
    };

    this.getLocationAssessments = function () {
        return Array.from(this.locationAssessments.values());
    };

    this.updateLocationAssessment = function (routeLocationId, scores, note) {
        var routeLocation = this.locationsToAssess.find(function (candidate) {
            return routeLocationId == candidate.id;
        });
        if (!routeLocation) {
            throw "Could not find route location with id: '" + routeLocationId + "' in assessment identified by '" + this.id + "'";
        }
        var locationAssessment = new LocationAssessment({time: moment().utc(), routeLocation: routeLocation, scores: scores || [], note: note});
        this.locationAssessments.set(routeLocationId, locationAssessment);
    };

    this.isComplete = function () {
        return Array.from(this.locationAssessments.values()).every(function (locationAssessment) {
            return locationAssessment.scores.length > 0;
        });
    }
}

function RouteLocation(parameters) {
    this.id = parameters.id;
    this.routeId = parameters.routeId;
    this.name = parameters.name;
    this.lon = parameters.lon;
    this.lat = parameters.lat;
    this.eta = parameters.eta;

    this.asPosition = function () {
        return new embryo.geo.Position(this.lon, this.lat);
    };
}

function LocationAssessment(parameters) {
    this.time = parameters.time;
    this.location = new RouteLocation(parameters.routeLocation);
    this.scores = parameters.scores || [];
    this.index = parameters.scores.reduce(function (prev, cur) {
        return prev + cur.index;
    }, 0);
    this.note = parameters.note;
}

function Score(parameters) {
    this.riskFactorId = parameters.riskFactor.id;
    this.scoreOption = parameters.scoreOption;
    this.index = parameters.index;
    this.factorName = parameters.riskFactor.name;
    this.name = parameters.scoreOption ? parameters.scoreOption.name : "-";
}

function ScoreOption(parameters) {
    this.name = parameters.name;
    this.index = parameters.index;
}

function ScoreInterval(parameters) {
    this.minIndex = parameters.minIndex;
    this.maxIndex = parameters.maxIndex;
}

function RiskFactor(parameters) {
    this.vesselId = parameters.vesselId;
    this.id = parameters.id;
    this.name = parameters.name;
    this.scoreOptions = parameters.scoreOptions;
    this.scoreInterval = parameters.scoreInterval;

    if (parameters.scoreOptions && parameters.scoreInterval) {
        throw new Error("A risk factor can't have both score options and score interval");
    }
    if (!parameters.scoreOptions && !parameters.scoreInterval) {
        throw new Error("A risk factor must have either score options or a score interval");
    }
}

(function () {
    'use strict';

    angular.module('vrmt.model', ['embryo.components.openlayer', 'embryo.geo.services', 'embryo.route']);
    angular.module('vrmt.model')
        .factory('RouteFactory', RouteFactory);

    RouteFactory.$inject = ['Position', 'OpenlayerService', 'Route'];

    function RouteFactory(Position, OpenlayerService, Route) {

        embryo.vrmt.Route = function (route) {
            Object.assign(this, route);
            var that = this;
            this.getTimeAtPosition = getTimeAtPosition;
            this.getClosestPointOnRoute = getClosestPointOnRoute;
            this.getExpectedVesselPosition = getExpectedVesselPosition;
            this.getBearingAt = getBearingAt;
            this.isOnRoute = isOnRoute;
            this.isVesselOnRoute = isVesselOnRoute;
            this.getStartPosition = getStartPosition;
            this.isCompleted = isCompleted;
            this.equals = equals;

            var metersToNm = embryo.geo.Converter.metersToNm;
            var routeAsLinestring = toLineString(this.wps);
            var legs = toLegs(this.wps);

            validate();

            function getTimeAtPosition(aPosition) {
                var hours = getHoursToReachPosition(aPosition);
                var departure = moment(this.etaDep).utc();

                return departure.add(hours, "h");
            }

            function getHoursToReachPosition(aPosition) {
                var positionOnRoute = getClosestPointOnRoute(aPosition);

                var distanceBetween = positionOnRoute.rhumbLineDistanceTo(aPosition);
                if (distanceBetween > 10) {
                    var errorMsg = "Given position must be no more than 10 miles from the route. It was " + distanceBetween + " miles";
                    throw new Error(errorMsg);
                }

                var hours = 0;
                for (var i = 0; i < legs.length; i++) {
                    var leg = legs[i];
                    if (leg.contains(positionOnRoute)) {
                        hours += leg.hoursTo(positionOnRoute);
                        break;
                    } else {
                        hours += leg.hours;
                    }
                }

                return hours;
            }

            /**
             *
             * @param {embryo.geo.Position} givenPosition
             * @return {embryo.geo.Position} Closest point.
             */
            function getClosestPointOnRoute(givenPosition) {

                var coords = Route.build(that).createRoutePoints();

                /** @type {ol.geom.LineString} */
                var lineString = OpenlayerService.createLineString(coords);
                var point = OpenlayerService.toLonLat(lineString.getClosestPoint(OpenlayerService.fromLonLat(givenPosition.asLonLatArray())));
                return Position.create(point[0], point[1]);
            }

            /**
             * Calculates the expected vessel position on the route at the given time.
             * @param dateTime
             * @returns {embryo.geo.Position | null}
             */
            function getExpectedVesselPosition(dateTime) {
                var activeLeg = getActiveLegAt(dateTime);
                return activeLeg ? activeLeg.getVesselPositionAt(dateTime) : null;
            }

            function getBearingAt(dateTime) {
                var activeLeg = getActiveLegAt(dateTime);
                return activeLeg ? activeLeg.getBearing() : 0;
            }

            function getActiveLegAt(dateTime) {
                return legs.find(function (leg) {
                    return leg.containsVesselAt(dateTime);
                });
            }

            function isOnRoute(routeLocation) {
                var givenPosition = turf.point([routeLocation.lon, routeLocation.lat]);
                var closestPoint = turf.pointOnLine(routeAsLinestring, givenPosition);
                var distanceBetween = metersToNm(turf.distance(closestPoint, givenPosition)*1000);
                return distanceBetween < 10;
            }

            function isVesselOnRoute() {
                var now = moment().utc();
                return legs.some(function (leg) {
                    return leg.containsVesselAt(now);
                });
            }

            function getStartPosition() {
                var firstWp = that.wps[0];
                return [firstWp.longitude, firstWp.latitude];
            }

            function isCompleted() {
                return moment().utc().isAfter(this.eta);
            }

            function equals(otherRoute) {
                var thisRoute = this;
                var sameDeparture = function () {
                    return thisRoute.etaDep == otherRoute.etaDep;
                };
                var sameWayPointCount = function () {
                    return thisRoute.wps.length == otherRoute.wps.length;
                };
                var sameWayPoints = function () {
                    var res = true;
                    for (var i = 0; i < thisRoute.wps; i++) {
                        var thisWp = thisRoute.wps[i];
                        var otherWp = otherRoute.wps[i];
                        if (thisWp.lat != otherWp.lat || thisWp.lon != otherWp.lon || thisWp.eta != otherWp.eta) {
                            res = false;
                            break;
                        }
                    }
                    return res;
                };
                return sameDeparture() && sameWayPointCount() && sameWayPoints();
            }

            function toLineString(wps) {
                var coords = wps.map(function (wp) {
                    return [wp.longitude, wp.latitude];
                });
                return turf.lineString(coords);
            }

            function toLegs(wps) {
                var res = [];

                for (var i = 0; i < wps.length - 1; i++) {
                    res.push(createLeg(wps[i], wps[i + 1]));
                }

                function createLeg(wp1, wp2) {
                    var leg = {};
                    leg.speed = wp1.speed; // nots/h
                    leg.heading = wp1.heading;
                    /** @type {embryo.geo.Position} */
                    leg.from = Position.create(wp1.longitude, wp1.latitude);
                    /** @type {embryo.geo.Position} */
                    leg.to = Position.create(wp2.longitude, wp2.latitude);
                    if (leg.heading === 'GC') {
                        leg.length = leg.from.geodesicDistanceTo(leg.to);
                    } else {
                        leg.length = leg.from.rhumbLineDistanceTo(leg.to);
                    }
                    leg.hours = moment.duration(moment(wp2.eta).diff(wp1.eta)).asHours();
                    leg.startTime = moment(wp1.eta).utc();
                    leg.endTime = moment(wp2.eta).utc();

                    /**
                     * Determines if this leg does contain the given position.
                     * @param position
                     * @returns {boolean}
                     */
                    leg.contains = function (position) {
                        var lineString = this.asOpenlayerLinestring();
                        var closest = lineString.getClosestPoint(OpenlayerService.fromLonLat([position.lon, position.lat]));
                        var closestPosition = Position.create(OpenlayerService.toLonLat(closest));

                        return closestPosition.geodesicDistanceTo(position) < 0.1;
                    };

                    leg.hoursTo = function (position) {
                        var distance = this.from.distanceTo(position, this.heading);
                        return distance / this.speed;
                    };

                    leg.containsVesselAt = function (dateTime) {
                        return this.startTime.isSameOrBefore(dateTime) && this.endTime.isSameOrAfter(dateTime)
                    };

                    leg.getVesselPositionAt = function (dateTime) {
                        var secondsFromStart = moment.duration(moment(dateTime).utc().diff(this.startTime)).asSeconds();
                        var lengthInNm = embryo.geo.Converter.metersToNm(embryo.geo.Converter.knots2Ms(this.speed) * secondsFromStart);
                        var lineString = this.asOpenlayerLinestring();

                        return Position.create(OpenlayerService.toLonLat(lineString.getCoordinateAt(lengthInNm/this.length)));
                    };

                    leg.getBearing = function () {
                        var bearing = this.from.bearingTo(this.to, this.heading);
                        return embryo.Math.toRadians(bearing);
                    };

                    leg.asOpenlayerLinestring = function () {
                        var points = [this.from.asLonLatArray(), this.to.asLonLatArray()];
                        if (this.heading === 'GC') {
                            points = this.createGeoDesicLineAsGeometryPoints({
                                y: this.from.lat,
                                x: this.from.lon
                            }, {
                                y: this.to.lat,
                                x: this.to.lon
                            });
                        }
                        return OpenlayerService.createLineString(points);
                    };

                    leg.createGeoDesicLineAsGeometryPoints = function (p1, p2) {
                        var generator = new arc.GreatCircle(p1, p2, {
                            'foo': 'bar'
                        });
                        var line = generator.Arc(100, {
                            offset: 10
                        });

                        var points = [];
                        for (var i in line.geometries) {
                            for (var j in line.geometries[i].coords) {
                                points.push([line.geometries[i].coords[j][0], line.geometries[i].coords[j][1]]);
                            }
                        }

                        return points;
                    };

                    return leg;
                }

                return res;
            }

            function validate() {
                verifyPositiveSpeedForAllLegs();

                function verifyPositiveSpeedForAllLegs() {
                    var isPositiveSpeed = legs.every(function (leg) {
                        return leg.speed > 0;
                    });
                    if (!isPositiveSpeed) {
                        throw new Error("A vessels speed on a route can't be zero between waypoints");
                    }
                }
            }
        };

        return {
            create : function (route) {
                return new embryo.vrmt.Route(route);
            }
        };
    }
})();

