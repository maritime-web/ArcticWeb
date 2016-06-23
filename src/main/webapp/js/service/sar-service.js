(function () {
    "use strict";

    var module = angular.module('embryo.sar.service', ['embryo.storageServices', 'embryo.authentication.service', 'embryo.position', 'embryo.geo.services', 'embryo.pouchdb.services']);

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

    module.factory('TimeElapsed', function () {
        function TimeElapsed(data) {
            angular.extend(this, data);
        }
        TimeElapsed.validate = function (startPosition, commenceSearchStart) {
            assertValue(startPosition, "startPosition");
            assertObjectFieldValue(startPosition, "ts");
            assertValue(commenceSearchStart, "commenceSearchStart");
        }
        TimeElapsed.build = function(startPosition, commenceSearchStart){
            TimeElapsed.validate(startPosition, commenceSearchStart);
            var difference = (commenceSearchStart - startPosition.ts) / 60 / 60 / 1000;
            var data = {};
            data.timeElapsed = difference;
            data.hoursElapsed = Math.floor(difference);
            data.minutesElapsed = Math.round((difference - data.hoursElapsed) * 60);
            return new TimeElapsed(data);
        }
        return TimeElapsed;
    });

    module.factory('SurfaceDrift', ["Position", function (Position) {
        function SurfaceDrift(data) {
            angular.extend(this, data);
        }

        SurfaceDrift.prototype.positionsAsDegreesAndDecimalMinutes = function(){
            var result = {
                currentPositions: Position.toDegreesAndDecimalMinutes(this.currentPositions),
                datumDownwindPositions: Position.toDegreesAndDecimalMinutes(this.datumDownwindPositions),
                datumMinPositions: Position.toDegreesAndDecimalMinutes(this.datumMinPositions),
                datumMaxPositions: Position.toDegreesAndDecimalMinutes(this.datumMaxPositions)
            }
            result.datumDownwind = result.datumDownwindPositions[result.datumDownwindPositions.length - 1];
            result.datumMax = result.datumMaxPositions[result.datumMaxPositions.length - 1];
            result.datumMin = result.datumMinPositions[result.datumMinPositions.length - 1]
            return new SurfaceDrift(result);
        }
        SurfaceDrift.validate = function (startPosition, commenceSearchStart, surfaceDrifts, searchObject) {
            assertValue(startPosition, "startPosition");
            assertValue(commenceSearchStart, "commenceSearchStart");
            assertValue(surfaceDrifts, "surfaceDrifts");
            assertValue(searchObject, "searchObject");
            for (var i = 0; i < surfaceDrifts.length; i++) {
                assertObjectFieldValue(surfaceDrifts[i], "ts");
                assertObjectFieldValue(surfaceDrifts[i], "twcSpeed");
                assertObjectFieldValue(surfaceDrifts[i], "twcDirection");
                assertObjectFieldValue(surfaceDrifts[i], "leewaySpeed");
                assertObjectFieldValue(surfaceDrifts[i], "leewayDirection");
            }
        }

        SurfaceDrift.calculate2 = function (startPosition, untilTs, surfaceDrifts, searchObject) {
            var datumDownwindPositions = [];
            var datumMinPositions = [];
            var datumMaxPositions = [];
            var currentPositions = []

            var startTs = startPosition.ts;
            var validFor = null

            for (var i = surfaceDrifts.length - 1; i >= 0; i--) {
                // Do we have a next?
                // How long is the data point valid for?
                // Is it the last one?
                if (i == 0) {
                    // It's the last one - let it last the remainder
                    validFor = (untilTs - startTs) / 60 / 60 / 1000;
                } else {
                    var currentTs = surfaceDrifts[i].ts;
                    if (currentTs > startPosition.ts) {
                        currentTs = startPosition.ts;
                    }
                    validFor = (startTs - currentTs) / 60 / 60 / 1000;
                    startTs = surfaceDrifts[i].ts;
                }

                var currentTWC = surfaceDrifts[i].twcSpeed * validFor;

                var startingLocation = null;
                if (i == 0) {
                    startingLocation = Position.create(startPosition.lon, startPosition.lat);
                } else {
                    startingLocation = datumDownwindPositions[i - 1];
                }

                var leewayDivergence = searchObject.divergence;
                var leewaySpeed = searchObject.leewaySpeed(surfaceDrifts[i].leewaySpeed);
                var leewayDriftDistance = leewaySpeed * validFor;

                var twcDirectionInDegrees = directionDegrees(surfaceDrifts[i].twcDirection);
                var currentPos = startingLocation.transformPosition(twcDirectionInDegrees, currentTWC);
                currentPositions.push(currentPos)

                // TODO move somewhere else
                var downWind = surfaceDrifts[i].downWind;
                if (!downWind) {
                    downWind = directionDegrees(surfaceDrifts[i].leewayDirection) - 180;
                }

                // Are these calculations correct ?
                // why are previous datumDownwindPosition/datumMinPosition, datumMaxPosition never used.
                datumDownwindPositions.push(currentPos.transformPosition(downWind, leewayDriftDistance));
                datumMinPositions.push(currentPos.transformPosition(downWind - leewayDivergence, leewayDriftDistance));
                datumMaxPositions.push(currentPos.transformPosition(downWind + leewayDivergence, leewayDriftDistance));

            }
            var result = {
                lastVectorValidFor : validFor,
                currentPositions: currentPositions,
                datumDownwindPositions: datumDownwindPositions,
                datumMinPositions: datumMinPositions,
                datumMaxPositions: datumMaxPositions,
                datumDownwind : datumDownwindPositions[datumDownwindPositions.length - 1],
                datumMax : datumMaxPositions[datumMaxPositions.length - 1],
                datumMin : datumMinPositions[datumMinPositions.length - 1]
            }
            return result;
        }
        SurfaceDrift.calculate = function (startPosition, commenceSearchStart, surfaceDrifts, searchObject) {
            var datumDownwindPositions = [];
            var datumMinPositions = [];
            var datumMaxPositions = [];
            var currentPositions = []

            var startTs = startPosition.ts;
            var validFor = null

            for (var i = 0; i < surfaceDrifts.length; i++) {
                // Do we have a next?
                // How long is the data point valid for?
                // Is it the last one?
                if (i == surfaceDrifts.length - 1) {
                    // It's the last one - let it last the remainder
                    validFor = (commenceSearchStart - startTs) / 60 / 60 / 1000;
                } else {
                    var currentTs = surfaceDrifts[i].ts;
                    if (currentTs < startPosition.ts) {
                        currentTs = startPosition.ts;
                    }
                    startTs = surfaceDrifts[i + 1].ts;
                    validFor = (startTs - currentTs) / 60 / 60 / 1000;
                }

                var currentTWC = surfaceDrifts[i].twcSpeed * validFor;

                var startingLocation = null;
                if (i == 0) {
                    startingLocation = Position.create(startPosition.lon, startPosition.lat);
                } else {
                    startingLocation = datumDownwindPositions[i - 1];
                }

                var leewayDivergence = searchObject.divergence;
                var leewaySpeed = searchObject.leewaySpeed(surfaceDrifts[i].leewaySpeed);
                var leewayDriftDistance = leewaySpeed * validFor;

                var twcDirectionInDegrees = directionDegrees(surfaceDrifts[i].twcDirection);
                var currentPos = startingLocation.transformPosition(twcDirectionInDegrees, currentTWC);
                currentPositions.push(currentPos)

                // TODO move somewhere else
                var downWind = surfaceDrifts[i].downWind;
                if (!downWind) {
                    downWind = directionDegrees(surfaceDrifts[i].leewayDirection) - 180;
                }

                // Are these calculations correct ?
                // why are previous datumDownwindPosition/datumMinPosition, datumMaxPosition never used.
                datumDownwindPositions.push(currentPos.transformPosition(downWind, leewayDriftDistance));
                datumMinPositions.push(currentPos.transformPosition(downWind - leewayDivergence, leewayDriftDistance));
                datumMaxPositions.push(currentPos.transformPosition(downWind + leewayDivergence, leewayDriftDistance));

            }
            var result = {
                lastVectorValidFor : validFor,
                currentPositions: currentPositions,
                datumDownwindPositions: datumDownwindPositions,
                datumMinPositions: datumMinPositions,
                datumMaxPositions: datumMaxPositions,
                datumDownwind : datumDownwindPositions[datumDownwindPositions.length - 1],
                datumMax : datumMaxPositions[datumMaxPositions.length - 1],
                datumMin : datumMinPositions[datumMinPositions.length - 1]
            }
            return result;
        }
        SurfaceDrift.build = function(startPosition, commenceSearchStart, surfaceDrifts, searchObject){
            SurfaceDrift.validate(startPosition, commenceSearchStart, surfaceDrifts, searchObject);
            var result = SurfaceDrift.calculate(startPosition, commenceSearchStart, surfaceDrifts, searchObject);
            return new SurfaceDrift(result);
        }
        return SurfaceDrift;
    }]);

    module.factory('RDV', function () {
        function RDV(data) {
            angular.extend(this, data);
        }

        RDV.validate = function(lkp, positions, lastVectorValidFor){
            assertValue(lkp, "lkp");
            assertValue(positions, "positions");
            assertValue(lastVectorValidFor, "lastVectorValidFor");
        }

        RDV.build = function (lkp, positions, lastVectorValidFor) {
            RDV.validate(lkp, positions, lastVectorValidFor);

            var fromPos = positions.length > 1 ? positions[positions.length - 2] : lkp;
            var toPos = positions[positions.length - 1];

            var rdv = {}
            rdv.direction = fromPos.bearingTo(toPos, embryo.geo.Heading.RL);
            rdv.distance = fromPos.distanceTo(toPos, embryo.geo.Heading.RL);
            rdv.speed = rdv.distance / lastVectorValidFor;
            return new RDV(rdv);
        }

        return RDV;
    });

    module.factory('SearchCircle', ["Position", "Circle", function (Position, Circle) {
        function SearchCircle(data) {
            angular.extend(this, data);
        }

        SearchCircle.prototype.toPolygonOfPositions = function(numberOfVertices){
            return Circle.create(Position.create(this.datum), this.radius).toPolygon(numberOfVertices)
        }

        SearchCircle.prototype.toGeoCircle = function(){
            return Circle.create(Position.create(this.datum), this.radius);
        }

        SearchCircle.validate = function(xError, yError, safetyFactor, rdvDistance, datum) {
            assertValue(xError, "xError");
            assertValue(yError, "yError");
            assertValue(safetyFactor, "safetyFactor");
            assertValue(datum, "datum");
            assertValue(rdvDistance, "rdvDistance");
        }
        SearchCircle.calculateRadius = function(xError, yError, rdvDistance, safetyFactor) {
            return ((xError + yError) + 0.3 * rdvDistance) * safetyFactor;
        }
        SearchCircle.build = function(xError, yError, safetyFactor, rdvDistance, datum){
            SearchCircle.validate(xError, yError, safetyFactor, rdvDistance, datum);
            var radius = SearchCircle.calculateRadius(xError, yError, rdvDistance, safetyFactor);
            return new SearchCircle({
                radius : radius,
                datum : datum.toDegreesAndDecimalMinutes()
            });
        }
        SearchCircle.create = function(radius, datum){
            return new SearchCircle({
                radius : radius,
                datum : datum.toDegreesAndDecimalMinutes()
            });
        }

        return SearchCircle;
    }]);

    module.factory('SearchArea', [function () {
        function SearchArea(data) {
            angular.extend(this, data);
        }
        SearchArea.validate = function(area) {
            Object.keys(area).forEach(function(key){
                if("size" !== key){
                    assertObjectFieldValue(area, key);
                }
            })
            assertObjectFieldValue(area, "size");
            if(Object.keys(area).length < 5){
                throw new Error("At least 4 points and the size in square meters needed to create valid search area");
            }
        }
        SearchArea.create = function(area){
            SearchArea.validate(area);

            var converted = {
                size : area.size
            }
            Object.keys(area).forEach(function(key){
                if("size" !== key){
                    converted[key] = area[key].toDegreesAndDecimalMinutes();
                }
            })
            return new SearchArea(converted);
        }
        return SearchArea;
    }]);

    module.service('RapidResponseSearchAreaCalculator', ["Position", "Circle", "SearchArea", function (Position, Circle, SearchArea) {
        var service ={
            validate : function(datum, radius, rdvDirection){
                assertValue(datum.lat, "datum.lat")
                assertValue(datum.lon, "datum.lon")
                assertValue(radius, "radius")
                assertValue(rdvDirection, "rdvDirection")

            },
            calculate : function (datum, radius, rdvDirection) {
                service.validate(datum, radius, rdvDirection);
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

                return SearchArea.create({
                    A: a,
                    B: b,
                    C: c,
                    D: d,
                    size: radius * radius * 4
                });
            }
        }
        return service;
    }]);


    module.service('DatumPointSearchAreaCalculator', ["Position", "Circle", "SearchArea", function (Position, Circle, SearchArea) {
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

        function extendSearchAreaToIncludeDownWindCircle(tangent, area, dwDatum, dwRadius, direction) {
            var bearing = tangent.point2.rhumbLineBearingTo(tangent.point1);
            var result = {
                A: area.A,
                B: area.B,
                C: area.C,
                D: area.D
            }

            var dwD = dwDatum.rhumbLineDistanceTo(area.D);
            var dwA = dwDatum.rhumbLineDistanceTo(area.A);
            var DA = area.D.rhumbLineDistanceTo(area.A);

            var d = (Math.pow(dwD, 2) - Math.pow(dwA, 2) + Math.pow(DA, 2)) / (2 * DA);
            var h = Math.sqrt(Math.pow(dwD, 2) - Math.pow(d, 2));

            if (h < dwRadius) {
                result.D = result.D.transformPosition(bearing - direction * 90, dwRadius - h);
                result.A = result.A.transformPosition(bearing - direction * 90, dwRadius - h);
            } else {
                result.B = result.B.transformPosition(bearing + direction * 90, h - dwRadius);
                result.C = result.C.transformPosition(bearing + direction * 90, h - dwRadius);
            }
            var AB = result.A.rhumbLineDistanceTo(result.B);
            result.size = DA * AB;
            return result;
        }

        function calculateSearchAreaFromTangent(tangent, bigCircle, smallCircle, dwDatum, dwRadius, direction) {
            var area = calculateSearchAreaPointsForMinAndMax(tangent, bigCircle, smallCircle, direction);
            area = extendSearchAreaToIncludeDownWindCircle(tangent, area, dwDatum, dwRadius, direction);
            return SearchArea.create(area);
        }

        var service ={
            calculate : function (min, max, downWind) {
                var start = min.circle.radius > max.circle.radius ? min : max;
                var end = min.circle.radius > max.circle.radius ? max : min;

                var bigCircle = Circle.create(Position.create(start.circle.datum), start.circle.radius);
                var smallCircle = Circle.create(Position.create(end.circle.datum), end.circle.radius)
                var tangents = bigCircle.calculateExternalTangents(smallCircle);

                var dwDatum = Position.create(downWind.circle.datum);
                var area0 = calculateSearchAreaFromTangent(tangents[0], bigCircle, smallCircle, dwDatum, downWind.circle.radius, 1);
                var area1 = calculateSearchAreaFromTangent(tangents[1], bigCircle, smallCircle, dwDatum, downWind.circle.radius, -1);
                return area0.size < area1.size ? area0 : area1;
            }
        }
        return service;
    }]);

    module.factory('RapidResponseOutput', ["Position", "TimeElapsed", "SurfaceDrift", "RDV", "SearchCircle", "RapidResponseSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrift, RDV, SearchCircle, RapidResponseSearchAreaCalculator) {

        function RapidResponseOutput(data) {
            angular.extend(this, data);
        }

        RapidResponseOutput.calculate = function (input) {
            var result = TimeElapsed.build(input.lastKnownPosition, input.startTs);
            var lkp = Position.create(input.lastKnownPosition)
            var searchObject = findSearchObjectType(input.searchObject);
            var drift = SurfaceDrift.build(input.lastKnownPosition, input.startTs, input.surfaceDriftPoints, searchObject);
            result.currentPositions = Position.toDegreesAndDecimalMinutes(drift.currentPositions);

            // Only correct input values to RDV if only one surfaceDrift value set.
            result.rdv = RDV.build(lkp, drift.datumDownwindPositions, drift.lastVectorValidFor);
            result.circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, result.rdv.distance, drift.datumDownwind);
            result.driftPositions = Position.toDegreesAndDecimalMinutes(drift.datumDownwindPositions);
            result.searchArea = RapidResponseSearchAreaCalculator.calculate(drift.datumDownwind, result.circle.radius, result.rdv.direction);
            return new RapidResponseOutput(result);
        }
        return RapidResponseOutput;
    }]);


    module.factory('DatumPointOutput', ["Position", "TimeElapsed", "SurfaceDrift", "RDV", "SearchCircle", "DatumPointSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrift, RDV, SearchCircle, DatumPointSearchAreaCalculator) {

        function DatumPointOutput(data) {
            angular.extend(this, data);
        }

        DatumPointOutput.calculate = function (input) {
            var result = TimeElapsed.build(input.lastKnownPosition, input.startTs);
            var lkp = Position.create(input.lastKnownPosition)
            var searchObject = findSearchObjectType(input.searchObject);
            var drift = SurfaceDrift.build(input.lastKnownPosition, input.startTs, input.surfaceDriftPoints, searchObject);
            result.currentPositions = drift.currentPositions;

            var rdv = RDV.build(lkp, drift.datumDownwindPositions, drift.lastVectorValidFor);
            var circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumDownwind);
            result.downWind = {
                rdv : rdv,
                circle : circle,
                driftPositions : drift.datumDownwindPositions
            }

            rdv = RDV.build(lkp, drift.datumMaxPositions, drift.lastVectorValidFor);
            circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumMax);
            result.max = {
                rdv : rdv,
                circle : circle,
                driftPositions : drift.datumMaxPositions
            }

            rdv = RDV.build(lkp, drift.datumMinPositions, drift.lastVectorValidFor);
            circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumMin);
            result.min = {
                rdv : rdv,
                circle : circle,
                driftPositions : drift.datumMinPositions
            }

            result.searchArea = DatumPointSearchAreaCalculator.calculate(result.min, result.max, result.downWind);

            return new DatumPointOutput(result);
        }
        return DatumPointOutput;
        }
    ]);

    module.service('DatumLineSearchAreaCalculator', ["Position", "Circle", "SearchArea", "Polygon", function (Position, Circle, SearchArea, Polygon) {

        function createExternalCircleTangents (dsp1, dsp2){
            var circles = [dsp1.downWind.circle, dsp1.min.circle,dsp1.max.circle, dsp2.downWind.circle, dsp2.min.circle, dsp2.max.circle];
            for(var i in circles){
                circles[i] = circles[i].toGeoCircle();
            }
            return Circle.createAllExternalTangents(circles);
        }


        function extractPositionsFromTangents (tangents){
            var positions = [];
            for(var i in tangents){
                positions.push(tangents[i][0].point1)
                positions.push(tangents[i][0].point2)
                positions.push(tangents[i][1].point1)
                positions.push(tangents[i][1].point2)
            }
            return positions;
        }


        var service ={

            //createTangents

            calculate : function(dsps){
                var numberOfVertices = 360;

                var polygons = []

                for(var index = 0; index < dsps.length - 1; index++) {
                    var dsp1 = dsps[index];
                    var dsp2 = dsps[index + 1];
                    var tangents = createExternalCircleTangents(dsp1, dsp2)
                    var pos = extractPositionsFromTangents(tangents);
                    var tangentsHull = Polygon.convexHull(pos);

                    var positions = tangentsHull.positions;
                    positions = positions.concat(dsp1.downWind.circle.toPolygonOfPositions(numberOfVertices));
                    positions = positions.concat(dsp1.min.circle.toPolygonOfPositions(numberOfVertices));
                    positions = positions.concat(dsp1.max.circle.toPolygonOfPositions(numberOfVertices));
                    positions = positions.concat(dsp2.downWind.circle.toPolygonOfPositions(numberOfVertices));
                    positions = positions.concat(dsp2.min.circle.toPolygonOfPositions(numberOfVertices));
                    positions = positions.concat(dsp2.max.circle.toPolygonOfPositions(numberOfVertices));
                    var hull = Polygon.convexHull(positions);
                    polygons.push(hull)
                }

                var polygon = Polygon.union(polygons);

                return {
                    polygons : [polygon.positions],
                    size : polygon.size()
                }
            }
        }
        return service;
    }]);

    module.factory('DatumLineOutput', ["Position", "TimeElapsed", "SurfaceDrift", "RDV", "SearchCircle", "DatumLineSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrift, RDV, SearchCircle, DatumLineSearchAreaCalculator) {

        function DatumLineOutput(data) {
            angular.extend(this, data);
        }

        DatumLineOutput.calculate = function(input) {
            var dspResults = [];
            for (var index in input.dsps) {
                var dsp = clone(input.dsps[index]);

                var result = TimeElapsed.build(dsp, input.startTs);

                var startPoint = Position.create(dsp)
                var searchObject = findSearchObjectType(input.searchObject);

                var surfaceDrifts = dsp.reuseSurfaceDrifts ? input.dsps[0].surfaceDrifts : dsp.surfaceDrifts;
                var drift = SurfaceDrift.build(dsp, input.startTs, surfaceDrifts, searchObject);
                result.currentPositions = drift.currentPositions;

                var rdv = RDV.build(startPoint, drift.datumDownwindPositions, result.timeElapsed);
                var circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumDownwind);
                result.downWind = {
                    rdv: rdv,
                    circle: circle,
                    driftPositions: drift.datumDownwindPositions
                }

                rdv = RDV.build(startPoint, drift.datumMaxPositions, result.timeElapsed);
                circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumMax);
                result.max = {
                    rdv: rdv,
                    circle: circle,
                    driftPositions: drift.datumMaxPositions
                }

                rdv = RDV.build(startPoint, drift.datumMinPositions, result.timeElapsed);
                circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumMin);
                result.min = {
                    rdv: rdv,
                    circle: circle,
                    driftPositions: drift.datumMinPositions
                }
                dspResults.push(result);
            }

            var area = DatumLineSearchAreaCalculator.calculate(dspResults);
            // Calculate Smallest square / polygon around
            return new DatumLineOutput({
                dsps : dspResults,
                searchArea : area
            });
        }
        return DatumLineOutput;

    }]);

    module.factory('BackTrackOutput', [function () {
        function BackTrackOutput() {
            angular.extend(this, data);
        }

        BackTrackOutput.calculate = function(input){

            var result = TimeElapsed.build(input.objectPosition, input.startTs);

            var startPoint = Position.create(dsp)
            var searchObject = findSearchObjectType(input.searchObject);


            var surfaceDrifts = SurfaceDrift.revertDirections(input.surfaceDrifts);
            var drift = SurfaceDrift.build(input.objectPosition, input.startTs, surfaceDrifts, searchObject);
            result.currentPositions = drift.currentPositions;

            var rdv = RDV.build(startPoint, drift.datumDownwindPositions, result.timeElapsed);
            var circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, drift.datumDownwind);
            result.downWind = {
                rdv: rdv,
                circle: circle,
                driftPositions: drift.datumDownwindPositions
            }


            return new BackTrackOutput(result);
        }

        return BackTrackOutput;
    }]);

    // USED IN sar-edit.js and sar-controller.js
    module.factory('SarOperationFactory', ['RapidResponseOutput', "DatumPointOutput", "DatumLineOutput", "BackTrackOutput",
        function (RapidResponseOutput, DatumPointOutput, DatumLineOutput, BackTrackOutput) {

        function getOutputType(sarType) {
            switch (sarType) {
                case (embryo.sar.Operation.RapidResponse) :
                    return RapidResponseOutput;
                case (embryo.sar.Operation.DatumPoint) :
                    return DatumPointOutput;
                case (embryo.sar.Operation.DatumLine) :
                    return DatumLineOutput;
                case (embryo.sar.Operation.BackTrack) :
                    return BackTrackOutput;
                default :
                    throw new Error("Unknown sar type " + input.type);
            }
        }

        return {
            createSarId: function () {
                var now = new Date();
                return "AW-" + now.getUTCFullYear() + now.getUTCMonth() + now.getUTCDay() + now.getUTCHours() + now.getUTCMinutes() + now.getUTCSeconds() + now.getUTCMilliseconds();
            },
            createSarOperation: function (sarInput) {
                var outputType = getOutputType(sarInput.type);
                var clonedInput = clone(sarInput);
                var result = {
                    input: clonedInput,
                    output: outputType.calculate(clonedInput)
                }
                result['@type'] = embryo.sar.Type.SearchArea;
                return result;
            },
        };
    }]);


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
            return sar.output.circle.datum;
        } else if (sar.input.type == embryo.sar.Operation.DatumPoint) {
            return sar.output.downWind.circle.datum;
        }
        return sar.output.circle.datum;
    };
    EffortAllocationCalculator.prototype.calculateSearchArea = function (areaSize, datum, sarArea) {
        //In NM?
        var quadrantLength = Math.sqrt(areaSize);

        var sarA = embryo.geo.Position.create(sarArea.A.lon, sarArea.A.lat);
        var sarB = embryo.geo.Position.create(sarArea.B.lon, sarArea.B.lat);
        var sarD = embryo.geo.Position.create(sarArea.D.lon, sarArea.D.lat);
        var center = embryo.geo.Position.create(datum.lon, datum.lat);

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

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }



    // USED IN sar-edit.js and sar-controller.js
    module.service('SarService', ['$log', '$timeout', 'Subject', 'PositionService', 'Position',
        function ($log, $timeout, Subject, PositionService, Position) {

        var selectedSarById;
        var listeners = {};

        function notifyListeners() {
            for (var key in listeners) {
                listeners[key](selectedSarById);
            }
        }

        var service = {
            sarTypes: function () {
                return embryo.sar.Operation;
            },
            directions: function () {
                return embryo.sar.directions;
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
            calculateEffortAllocations: function (allocationInputs, sar) {
                var s = clone(sar);
                s.input.lastKnownPosition = Position.create(s.input.lastKnownPosition);
                //s.output = getCalculator(s.input.type, PositionService).convertPositionsToDegrees(s.output)
                var result = new EffortAllocationCalculator().calculate(allocationInputs, s);
                var area = clone(result.area);

                area.A = result.area.A.toDegreesAndDecimalMinutes();
                area.B = result.area.B.toDegreesAndDecimalMinutes();
                area.C = result.area.C.toDegreesAndDecimalMinutes();
                area.D = result.area.D.toDegreesAndDecimalMinutes();
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
                        // change to '===' when data are both strings / numbers
                        if (mmsi && users[index].mmsi == mmsi) {
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
                var details = Subject.getDetails();
                if(details.userName === sa.coordinator.name || (details.shipMmsi && details.shipMmsi == sa.coordinator.mmsi)){
                    return sa;
                }
                var searchArea = clone(sa);
                if(searchArea.output.driftPositions) {
                    delete searchArea.output.driftPositions;
                }if(searchArea.output.currentPositions) {
                    delete searchArea.output.currentPositions;
                }if(searchArea.output.downWind){
                    delete searchArea.output.downWind.driftPositions;
                }
                if (searchArea.output.min){
                    delete searchArea.output.min.driftPositions;
                }
                if (searchArea.output.max){
                    delete searchArea.output.max.driftPositions;
                }
                if(searchArea.output.dsps){
                    for(var index in searchArea.output.dsps){
                        var dsp =  searchArea.output.dsps[index];
                        if(dsp.downWind){
                            delete dsp.downWind.driftPositions;
                        }
                        if (dsp.min){
                            delete dsp.min.driftPositions;
                        }
                        if (dsp.max){
                            delete dsp.max.driftPositions;
                        }
                    }
                }
                return searchArea;
            }
        };

        return service;
    }]);

    module.factory('LivePouch', ['PouchDBFactory', function (PouchDBFactory) {
        var dbName = 'embryo-live';
        var liveDb = PouchDBFactory.createLocalPouch(dbName);
        var remoteDb = PouchDBFactory.createRemotePouch(dbName);

        var sync = liveDb.sync(remoteDb, {
            live: true,
            retry: true
        })

        return liveDb;
    }]);

    module.factory('UserPouch', ['PouchDBFactory','$log', function (PouchDBFactory, $log) {
        // make sure this works in development environment as well as other environments
        var dbName = 'embryo-user';
        var userDb = PouchDBFactory.createLocalPouch(dbName);
        var remoteDb = PouchDBFactory.createRemotePouch(dbName);

         var handler = userDb.replicate.from(remoteDb, {
            retry: true
         })

         // TODO setup scheduled replication
         handler.on("complete", function (){
            $log.info("Done replicating users");
         })
         handler.on("error", function (error){
            $log.info(error);
         })


        return userDb;
    }]);



})();
