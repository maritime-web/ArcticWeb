embryo.vrmt = {};

function Assessment(parameters) {
    this.id = parameters.id;
    this.routeId = parameters.routeId;
    this.started = parameters.started ? moment(parameters.started): undefined;
    this.finished = parameters.finished ? moment(parameters.finished) : undefined;
    if (!parameters.locationsToAssess) {
        throw "There must be at least one route location";
    }
    this.locationsToAssess = parameters.locationsToAssess;
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

    this.updateLocationAssessment = function (routeLocationId, scores) {
        var routeLocation = this.locationsToAssess.find(function (candidate) {
            return routeLocationId == candidate.id;
        });
        if (!routeLocation) {
            throw "Could not find route location with id: '" + routeLocationId + "' in assessment identified by '" + this.id + "'";
        }
        var locationAssessment = new LocationAssessment({time: moment(), routeLocation: routeLocation, scores: scores || []});
        this.locationAssessments.set(routeLocationId, locationAssessment);
    };

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
    this.isOnRoute = isOnRoute;
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
        var turfPoint = turf.point([givenPosition.lat, givenPosition.lon]);
        var turfPointOnLine = turf.pointOnLine(routeAsLinestring, turfPoint);
        return new embryo.geo.Position(turfPointOnLine.geometry.coordinates[1], turfPointOnLine.geometry.coordinates[0]);
    }

    function isOnRoute(routeLocation) {
        var givenPosition = turf.point([routeLocation.lat, routeLocation.lon]);
        var closestPoint = turf.pointOnLine(routeAsLinestring, givenPosition);
        var distanceBetween = metersToNm(turf.distance(closestPoint, givenPosition)*1000);
        return distanceBetween < 10;
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
            return [wp.latitude, wp.longitude];
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
            leg.speed = wp1.speed;
            leg.heading = wp1.heading;
            leg.from = new embryo.geo.Position(wp1.longitude, wp1.latitude);
            leg.lineString = turf.linestring([[wp1.latitude, wp1.longitude], [wp2.latitude, wp2.longitude]]);
            leg.hours = moment.duration(moment(wp2.eta).diff(wp1.eta)).asHours();

            leg.contains = function (position) {
                var turfPoint = turf.point([position.lat, position.lon]);
                var p = turf.pointOnLine(this.lineString, turfPoint);
                var positionOnLine = new embryo.geo.Position(p.geometry.coordinates[1], p.geometry.coordinates[0]);
                return positionOnLine.geodesicDistanceTo(position) < 0.1;
            };

            leg.hoursTo = function (position) {
                var distance = this.from.distanceTo(position, this.heading);
                return distance / this.speed;
            };

            return leg;
        }

        return res;
    }
};
