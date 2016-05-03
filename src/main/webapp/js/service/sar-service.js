(function () {
    "use strict";

    var module = angular.module('embryo.sar.service', ['pouchdb', 'embryo.storageServices', 'embryo.authentication.service', 'embryo.position']);

    function findSearchObjectType(id) {
        for (var index in embryo.sar.searchObjectTypes) {
            if (embryo.sar.searchObjectTypes[index].id === id) {
                return embryo.sar.searchObjectTypes[index];
            }
        }
        return null;
    }

    function directionDegrees(value) {
        if (typeof value !== 'string') {
            return value;
        }
        for (var index in embryo.sar.directions) {
            if (embryo.sar.directions[index].name === value) {
                return embryo.sar.directions[index].degrees;
            }
        }
        return parseInt(value, 10);
    }


    function SarOperationCalculator() {
        this.output = {}
    }

    SarOperationCalculator.prototype.setInput = function (input) {
        this.input = input;
    }

    SarOperationCalculator.prototype.validate = function (input) {
        this.setInput(input)

        assertObjectFieldValue(this.input, "startTs");
        assertObjectFieldValue(this.input.lastKnownPosition, "ts");
        assertObjectFieldValue(this.input.lastKnownPosition, "lon");
        assertObjectFieldValue(this.input.lastKnownPosition, "lat");
        assertObjectFieldValue(this.input, "xError");
        assertObjectFieldValue(this.input, "yError");
        assertObjectFieldValue(this.input, "safetyFactor");

        for (var i = 0; i < this.input.surfaceDriftPoints.length; i++) {
            assertObjectFieldValue(this.input.surfaceDriftPoints[i], "ts");
            assertObjectFieldValue(this.input.surfaceDriftPoints[i], "twcSpeed");
            assertObjectFieldValue(this.input.surfaceDriftPoints[i], "twcDirection");
            assertObjectFieldValue(this.input.surfaceDriftPoints[i], "leewaySpeed");
            assertObjectFieldValue(this.input.surfaceDriftPoints[i], "leewayDirection");
        }
    }

    SarOperationCalculator.prototype.timeElapsed = function () {
        var difference = (this.input.startTs - this.input.lastKnownPosition.ts) / 60 / 60 / 1000;
        this.output.timeElapsed = difference;

        this.output.hoursElapsed = Math.floor(difference);
        this.output.minutesElapsed = Math.round((difference - this.output.hoursElapsed) * 60);
    }

    SarOperationCalculator.prototype.convertSearchAreaPositions = function (converter, area) {
        var result = clone(area);
        result.A = converter(result.A);
        result.B = converter(result.B);
        result.C = converter(result.C);
        result.D = converter(result.D);
        return result;
    }

    function RapidResponseCalculator(PositionService) {
        this.PositionService = PositionService;
    }

    RapidResponseCalculator.prototype = new SarOperationCalculator();
    RapidResponseCalculator.prototype.calculate = function (input) {
        this.validate(input);

        this.timeElapsed();

        var startTs = this.input.lastKnownPosition.ts;

        var datumPositions = [];
        var currentPositions = [];

        var validFor = null;
        var lastDatumPosition = null

        var searchObject = findSearchObjectType(this.input.searchObject);

        for (var i = 0; i < this.input.surfaceDriftPoints.length; i++) {
            // Do we have a next?
            // How long is the data point valid for?
            // Is it the last one?
            if (i == this.input.surfaceDriftPoints.length - 1) {
                // It's the last one - let it last the remainder
                validFor = (this.input.startTs - startTs) / 60 / 60 / 1000;
            } else {
                var currentTs = this.input.surfaceDriftPoints[i].ts;
                if (currentTs < this.input.lastKnownPosition.ts) {
                    currentTs = this.input.lastKnownPosition.ts;
                }
                startTs = this.input.surfaceDriftPoints[i + 1].ts;
                validFor = (startTs - currentTs) / 60 / 60 / 1000;
            }

            var currentTWC = this.input.surfaceDriftPoints[i].twcSpeed * validFor;

            var startingLocation = null;

            if (i == 0) {
                startingLocation = new embryo.geo.Position(this.input.lastKnownPosition.lon, this.input.lastKnownPosition.lat);
            } else {
                startingLocation = lastDatumPosition;
            }
            var twcDirectionInDegrees = directionDegrees(this.input.surfaceDriftPoints[i].twcDirection);
            var currentPos = startingLocation.transformPosition(twcDirectionInDegrees, currentTWC);
            currentPositions.push(currentPos)

            var leewaySpeed = searchObject.leewaySpeed(this.input.surfaceDriftPoints[i].leewaySpeed);
            var leewayDriftDistance = leewaySpeed * validFor;

            var downWind = this.input.surfaceDriftPoints[i].downWind
            if (!downWind) {
                downWind = directionDegrees(this.input.surfaceDriftPoints[i].leewayDirection) - 180;
            }

            var leewayPos = currentPos.transformPosition(downWind, leewayDriftDistance);
            datumPositions.push(leewayPos);
            lastDatumPosition = leewayPos;
        }

        this.output.datum = lastDatumPosition;
        this.output.windPositions = datumPositions;
        this.output.currentPositions = currentPositions;

        if (datumPositions.length > 1) {
            var pos = datumPositions[datumPositions.length - 2];
            this.output.rdv = calculateRdv(pos, lastDatumPosition, validFor);
        } else {
            var lastKnownPosition = new embryo.geo.Position(this.input.lastKnownPosition.lon, this.input.lastKnownPosition.lat);
            this.output.rdv = calculateRdv(lastKnownPosition, lastDatumPosition, this.output.timeElapsed);
        }

        this.output.radius = ((this.input.xError + this.input.yError) + 0.3 * this.output.rdv.distance) * this.input.safetyFactor;
        this.calculateSearchArea(this.output.datum, this.output.radius, this.output.rdv.direction);

        return this.output;
    }

    RapidResponseCalculator.prototype.validateSearchAreaInput = function (datum, radius, rdvDirection) {
        assertValue(datum.lat, "datum.lat")
        assertValue(datum.lon, "datum.lon")
        assertValue(radius, "radius")
        assertValue(rdvDirection, "rdvDirection")
    }

    RapidResponseCalculator.prototype.calculateSearchArea = function (datum, radius, rdvDirection) {
        this.validateSearchAreaInput(datum, radius, rdvDirection);

        var reverseDirection = embryo.geo.reverseDirection;
        // Search box
        // The box is square around the circle, with center point at datum
        // Radius is the calculated Radius
        // data.getRdvDirection()
        var verticalDirection = rdvDirection;
        var horizontalDirection = verticalDirection + 90;

        if (horizontalDirection > 360) {
            horizontalDirection = horizontalDirection - 360;
        }

        // First top side of the box
        var topCenter = datum.transformPosition(verticalDirection, radius);

        // Bottom side of the box
        var bottomCenter = datum.transformPosition(reverseDirection(verticalDirection), radius);

        // Go left radius length
        var a = topCenter.transformPosition(reverseDirection(horizontalDirection), radius);
        var b = topCenter.transformPosition(horizontalDirection, radius);
        var c = bottomCenter.transformPosition(horizontalDirection, radius);
        var d = bottomCenter.transformPosition(reverseDirection(horizontalDirection), radius);

        this.output.searchArea = {
            A: a,
            B: b,
            C: c,
            D: d,
            size: radius * radius * 4
        }
    };

    RapidResponseCalculator.prototype.convertPositionsToStrings = function (output){
        var result = clone(output);
        result.datum = this.PositionService.degreesToStrings(result.datum);
        result.searchArea = this.convertSearchAreaPositions(this.PositionService.degreesToStrings, result.searchArea);
        return result;
    }

    RapidResponseCalculator.prototype.convertPositionsToDegrees = function (output){
        var result = clone(output);
        result.datum = this.PositionService.stringsToDegrees(result.datum);
        result.searchArea = this.convertSearchAreaPositions(this.PositionService.stringsToDegrees, result.searchArea);
        return result;
    }


    function calculateRdv(fromPosition, toPosition, timebetweenInHours) {
        var rdv = {}
        rdv.direction = fromPosition.bearingTo(toPosition, embryo.geo.Heading.RL);
        rdv.distance = fromPosition.distanceTo(toPosition, embryo.geo.Heading.RL);
        rdv.speed = rdv.distance / timebetweenInHours;
        return rdv;
    }

    function calculateRadius(xError, yError, rdvDistance, safetyFactor) {
        return ((xError + yError) + 0.3 * rdvDistance) * safetyFactor;
    }


    function DatumPointCalculator(PositionService) {
        this.PositionService = PositionService;
    }

    DatumPointCalculator.prototype = new SarOperationCalculator();
    DatumPointCalculator.prototype.calculate = function (input) {
        this.validate(input)

        this.timeElapsed();

        var startTs = this.input.lastKnownPosition.ts;
        var datumDownwindPositions = [];
        var datumMinPositions = [];
        var datumMaxPositions = [];
        var currentPositions = []

        var validFor = null
        var lastKnownPosition = new embryo.geo.Position(this.input.lastKnownPosition.lon, this.input.lastKnownPosition.lat)
        var searchObject = findSearchObjectType(input.searchObject);

        for (var i = 0; i < this.input.surfaceDriftPoints.length; i++) {
            // Do we have a next?
            // How long is the data point valid for?
            // Is it the last one?
            if (i == this.input.surfaceDriftPoints.length - 1) {
                // It's the last one - let it last the remainder
                validFor = (this.input.startTs - startTs) / 60 / 60 / 1000;
            } else {
                var currentTs = this.input.surfaceDriftPoints[i].ts;
                if (currentTs < this.input.lastKnownPosition.ts) {
                    currentTs = this.input.lastKnownPosition.ts;
                }
                startTs = this.input.surfaceDriftPoints[i + 1].ts;
                validFor = (startTs - currentTs) / 60 / 60 / 1000;
            }

            var currentTWC = this.input.surfaceDriftPoints[i].twcSpeed * validFor;

            var startingLocation = null;

            if (i == 0) {
                startingLocation = lastKnownPosition;
            } else {
                startingLocation = datumDownwindPositions[i - 1];
            }

            var leewayDivergence = searchObject.divergence;

            var leewaySpeed = searchObject.leewaySpeed(this.input.surfaceDriftPoints[i].leewaySpeed);
            var leewayDriftDistance = leewaySpeed * validFor;

            var twcDirectionInDegrees = directionDegrees(this.input.surfaceDriftPoints[i].twcDirection);
            var currentPos = startingLocation.transformPosition(twcDirectionInDegrees, currentTWC);
            currentPositions.push(currentPos)

            // TODO move somewhere else
            var downWind = this.input.surfaceDriftPoints[i].downWind;
            if (!downWind) {
                downWind = directionDegrees(this.input.surfaceDriftPoints[i].leewayDirection) - 180;
            }

            // Are these calculations correct ?
            // why are previous datumDownwindPosition/datumMinPosition, datumMaxPosition never used.
            datumDownwindPositions.push(currentPos.transformPosition(downWind, leewayDriftDistance));
            datumMinPositions.push(currentPos.transformPosition(downWind - leewayDivergence, leewayDriftDistance));
            datumMaxPositions.push(currentPos.transformPosition(downWind + leewayDivergence, leewayDriftDistance));
        }

        function circleObjectValues(input, timeElapsed, positions) {
            var datum = positions[positions.length - 1];
            var rdv = calculateRdv(lastKnownPosition, datum, timeElapsed);
            var radius = calculateRadius(input.xError, input.yError, rdv.distance, input.safetyFactor);

            return {
                datum: datum,
                rdv: rdv,
                radius: radius,
                datumPositions: positions
            };
        }

        this.output.currentPositions = currentPositions
        this.output.downWind = circleObjectValues(this.input, this.output.timeElapsed, datumDownwindPositions);
        this.output.min = circleObjectValues(this.input, this.output.timeElapsed, datumMinPositions);
        this.output.max = circleObjectValues(this.input, this.output.timeElapsed, datumMaxPositions);

        this.calculateSearchArea(this.output.min, this.output.max, this.output.downWind);
        return this.output;
    }

    DatumPointCalculator.prototype.convertPositionsToStrings = function (output){
        var result = clone(output);
        result.downWind.datum = this.PositionService.degreesToStrings(result.downWind.datum);
        result.min.datum = this.PositionService.degreesToStrings(result.min.datum);
        result.max.datum = this.PositionService.degreesToStrings(result.max.datum);
        result.searchArea = this.convertSearchAreaPositions(this.PositionService.degreesToStrings, result.searchArea);
        return result;
    }

    function calculateSearchAreaPointsForMinAndMax(tangent, bigCircle, smallCircle, direction) {
        var bearing = tangent.point2.rhumbLineBearingTo(tangent.point1);
        var A = smallCircle.center.transformPosition(bearing, smallCircle.radius).transformPosition(bearing - direction * 90, smallCircle.radius);
        var D = bigCircle.center.transformPosition(bearing + direction * 180, bigCircle.radius).transformPosition(bearing - direction * 90, bigCircle.radius)
        var B = A.transformPosition(bearing + direction * 90, bigCircle.radius * 2);
        var C = D.transformPosition(bearing + direction * 90, bigCircle.radius * 2);
        return {
            A: A,
            B: B,
            C: C,
            D: D
        }
    }

    function extendSearchAreaToIncludeDownWindCircle(tangent, area, downWind, direction) {
        var bearing = tangent.point2.rhumbLineBearingTo(tangent.point1);
        var result = {
            A: area.A,
            B: area.B,
            C: area.C,
            D: area.D
        }

        var dwD = downWind.datum.rhumbLineDistanceTo(area.D);
        var dwA = downWind.datum.rhumbLineDistanceTo(area.A);
        var DA = area.D.rhumbLineDistanceTo(area.A);

        var d = (Math.pow(dwD, 2) - Math.pow(dwA, 2) + Math.pow(DA, 2)) / (2 * DA);
        var h = Math.sqrt(Math.pow(dwD, 2) - Math.pow(d, 2));

        if (h < downWind.radius) {
            result.D = result.D.transformPosition(bearing - direction * 90, downWind.radius - h);
            result.A = result.A.transformPosition(bearing - direction * 90, downWind.radius - h);
        } else {
            result.B = result.B.transformPosition(bearing + direction * 90, h - downWind.radius);
            result.C = result.C.transformPosition(bearing + direction * 90, h - downWind.radius);
        }
        var AB = result.A.rhumbLineDistanceTo(result.B);
        result.size = DA * AB;
        return result;
    }

    function calculateSearchAreaFromTangent(tangent, bigCircle, smallCircle, downWind, direction) {
        var area = calculateSearchAreaPointsForMinAndMax(tangent, bigCircle, smallCircle, direction);
        return extendSearchAreaToIncludeDownWindCircle(tangent, area, downWind, direction);
    }

    DatumPointCalculator.prototype.calculateSearchArea = function (min, max, downWind) {
        var startPos, endPos, startRadius, endRadius;
        if (min.radius > max.radius) {
            startPos = min.datum
            startRadius = min.radius;
            endPos = max.datum;
            endRadius = max.radius;
        } else {
            startPos = max.datum;
            startRadius = max.radius;
            endPos = min.datum;
            endRadius = min.radius;
        }

        var bigCircle = new embryo.geo.Circle(startPos, startRadius);
        var smallCircle = new embryo.geo.Circle(endPos, endRadius)

        var tangents = bigCircle.calculateExternalTangents(smallCircle);

        var area0 = calculateSearchAreaFromTangent(tangents[0], bigCircle, smallCircle, downWind, 1);
        var area1 = calculateSearchAreaFromTangent(tangents[1], bigCircle, smallCircle, downWind, -1);

        this.output.searchArea = area0.size < area1.size ? area0 : area1;
    }


    function DatumLineCalculator() {
    }

    DatumLineCalculator.prototype = new SarOperationCalculator();
    function BackTrackCalculator() {
    }

    BackTrackCalculator.prototype = new SarOperationCalculator();

    function EffortAllocationCalculator() {
    }

    EffortAllocationCalculator.prototype.lookupUncorrectedSweepWidth = function (sruType, targetType, visibility) {
        if (sruType === embryo.sar.effort.SruTypes.MerchantVessel) {
            return embryo.sar.effort.createIamsarMerchantSweepWidths()[targetType][Math.floor(visibility / 5)];
        }

        if (sruType === embryo.sar.effort.SruTypes.SmallerVessel || sruType === embryo.sar.effort.SruTypes.Ship) {
            return embryo.sar.effort.createSweepWidths()[sruType][targetType][visibility];
        }
        return 0.0
    }
    EffortAllocationCalculator.prototype.lookupVelocityCorrection = function (sruType) {
        // Velocity correction is only necessary for air born SRUs. Should it be used here?
        return 1;
    }
    EffortAllocationCalculator.prototype.lookupWeatherCorrectionFactor = function (wind, sea, targetType) {
        // TODO check i EPD om denne tolkning er korrekt
        function otherVessel(targetType) {
            return !(targetType === embryo.sar.effort.TargetTypes.PersonInWater
            || targetType === embryo.sar.effort.TargetTypes.Sailboat15
            || targetType === embryo.sar.effort.TargetTypes.Sailboat20
            || targetType === embryo.sar.effort.TargetTypes.Sailboat25);
        }

        if (wind < 0 || sea < 0)
            throw "Illegal value";

        if (wind > 25 || sea > 5) {
            return otherVessel(targetType) ? 0.9 : 0.25;
        }
        if ((15 < wind && wind <= 25) || (3 < sea && sea <= 5)) {
            return otherVessel(targetType) ? 0.9 : 0.5;
        }

        return 1;
    };
    EffortAllocationCalculator.prototype.calculateCorrectedSweepWidth = function (wu, fw, fv, ff) {
        return wu * fw * fv * ff;
    };
    EffortAllocationCalculator.prototype.calculateCoverageFactor = function (POD) {
        // FIXME
        // This is apparently implemented using the mathematical formular for graph in figure 4.3 Probability of Detection in the
        // SAR Danmark manual.
        // The IAMSAR manual however prescribes a different approach choosen between the ideal and normal search conditions
        // and as a consequence a choice between two graphs (or formulars)
        // S = W*(-5/8*ln(1-x))^(-5/7)
        var val1 = (-5.0 / 8.0) * Math.log(1 - POD / 100);
        return Math.pow(val1, -5.0 / 7.0);
    }
    EffortAllocationCalculator.prototype.calculateTrackSpacing = function (wc, C) {
        return wc * C;
    }
    EffortAllocationCalculator.prototype.calculateSearchEndurance = function (onSceneTime) {
        return onSceneTime * 0.85;
    };
    EffortAllocationCalculator.prototype.calculateZoneAreaSize = function (V, S, T) {
        return V * S * T;
    };
    EffortAllocationCalculator.prototype.getDatum = function (sar) {
        if (sar.input.type == embryo.sar.Operation.RapidResponse) {
            return sar.output.datum;
        } else if (sar.input.type == embryo.sar.Operation.DatumPoint) {
            return sar.output.downWind.datum;
        }
        return sar.output.datum;
    };
    EffortAllocationCalculator.prototype.calculateSearchArea = function (areaSize, datum, sarArea) {
        //In NM?
        var quadrantLength = Math.sqrt(areaSize);

        var sarA = new embryo.geo.Position(sarArea.A.lon, sarArea.A.lat);
        var sarB = new embryo.geo.Position(sarArea.B.lon, sarArea.B.lat);
        var sarD = new embryo.geo.Position(sarArea.D.lon, sarArea.D.lat);
        var center = new embryo.geo.Position(datum.lon, datum.lat);

        var bearingAB = sarA.rhumbLineBearingTo(sarB);
        var bearingDA = sarD.rhumbLineBearingTo(sarA);
        var zonePosBetweenAandB = center.transformPosition(bearingAB, quadrantLength / 2);

        var zoneArea = {};
        zoneArea.B = zonePosBetweenAandB.transformPosition(bearingDA, quadrantLength / 2);
        zoneArea.A = zoneArea.B.transformPosition(embryo.geo.reverseDirection(bearingAB), quadrantLength);
        zoneArea.C = zoneArea.B.transformPosition(embryo.geo.reverseDirection(bearingDA), quadrantLength);
        zoneArea.D = zoneArea.A.transformPosition(embryo.geo.reverseDirection(bearingDA), quadrantLength);
        zoneArea.size = areaSize;

        return zoneArea;
    };

    EffortAllocationCalculator.prototype.calculate = function (input, sar) {
        var wu = this.lookupUncorrectedSweepWidth(input.type, input.target, input.visibility);
        var fw = this.lookupWeatherCorrectionFactor();
        var fv = this.lookupVelocityCorrection(input.type);
        var wc = this.calculateCorrectedSweepWidth(wu, fw, fv, input.fatigue);
        var C = this.calculateCoverageFactor(input.pod)
        var S = this.calculateTrackSpacing(wc, C);
        var T = this.calculateSearchEndurance(input.time);
        var zoneAreaSize = this.calculateZoneAreaSize(input.speed, S, T);
        var datum = this.getDatum(sar);
        var area = this.calculateSearchArea(zoneAreaSize, datum, sar.output.searchArea);

        var allocation = clone(input);
        allocation.S = S;
        allocation.area = area;
        allocation.status = embryo.sar.effort.Status.DraftZone;
        // FIXME can not rely on local computer time
        allocation.modified = Date.now();
        return allocation;
    }

    function SearchPatternCalculator() {
    }

    SearchPatternCalculator.prototype.searchPatternCspLabels = function (effort) {
        function toTheNorth(corner1, corner2) {
            return corner2.pos.lat - corner1.pos.lat;
        }

        var corners = [];
        for (var key in effort.area) {
            if (key === "A" || key === "B" || key === "C" || key === "D") {
                corners.push({
                    key: key,
                    pos: clone(effort.area[key])
                });
            }
        }

        corners.sort(toTheNorth);

        function label(key, label) {
            return {
                key: key,
                label: label + " (" + key + ")"
            };
        }

        var result = [];
        result.push(label(corners[corners[0].pos.lon < corners[1].pos.lon ? 0 : 1].key, "Top left"));
        result.push(label(corners[corners[0].pos.lon < corners[1].pos.lon ? 1 : 0].key, "Top right"));
        result.push(label(corners[corners[2].pos.lon < corners[3].pos.lon ? 2 : 3].key, "Bottom left"));
        result.push(label(corners[corners[2].pos.lon < corners[3].pos.lon ? 3 : 2].key, "Bottom right"));
        return result;
    }

    SearchPatternCalculator.prototype.wpName = function (index) {
        var count;
        if (index < 10) {
            count = 3;
        } else if (index < 100) {
            count = 2;
        } else if (index < 1000) {
            count = 1;
        } else {
            count = 0;
        }
        var name = "WP-";
        for (var i = 0; i <= count; i++) {
            name += i;
        }
        name += index;
        return name;
    }

    SearchPatternCalculator.prototype.createWaypoint = function (i, position, speed, heading, xtd) {
        // FIXME replace with waypoint constructor
        return {
            name: this.wpName(i),
            latitude: position.lat,
            longitude: position.lon,
            speed: speed,
            heading: heading,
            xtdPort: xtd,
            xtdStarBoard: xtd
        };
    }


    SearchPatternCalculator.prototype.cornerKeyBefore = function (cornerKey) {
        // moving clock wise round the rectangle
        var ascii = cornerKey.charCodeAt(0);
        return String.fromCharCode(ascii === 65 ? 68 : ascii - 1);
    }

    SearchPatternCalculator.prototype.cornerKeyAfter = function (cornerKey) {
        // moving clock wise round the rectangle
        var ascii = cornerKey.charCodeAt(0);
        return String.fromCharCode(ascii === 68 ? 65 : ascii + 1);
    }

    SearchPatternCalculator.prototype.cornerPosition = function (zone, cornerKey) {
        return new embryo.geo.Position(zone.area[cornerKey].lon, zone.area[cornerKey].lat);
    }

    SearchPatternCalculator.prototype.calculateCSP = function (zone, cornerKey) {
        var before = this.cornerPosition(zone, this.cornerKeyBefore(cornerKey));
        var corner = this.cornerPosition(zone, cornerKey);
        var after = this.cornerPosition(zone, this.cornerKeyAfter(cornerKey));

        var dist = zone.S / 2;
        var tmp = corner.transformPosition(embryo.geo.reverseDirection(before.rhumbLineBearingTo(corner)), dist);
        var CSP = tmp.transformPosition(corner.rhumbLineBearingTo(after), dist);
        return CSP;
    }

    SearchPatternCalculator.prototype.onSceneDistance = function (zone) {
        return zone.time * zone.speed;
    }

    SearchPatternCalculator.getCalculator = function (type) {
        switch (type) {
            case (embryo.sar.effort.SearchPattern.ParallelSweep) :
                return new ParallelSweepSearchCalculator();
            case (embryo.sar.effort.SearchPattern.CreepingLine) :
                return new CreepingLineCalculator();
            case (embryo.sar.effort.SearchPattern.ExpandingSquare) :
                return new ExpandingSquareCalculator();
            /*  case (embryo.sar.effort.SearchPattern.SectorPattern) :
             return new BackTrackCalculator();
             case (embryo.sar.effort.SearchPattern.TrackLine) :
             return new RapidResponseCalculator();
             case (embryo.sar.effort.SearchPattern.TrackLineReturn) :
             return new DatumPointCalculator();
             */
            default :
                throw new Error("Unknown sar type " + type);
        }
    }


    function ParallelSweepSearchCalculator() {
    }

    ParallelSweepSearchCalculator.prototype = new SearchPatternCalculator();

    ParallelSweepSearchCalculator.prototype.createWaypoints = function (zone, CSP, searchLegDistance, initialSearchLegBearing, crossLegBearing) {
        var totalDistance = 0;
        var index = 0;

        var wayPoints = [this.createWaypoint(index++, CSP, zone.speed, embryo.geo.Heading.RL, zone.S / 2)];

        var onSceneDistance = this.onSceneDistance(zone);
        var lastSearchLegBearing = initialSearchLegBearing;

        var lastPosition = CSP;
        var nextIsSearchLeg = true;
        while (totalDistance < onSceneDistance) {
            var bearing = nextIsSearchLeg ? embryo.geo.reverseDirection(lastSearchLegBearing) : crossLegBearing;
            var distance = nextIsSearchLeg ? searchLegDistance : zone.S;

            if (totalDistance + distance > onSceneDistance) {
                distance = onSceneDistance - totalDistance;
            }
            var lastPosition = lastPosition.transformPosition(bearing, distance);
            wayPoints.push(this.createWaypoint(index++, lastPosition, zone.speed, embryo.geo.Heading.RL, zone.S / 2));

            if (nextIsSearchLeg) {
                lastSearchLegBearing = bearing;
            }
            totalDistance += distance;
            nextIsSearchLeg = !nextIsSearchLeg;
        }
        return wayPoints;
    }


    ParallelSweepSearchCalculator.prototype.calculate = function (zone, sp) {
        var before = this.cornerPosition(zone, this.cornerKeyBefore(sp.cornerKey));
        var corner = this.cornerPosition(zone, sp.cornerKey);
        var after = this.cornerPosition(zone, this.cornerKeyAfter(sp.cornerKey));

        var distB2C = before.rhumbLineDistanceTo(corner);
        var distC2A = corner.rhumbLineDistanceTo(after);

        var lastSearchLegBearing;
        var crossLegBearing;
        var searchLegDistance;

        if (distB2C <= distC2A) {
            lastSearchLegBearing = after.rhumbLineBearingTo(corner);
            crossLegBearing = corner.rhumbLineBearingTo(before);
            searchLegDistance = distC2A - zone.S;
        } else {
            lastSearchLegBearing = before.rhumbLineBearingTo(corner);
            crossLegBearing = corner.rhumbLineBearingTo(after);
            searchLegDistance = distB2C - zone.S;
        }

        var wayPoints = this.createWaypoints(zone, sp.csp, searchLegDistance, lastSearchLegBearing, crossLegBearing);

        var searchPattern = {
            _id: "sarSp-" + Date.now(),
            sarId: zone.sarId,
            effId: zone._id,
            type: embryo.sar.effort.SearchPattern.ParallelSweep,
            name: zone.name,
            wps: wayPoints
        }
        searchPattern['@type'] = embryo.sar.Type.SearchPattern;

        return searchPattern;
    }

    function CreepingLineCalculator() {
    }

    CreepingLineCalculator.prototype = new ParallelSweepSearchCalculator();

    CreepingLineCalculator.prototype.calculate = function (zone, sp) {
        var before = this.cornerPosition(zone, this.cornerKeyBefore(sp.cornerKey));
        var corner = this.cornerPosition(zone, sp.cornerKey);
        var after = this.cornerPosition(zone, this.cornerKeyAfter(sp.cornerKey));

        var distB2C = before.rhumbLineDistanceTo(corner);
        var distC2A = corner.rhumbLineDistanceTo(after);

        var lastSearchLegBearing;
        var crossLegBearing;
        var searchLegDistance;

        if (distC2A <= distB2C) {
            lastSearchLegBearing = after.rhumbLineBearingTo(corner);
            crossLegBearing = corner.rhumbLineBearingTo(before);
            searchLegDistance = distC2A - zone.S;
        } else {
            lastSearchLegBearing = before.rhumbLineBearingTo(corner);
            crossLegBearing = corner.rhumbLineBearingTo(after);
            searchLegDistance = distB2C - zone.S;
        }

        var wayPoints = this.createWaypoints(zone, sp.csp, searchLegDistance, lastSearchLegBearing, crossLegBearing);

        var searchPattern = {
            _id: "sarSp-" + Date.now(),
            sarId: zone.sarId,
            effId: zone._id,
            type: embryo.sar.effort.SearchPattern.CreepingLine,
            name: zone.name,
            wps: wayPoints
        }
        searchPattern["@type"] = embryo.sar.Type.SearchPattern;

        return searchPattern;
    }

    function ExpandingSquareCalculator() {
    }

    ExpandingSquareCalculator.prototype = new ParallelSweepSearchCalculator();

    ExpandingSquareCalculator.prototype.createWaypoints = function (zone, datum, initialBearing) {
        var index = 0;
        var totalDistance = 0;
        var onSceneDistance = this.onSceneDistance(zone);

        var wayPoints = [this.createWaypoint(index++, datum, zone.speed, embryo.geo.Heading.RL, zone.S / 2)];

        var bearing = (initialBearing - 90 + 360) % 360;

        var lastPosition = datum;
        while (totalDistance < onSceneDistance) {
            var distance = Math.ceil(index / 2) * zone.S;
            var bearing = (bearing + 90 + 360) % 360;

            if (totalDistance + distance > onSceneDistance) {
                distance = onSceneDistance - totalDistance;
            }
            var lastPosition = lastPosition.transformPosition(bearing, distance);
            wayPoints.push(this.createWaypoint(index++, lastPosition, zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            totalDistance += distance;
        }
        return wayPoints;
    }


    ExpandingSquareCalculator.prototype.calculate = function (zone, sp) {
        var posA = this.cornerPosition(zone, "A");
        var posB = this.cornerPosition(zone, "B");

        var datum = sp.sar.output.datum ? sp.sar.output.datum : sp.sar.output.downWind.datum;
        var initialBearing = posA.rhumbLineBearingTo(posB);

        var wayPoints = this.createWaypoints(zone, new embryo.geo.Position(datum.lon, datum.lat), initialBearing);

        var searchPattern = {
            _id: "sarSp-" + Date.now(),
            sarId: zone.sarId,
            effId: zone._id,
            type: embryo.sar.effort.SearchPattern.ExpandingSquare,
            name: zone.name,
            wps: wayPoints
        }
        searchPattern['@type'] = embryo.sar.Type.SearchPattern;

        return searchPattern;
    }


    function getCalculator(sarType, PositionService) {
        switch (sarType) {
            case (embryo.sar.Operation.RapidResponse) :
                return new RapidResponseCalculator(PositionService);
            case (embryo.sar.Operation.DatumPoint) :
                return new DatumPointCalculator(PositionService);
            case (embryo.sar.Operation.DatumLine) :
                return new DatumLineCalculator(PositionService);
            case (embryo.sar.Operation.BackTrack) :
                return new BackTrackCalculator(PositionService);
            default :
                throw new Error("Unknown sar type " + input.type);
        }
    }

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    // USED IN sar-edit.js and sar-controller.js
    module.service('SarService', ['$log', '$timeout', 'Subject', 'PositionService',
        function ($log, $timeout, Subject, PositionService) {

        var selectedSarById;
        var listeners = {};

        function notifyListeners() {
            for (var key in listeners) {
                listeners[key](selectedSarById);
            }
        }

        var service = {
            createSarId: function () {
                var now = new Date();
                return "AW-" + now.getUTCFullYear() + now.getUTCMonth() + now.getUTCDay() + now.getUTCHours() + now.getUTCMinutes() + now.getUTCSeconds() + now.getUTCMilliseconds();
            },
            sarTypes: function () {
                return embryo.sar.Operation;
            },
            directions: function () {
                return directions;
            },
            queryDirections: function (query) {
                var upperCased = query.toUpperCase();
                var result = []
                for (var index in embryo.sar.directions) {
                    if (embryo.sar.directions[index].name.indexOf(upperCased) >= 0) {
                        result.push(embryo.sar.directions[index]);
                    }
                }
                return result;
            },
            searchObjectTypes: function () {
                return embryo.sar.searchObjectTypes;
            },
            findSearchObjectType: findSearchObjectType,
            selectSar: function (sarId) {
                selectedSarById = sarId;
                notifyListeners();
            },

            sarSelected: function (name, fn) {
                listeners[name] = fn;
                if (selectedSarById) {
                    fn(selectedSarById);
                }
            },
            findLatestModified: function (dataArray, predicate) {
                // Method ssed for both effort allocation zones and search patterns
                var latest = null;

                function updateLatestIfNewer(data) {
                    if (!latest || latest.modified < data.modified) {
                        latest = data;
                    }
                }

                for (var i in dataArray) {
                    if (!predicate) {
                        updateLatestIfNewer(dataArray[i]);
                    } else if (predicate(dataArray[i])) {
                        updateLatestIfNewer(dataArray[i]);
                    }
                }
                return latest;
            },
            latestEffortAllocationZone: function (zones, predicate) {
                function isZone(zone) {
                    return (!predicate || predicate(zone)) && zone.status !== embryo.sar.effort.Status.DraftSRU
                }

                return this.findLatestModified(zones, isZone);
            },
            validateSarInput: function (input) {
                // this was written to prevent Chrome browser running in indefinite loops
                getCalculator(input.type, PositionService).validate(input);
            },
            createSarOperation: function (sarInput) {
                var calculator = getCalculator(sarInput.type, PositionService);
                calculator.validate(sarInput)
                var clonedInput = clone(sarInput);
                var correctedInput = clone(sarInput);
                correctedInput.lastKnownPosition.lat = PositionService.parseLatitude(sarInput.lastKnownPosition.lat);
                correctedInput.lastKnownPosition.lon = PositionService.parseLongitude(sarInput.lastKnownPosition.lon);
                var output = calculator.calculate(correctedInput);
                var result = {
                    input: clonedInput,
                    output: calculator.convertPositionsToStrings(output)
                }

                result['@type'] = embryo.sar.Type.SearchArea;
                return result;
            },
            calculateEffortAllocations: function (allocationInputs, sar) {
                var s = clone(sar);
                s.input.lastKnownPosition = PositionService.stringsToDegrees(s.input.lastKnownPosition);
                s.output = getCalculator(s.input.type, PositionService).convertPositionsToDegrees(s.output)
                var result = new EffortAllocationCalculator().calculate(allocationInputs, s);
                var area = clone(result.area);
                area.A = PositionService.degreesToStrings(area.A);
                area.B = PositionService.degreesToStrings(area.B);
                area.C = PositionService.degreesToStrings(area.C);
                area.D = PositionService.degreesToStrings(area.D);
                result.area = area;
                return result;
            },
            findSarIndex: function (sars, id) {
                for (var index in sars) {
                    if (sars[index]._id == id) {
                        return index;
                    }
                }
                return null;
            },
            toSmallSarObject: function (sarDoc) {
                return {
                    id: sarDoc._id,
                    name: sarDoc.input.no,
                    status: sarDoc.status
                }
            },
            searchPatternCspLabels: function (z) {
                var zone = clone(z);
                zone.area = service.toGeoPositions(zone.area);
                return new SearchPatternCalculator().searchPatternCspLabels(zone);
            },
            calculateCSP: function (z, cornerKey) {
                var zone = clone(z);
                zone.area = service.toGeoPositions(zone.area);
                return new SearchPatternCalculator().calculateCSP(zone, cornerKey);
            },
            toGeoPositions : function(area){
                return {
                    A : PositionService.stringsToPositions(area.A),
                    B : PositionService.stringsToPositions(area.B),
                    C : PositionService.stringsToPositions(area.C),
                    D : PositionService.stringsToPositions(area.D)
                }
            },
            generateSearchPattern: function (z, sp) {
                var zone = clone(z);
                zone.area = service.toGeoPositions(zone.area);
                if(sp.sar && sp.sar.output){
                    sp.sar = clone(sp.sar);
                    sp.sar.output.datum = PositionService.stringsToDegrees(sp.sar.output.datum);
                }
                var calculator = SearchPatternCalculator.getCalculator(sp.type);
                return calculator.calculate(zone, sp);
            },
            extractDbDocs: function (pouchDbResult) {
                //TODO make reusable in whole code base
                var result = []
                for (var index in pouchDbResult.rows) {
                    result.push(pouchDbResult.rows[index].doc);
                }
                return result;
            },
            mergeQueries: function (pouchDbResult, vessels) {
                var users = []
                var mmsis = []
                for (var index in pouchDbResult.rows) {
                    users.push(pouchDbResult.rows[index].doc);
                    if (pouchDbResult.rows[index].doc.mmsi) {
                        mmsis.push(pouchDbResult.rows[index].doc.mmsi)
                    }
                }

                for (var index in vessels) {
                    if (mmsis.indexOf(""+ vessels[index].mmsi) < 0) {
                        users.push({
                            name: vessels[index].name,
                            mmsi: vessels[index].mmsi
                        })
                    }
                }
                return users;
            },
            setUserAsCoordinator: function (sar, user){
                var sarOperation = clone(sar);
                var coordinator = clone(user);
                delete coordinator._rev
                delete coordinator['@class']
                delete coordinator['@type']
                sarOperation.coordinator = coordinator;
                return sarOperation;
            },
            findAndPrepareCurrentUserAsCoordinator: function (users){
                function findUser(){
                    var userName = Subject.getDetails().userName
                    var mmsi = Subject.getDetails().shipMmsi;

                    for(var index in users) {
                        if (mmsi && users[index].mmsi === mmsi) {
                            return users[index];
                        } else if (users[index].name === userName) {
                            return users[index];
                        }
                    }
                    return null;
                }
                var user = findUser();
                if(!user){
                    throw new Error("Current user not found among existing users");
                }
                var result = service.setUserAsCoordinator({}, user);
                return result.coordinator;
            },
            prepareSearchAreaForDisplayal: function(sa){
                if (sa['@type'] != embryo.sar.Type.SearchArea){
                    return sa;
                }

                var result = clone(sa);

                var details = Subject.getDetails();
                if(details.userName === sa.coordinator.name || (details.shipMmsi && details.shipMmsi == sa.coordinator.mmsi)){
                    return sa;
                }
                var searchArea = clone(sa);
                if(searchArea.output.datum){
                    delete searchArea.output.datum;
                    delete searchArea.output.rdv;
                    delete searchArea.output.radius;
                } else if (searchArea.output.downWind){
                    delete searchArea.output.downWind;
                    delete searchArea.output.min;
                    delete searchArea.output.max;
                }
                return searchArea;
            }
        };

        return service;
    }]);

    module.factory('LivePouch', ['pouchDB', 'CouchUrlResolver', function (pouchDB, CouchUrlResolver) {
        var dbName = 'embryo-live';
        var couchUrl = CouchUrlResolver.resolveCouchUrl(dbName);

        var liveDb = pouchDB(dbName);
        var sync = liveDb.sync(couchUrl, {
            live: true,
            retry: true
        })

        return liveDb;
    }]);

    module.factory('UserPouch', ['pouchDB', 'CouchUrlResolver', function (pouchDB, CouchUrlResolver) {
        // make sure this works in development environment as well as other environments
        var dbName = 'embryo-user';
        var couchUrl = CouchUrlResolver.resolveCouchUrl(dbName);

        var userDB = new PouchDB(dbName);

        var handler = userDB.replicate.from(couchUrl, {
            retry: true
        })

        // TODO setup scheduled replication
        handler.on("complete", function (){
            console.log("Done replicating users");
        })
        handler.on("error", function (error){
            console.log(error);
        })

        return userDB;
    }]);

})();
