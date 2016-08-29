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
    this.routeId = parameters.routeId;
    this.id = parameters.id;
    this.name = parameters.name;
    this.lat = parameters.lat;
    this.lon = parameters.lon;
    this.eta = parameters.eta;
    this.getLatLon = function () {
        return [this.lat, this.lon];
    }
}

function LocationAssessment(parameters) {
    this.time = parameters.time;
    this.location = new RouteLocation(parameters.routeLocation);
    this.scores = parameters.scores;
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

function Route(route) {
    var delegate = route;

    var routeAsLinestring = toLineString();
    var legs = toLegs();

    function toLineString() {
        var coords = delegate.wps.map(function (wp) {
            return [wp.latitude, wp.longitude];
        });
        return turf.linestring(coords);
    }

    function toLegs() {
        var res = [];

        for (var i = 0; i < delegate.wps.length - 1; i++) {
            res.push(createLeg(delegate.wps[i], delegate.wps[i + 1]));
        }

        function createLeg(wp1, wp2) {
            var leg = {};
            leg.speed = wp1.speed;
            leg.p1 = [wp1.latitude, wp1.longitude];
            leg.p2 = [wp2.latitude, wp2.longitude];
            leg.lineString = turf.linestring([leg.p1, leg.p2]);
            leg.length = turf.lineDistance(leg.lineString, "miles");
            leg.hours = moment.duration(moment(wp2.eta).diff(wp1.eta)).asHours();
            return leg;
        }

        return res;
    }

    this.getTimeAtPosition = function (latLon) {
        var givenPosition = turf.point(latLon);
        var positionOnRoute = getClosestPointOnRoute(givenPosition);
        var hours = getHoursToReachPosition(positionOnRoute);

        var departure = moment(delegate.etaDep);
        return departure.hour(hours);
    };

    function getHoursToReachPosition(positionOnRoute) {
        var distance = getDistanceFromOrigin(positionOnRoute);
        var length = 0;
        var hours = 0;
        for (var i = 0; length < distance && i < legs.length; i++) {
            var leg = legs[i];
            length += leg.length;
            if (length > distance) {
                var p1 = turf.point(leg.p1);
                var p2 = positionOnRoute;
                var ls = leg.lineString;
                var slice = turf.lineSlice(p1, p2, ls);

                var dist = turf.lineDistance(slice, "miles");
                hours += dist / leg.speed;
            } else {
                hours += leg.hours;
            }
        }

        return hours;
    }

    function getClosestPointOnRoute(givenPosition) {
        var closestPoint = turf.pointOnLine(routeAsLinestring, givenPosition);
        var distanceBetween = turf.distance(closestPoint, givenPosition, "miles");
        if (distanceBetween > 10) {
            var errorMsg = "Given position must be no more than 10 miles from the route. It was " + distanceBetween + " miles";
            throw errorMsg;
        }
        return turf.pointOnLine(routeAsLinestring, givenPosition);
    }

    function getDistanceFromOrigin(pointOnLine) {
        var pStart = turf.point([delegate.wps[0].latitude, delegate.wps[0].longitude]);
        var slice = turf.lineSlice(pStart, pointOnLine, routeAsLinestring);

        return turf.lineDistance(slice, "miles");
    }
}
