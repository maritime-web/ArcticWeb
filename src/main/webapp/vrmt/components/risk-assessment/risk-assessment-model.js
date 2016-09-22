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
 * Represents risk assessment of a route.
 * @param {AssessmentOptions} parameters
 * @constructor
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
    this.started = parameters.started ? moment(parameters.started): undefined;
    /**
     * The time where the assessment was completed.
     * @type {number|undefined}
     */
    this.finished = parameters.finished ? moment(parameters.finished) : undefined;
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

    this.updateLocationAssessment = function (routeLocationId, scores, note) {
        var routeLocation = this.locationsToAssess.find(function (candidate) {
            return routeLocationId == candidate.id;
        });
        if (!routeLocation) {
            throw "Could not find route location with id: '" + routeLocationId + "' in assessment identified by '" + this.id + "'";
        }
        var locationAssessment = new LocationAssessment({time: moment(), routeLocation: routeLocation, scores: scores || [], note: note});
        this.locationAssessments.set(routeLocationId, locationAssessment);
    };

    this.isComplete = function () {
        return Array.from(this.locationAssessments.values()).every(function (locationAssessment) {
            return locationAssessment.scores.length > 0;
        });
    }
}

function RouteLocation(parameters) {
    Object.assign(this, parameters);
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

embryo.vrmt.Route = function (route) {
    Object.assign(this, route);
    this.getTimeAtPosition = getTimeAtPosition;
    this.getClosestPointOnRoute = getClosestPointOnRoute;
    this.getExpectedVesselPosition = getExpectedVesselPosition;
    this.isOnRoute = isOnRoute;
    this.isVesselOnRoute = isVesselOnRoute;
    this.getStartPosition = getStartPosition;
    this.equals = equals;

    var metersToNm = embryo.geo.Converter.metersToNm;
    var routeAsLinestring = toLineString(this.wps);
    var legs = toLegs(this.wps);

    function getTimeAtPosition(aPosition) {
        var hours = getHoursToReachPosition(aPosition);
        var departure = moment(this.etaDep);

        return departure.add(hours, "h");
    }

    function getHoursToReachPosition(aPosition) {
        var positionOnRoute = getClosestPointOnRoute(aPosition);

        var distanceBetween = positionOnRoute.geodesicDistanceTo(aPosition);
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

    function getClosestPointOnRoute(givenPosition) {
        var turfPoint = turf.point([givenPosition.lon, givenPosition.lat]);
        var turfPointOnLine = turf.pointOnLine(routeAsLinestring, turfPoint);
        return new embryo.geo.Position(turfPointOnLine.geometry.coordinates[0], turfPointOnLine.geometry.coordinates[1]);
    }

    function getExpectedVesselPosition(dateTime) {
        var vesselPosition = null;
        legs.some(function (leg) {
            if (leg.containsVesselAt(dateTime)) {
                vesselPosition = leg.getVesselPositionAt(dateTime);
                return true;
            }
            return false;
        });
        return vesselPosition;
    }

    function isOnRoute(routeLocation) {
        var givenPosition = turf.point([routeLocation.lon, routeLocation.lat]);
        var closestPoint = turf.pointOnLine(routeAsLinestring, givenPosition);
        var distanceBetween = metersToNm(turf.distance(closestPoint, givenPosition)*1000);
        return distanceBetween < 10;
    }

    function isVesselOnRoute() {
        var now = moment();
        return legs.some(function (leg) {
            return leg.containsVesselAt(now);
        });
    }

    function getStartPosition() {
        var firstWp = this.wps[0];
        return [firstWp.longitude, firstWp.latitude];
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
        return turf.linestring(coords);
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
            leg.from = new embryo.geo.Position(wp1.longitude, wp1.latitude);
            leg.lineString = turf.linestring([[wp1.longitude, wp1.latitude], [wp2.longitude, wp2.latitude]]);
            leg.hours = moment.duration(moment(wp2.eta).diff(wp1.eta)).asHours();
            leg.startTime = moment(wp1.eta);
            leg.endTime = moment(wp2.eta);

            leg.contains = function (position) {
                var turfPoint = turf.point([position.lon, position.lat]);
                var p = turf.pointOnLine(this.lineString, turfPoint);
                var positionOnLine = new embryo.geo.Position(p.geometry.coordinates[0], p.geometry.coordinates[1]);
                return positionOnLine.geodesicDistanceTo(position) < 0.1;
            };

            leg.hoursTo = function (position) {
                var distance = this.from.distanceTo(position, this.heading);
                return distance / this.speed;
            };

            leg.containsVesselAt = function (dateTime) {
                return this.startTime.isSameOrBefore(dateTime) && this.endTime.isSameOrAfter(dateTime)
            };

            leg.getVesselPositionAt = function (dateTime) {
                var secondsFromStart = moment.duration(moment(dateTime).diff(this.startTime)).asSeconds();
                var lengthInKm = embryo.geo.Converter.knots2Ms(this.speed) * secondsFromStart / 1000.0;
                var point = turf.along(this.lineString, lengthInKm, "kilometers");
                return [point.geometry.coordinates[0],point.geometry.coordinates[1]];
            };

            return leg;
        }

        return res;
    }
};
