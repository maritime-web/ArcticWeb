(function () {
    "use strict";

    var module = angular.module('embryo.sar.service', ['embryo.sar.model', 'embryo.storageServices', 'embryo.authentication.service', 'embryo.geo.services', 'embryo.sar.livePouch', 'embryo.route.model', 'embryo.sar.TimeElapsed', 'embryo.sar.SearchCircle']);

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

    module.factory('DriftVector', [function () {
        function DriftVector(data) {
            angular.extend(this, data);
        }
        DriftVector.prototype.add = function(vector2){
            var vector1 = this;
            var startLocation = vector1.positions[0];
            var vector1EndPos = startLocation.transformRhumbLine(vector1.direction, vector1.distance);
            var vector2EndPos = vector1EndPos.transformRhumbLine(vector2.direction, vector2.distance);

            if(vector1.validFor !== vector2.validFor){
                throw new Error("vectors must have been applied for equally long");
            }

            return DriftVector.create({
                positions : [startLocation, vector1EndPos,vector2EndPos],
                distance : startLocation.rhumbLineDistanceTo(vector2EndPos),
                direction : startLocation.rhumbLineBearingTo(vector2EndPos),
                validFor : vector1.validFor,
            })
        }
        DriftVector.prototype.reverse = function(){
            return DriftVector.create({
                positions : this.positions.reverse(),
                distance : this.distance,
                direction : this.direction,
                validFor : this.validFor,
            })
        }
        DriftVector.prototype.getLastPosition = function(){
            return this.positions[this.positions.length - 1];
        }
        DriftVector.prototype.getFirstPosition = function(){
            return this.positions[0];
        }
        DriftVector.prototype.limitPositionsTo = function(number){
            var increment = (this.positions.length - 1) / (number - 1);
            var result = []
            for(var index = 0; index < this.positions.length; index += increment){
                result.push(this.positions[index]);
            }
            return DriftVector.create({
                positions : result,
                distance : this.distance,
                direction : this.direction,
                validFor : this.validFor
            })
        }
        DriftVector.prototype.divergence = function(divergence){
            // We don't need all intermediate positions in final result as only resulting TWC and Leeway vectors are shown
            // Therefore just leave out all intermediate positions and only return start and end pos en resulting DriftVector
            var newBearing = this.direction + divergence;
            var newEndPos = this.positions[0].transformRhumbLine(newBearing, this.distance);
            return DriftVector.create({
                positions : [this.positions[0], newEndPos],
                distance : this.distance,
                direction : newBearing,
                validFor : this.validFor
            })
        }

        DriftVector.validate = function(data){
            assertObjectFieldValue(data, "positions");
            assertObjectFieldValue(data, "distance");
            assertObjectFieldValue(data, "direction");
            assertObjectFieldValue(data, "validFor");
        }

        DriftVector.create = function (data) {
            DriftVector.validate(data);

            angular.extend(data, {
                speed : data.distance / data.validFor
            })
            return new DriftVector(data)
        }
        return DriftVector;
    }]);

    module.factory('SurfaceDrifts', ['Position', 'DriftVector', function (Position, DriftVector) {
        function SurfaceDrifts(surfaceDrifts){
            this.values = surfaceDrifts
        }
        SurfaceDrifts.validate = function (surfaceDrifts) {
            for (var i = 0; i < surfaceDrifts.length; i++) {
                assertObjectFieldValue(surfaceDrifts[i], "ts");
                assertObjectFieldValue(surfaceDrifts[i], "twcSpeed");
                assertObjectFieldValue(surfaceDrifts[i], "twcDirection");
                assertObjectFieldValue(surfaceDrifts[i], "leewaySpeed");
                assertObjectFieldValue(surfaceDrifts[i], "leewayDirection");
            }
        }

        SurfaceDrifts.create = function(surfaceDrifts){
            SurfaceDrifts.validate(surfaceDrifts);
            return new SurfaceDrifts(surfaceDrifts);
        }

        SurfaceDrifts.prototype.generateValidFor = function(startPosition, commenceSearchStart){
            assertValue(startPosition, "startPosition");
            assertValue(commenceSearchStart, "commenceSearchStart");

            var surfaceDrifts = this.values;
            var validFor = [];
            var startTs = startPosition.ts;
            for (var i = 0; i < surfaceDrifts.length; i++) {
                if (i == surfaceDrifts.length - 1) {
                    // It's the last one - let it last the remainder
                    validFor.push((commenceSearchStart - startTs) / 60 / 60 / 1000);
                } else {
                    var currentTs = surfaceDrifts[i].ts;
                    if (currentTs < startPosition.ts) {
                        currentTs = startPosition.ts;
                    }
                    startTs = surfaceDrifts[i + 1].ts;
                    validFor.push((startTs - currentTs) / 60 / 60 / 1000);
                }
            }
            this.validFor = validFor;
            return this.validFor;
        };
        SurfaceDrifts.nextTWCPosition = function (fromPos, validFor, surfaceDrift){
            var currentTWC = surfaceDrift.twcSpeed * validFor;
            var twcDirectionInDegrees = directionDegrees(surfaceDrift.twcDirection);
            return fromPos.transformRhumbLine(twcDirectionInDegrees, currentTWC);
        };
        SurfaceDrifts.nextLeewayPosition = function (fromPos, validFor, surfaceDrift, searchObject){
            var speed = searchObject.leewaySpeed(surfaceDrift.leewaySpeed);
            var driftDistance = speed * validFor;
            var directionInDegrees = directionDegrees(surfaceDrift.leewayDirection) - 180;
            return fromPos.transformRhumbLine(directionInDegrees, driftDistance);
        };
        SurfaceDrifts.prototype.calculateDrift = function(fnNextPosition, startPosition, commenceSearchStart, searchObject){
            assertValue(startPosition, "startPosition");

            this.generateValidFor(startPosition, commenceSearchStart);

            var startLocation = Position.create(startPosition.lon, startPosition.lat);
            var positions = [startLocation];

            for (var i = 0; i < this.values.length; i++) {
                var fromPos = i == 0 ? startLocation : positions[i - 1];
                positions.push(fnNextPosition(fromPos, this.validFor[i], this.values[i], searchObject));
            }
            return DriftVector.create({
                positions : positions,
                distance : startLocation.rhumbLineDistanceTo(positions[positions.length - 1]),
                direction : startLocation.rhumbLineBearingTo(positions[positions.length - 1]),
                validFor : (commenceSearchStart - startPosition.ts) / 60/ 60 / 1000
            });
        }
        SurfaceDrifts.prototype.calculateTWC = function(startPosition, commenceSearchStart){
            return this.calculateDrift(SurfaceDrifts.nextTWCPosition, startPosition, commenceSearchStart);
        }
        SurfaceDrifts.prototype.calculateLeeway = function(startPosition, commenceSearchStart, searchObject){
            return this.calculateDrift(SurfaceDrifts.nextLeewayPosition, startPosition, commenceSearchStart, searchObject)
        }
        return SurfaceDrifts;
    }]);

    module.factory('BackTrackSurfaceDrifts', ['SurfaceDrifts', 'Position', 'DriftVector', function (SurfaceDrifts, Position, DriftVector) {
        function BackTrackSurfaceDrifts(surfaceDrifts) {
            this.values = surfaceDrifts
        }
        BackTrackSurfaceDrifts.create = function (surfaceDrifts) {
            SurfaceDrifts.validate(surfaceDrifts);
            return new BackTrackSurfaceDrifts(surfaceDrifts);
        }
        BackTrackSurfaceDrifts.prototype = new SurfaceDrifts();

        BackTrackSurfaceDrifts.prototype.generateValidFor = function (objectPosition, driftFromTs) {
            assertValue(objectPosition, "startPosition");
            assertValue(driftFromTs, "driftFromTs");

            var surfaceDrifts = this.values;
            var validFor = [];
            var startTs = driftFromTs;
            for (var i = 0; i < surfaceDrifts.length; i++) {
                if (i == surfaceDrifts.length - 1) {
                    // It's the last one - let it last the remainder
                    validFor.push((objectPosition.ts - startTs) / 60 / 60 / 1000);
                } else {
                    var currentTs = surfaceDrifts[i].ts;
                    if (currentTs < driftFromTs) {
                        currentTs = driftFromTs;
                    }
                    startTs = surfaceDrifts[i + 1].ts;
                    validFor.push((startTs - currentTs) / 60 / 60 / 1000);
                }
            }
            this.validFor = validFor.reverse();
            return this.validFor;
        }
        BackTrackSurfaceDrifts.prototype.calculateDrift = function(fnNextPosition, objectPosition, driftFromTs, searchObject){
            assertValue(objectPosition, "objectPosition");

            this.generateValidFor(objectPosition, driftFromTs);

            var startLocation = Position.create(objectPosition.lon, objectPosition.lat);
            var positions = [startLocation];

            for (var i = 0; i < this.values.length; i++) {
                var fromPos = i == 0 ? startLocation : positions[i - 1];
                positions.push(fnNextPosition(fromPos, this.validFor[i], this.values[i], searchObject));
            }
            return DriftVector.create({
                positions : positions,
                distance : startLocation.rhumbLineDistanceTo(positions[positions.length - 1]),
                direction : startLocation.rhumbLineBearingTo(positions[positions.length - 1]),
                validFor : (objectPosition.ts - driftFromTs ) / 60/ 60 / 1000
            });
        }

        return BackTrackSurfaceDrifts;
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
                var topCenter = datum.transformRhumbLine(verticalDirection, radius);

                // Bottom side of the box
                var bottomCenter = datum.transformRhumbLine(reverseDirection(verticalDirection), radius);

                // Go left radius length
                var a = topCenter.transformRhumbLine(reverseDirection(horizontalDirection), radius);
                var b = topCenter.transformRhumbLine(horizontalDirection, radius);
                var c = bottomCenter.transformRhumbLine(horizontalDirection, radius);
                var d = bottomCenter.transformRhumbLine(reverseDirection(horizontalDirection), radius);

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
            var A = smallCircle.center.transformRhumbLine(bearing, smallCircle.radius).transformRhumbLine(bearing - direction * 90, smallCircle.radius);
            var D = bigCircle.center.transformRhumbLine(bearing + direction * 180, bigCircle.radius).transformRhumbLine(bearing - direction * 90, bigCircle.radius)
            var B = A.transformRhumbLine(bearing + direction * 90, bigCircle.radius * 2);
            var C = D.transformRhumbLine(bearing + direction * 90, bigCircle.radius * 2);
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
                result.D = result.D.transformRhumbLine(bearing - direction * 90, dwRadius - h);
                result.A = result.A.transformRhumbLine(bearing - direction * 90, dwRadius - h);
            } else {
                result.B = result.B.transformRhumbLine(bearing + direction * 90, h - dwRadius);
                result.C = result.C.transformRhumbLine(bearing + direction * 90, h - dwRadius);
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

    module.factory('RapidResponseOutput', ["Position", "TimeElapsed", "SurfaceDrifts", "SearchCircle", "RapidResponseSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrifts, SearchCircle, RapidResponseSearchAreaCalculator) {

        function RapidResponseOutput(data) {
            angular.extend(this, data);
        }

        RapidResponseOutput.calculate = function (input) {
            var result = TimeElapsed.build(input.lastKnownPosition.ts, input.startTs);
            var css = input.startTs;
            var lkp = input.lastKnownPosition;
            var searchObject = findSearchObjectType(input.searchObject);
            var drift = SurfaceDrifts.create(input.surfaceDriftPoints);
            // Only correct input values to RDV if only one surfaceDrift value set.
            result.rdv = drift.calculateTWC(lkp, css, searchObject).add(drift.calculateLeeway(lkp, css, searchObject)).limitPositionsTo(2);
            var datum = result.rdv.getLastPosition();
            result.circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, result.rdv.distance, datum);
            result.rdv.positions = Position.toDegreesAndDecimalMinutes(result.rdv.positions);
            result.searchArea = RapidResponseSearchAreaCalculator.calculate(datum, result.circle.radius, result.rdv.direction);
            return new RapidResponseOutput(result);
        }
        return RapidResponseOutput;
    }]);


    module.factory('DatumPointOutput', ["Position", "TimeElapsed", "SurfaceDrifts", "SearchCircle", "DatumPointSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrifts, SearchCircle, DatumPointSearchAreaCalculator) {

        function DatumPointOutput(data) {
            angular.extend(this, data);
        }

        DatumPointOutput.calculate = function (input) {
            var result = TimeElapsed.build(input.lastKnownPosition.ts, input.startTs);
            var lkp = input.lastKnownPosition;
            var css = input.startTs;
            var searchObject = findSearchObjectType(input.searchObject);
            var drift = SurfaceDrifts.create(input.surfaceDriftPoints);


            var twc = drift.calculateTWC(lkp, css, searchObject);
            var leeway = drift.calculateLeeway(lkp, css, searchObject)
            var rdv = twc.add(leeway).limitPositionsTo(3);
            var circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
            result.downWind = {
                rdv : rdv,
                circle : circle,
            }
            result.downWind.rdv.positions = Position.toDegreesAndDecimalMinutes(result.downWind.rdv.positions);

            var maxLeeway = leeway.divergence(searchObject.divergence)
            rdv = twc.limitPositionsTo(2).add(maxLeeway).limitPositionsTo(3);
            circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
            result.max = {
                rdv : rdv,
                circle : circle,
            }
            result.max.rdv.positions = Position.toDegreesAndDecimalMinutes(result.max.rdv.positions);


            var minLeeway = leeway.divergence(0 - searchObject.divergence)
            rdv = twc.limitPositionsTo(2).add(minLeeway).limitPositionsTo(3);
            circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
            result.min = {
                rdv : rdv,
                circle : circle,
            }
            result.min.rdv.positions = Position.toDegreesAndDecimalMinutes(result.min.rdv.positions);

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

    module.factory('DatumLineOutput', ["Position", "TimeElapsed", "SurfaceDrifts", "SearchCircle", "DatumLineSearchAreaCalculator",
        function (Position, TimeElapsed, SurfaceDrifts, SearchCircle, DatumLineSearchAreaCalculator) {

        function DatumLineOutput(data) {
            angular.extend(this, data);
        }

        DatumLineOutput.calculate = function(input) {
            var dspResults = [];
            for (var index in input.dsps) {
                var dsp = clone(input.dsps[index]);

                var css = input.startTs
                var result = TimeElapsed.build(dsp.ts, input.startTs);

                var searchObject = findSearchObjectType(input.searchObject);

                var drift = SurfaceDrifts.create(dsp.reuseSurfaceDrifts ? input.dsps[0].surfaceDrifts : dsp.surfaceDrifts);
                var twc = drift.calculateTWC(dsp, css, searchObject);
                var leeway = drift.calculateLeeway(dsp, css, searchObject)
                var rdv = twc.add(leeway);

                var circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
                result.downWind = {
                    rdv: rdv,
                    circle: circle,
                }
                result.downWind.rdv.positions = Position.toDegreesAndDecimalMinutes(result.downWind.rdv.positions);


                var maxLeeway = leeway.divergence(searchObject.divergence)
                rdv = twc.add(maxLeeway);
                circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
                result.max = {
                    rdv: rdv,
                    circle: circle,
                }
                result.max.rdv.positions = Position.toDegreesAndDecimalMinutes(result.max.rdv.positions);

                var minLeeway = leeway.divergence(0-searchObject.divergence)
                rdv = twc.add(minLeeway);
                circle = SearchCircle.build(dsp.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getLastPosition());
                result.min = {
                    rdv: rdv,
                    circle: circle,
                }
                result.min.rdv.positions = Position.toDegreesAndDecimalMinutes(result.min.rdv.positions);

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



    module.factory('BackTrackOutput', ['TimeElapsed', 'Position', 'BackTrackSurfaceDrifts','SearchCircle', function (TimeElapsed, Position, BackTrackSurfaceDrifts,SearchCircle) {
        function BackTrackOutput(data) {
            angular.extend(this, data);
        }

        BackTrackOutput.calculate = function(input){
            var result = TimeElapsed.build(input.driftFromTs, input.objectPosition.ts);

            var driftFromTs = input.driftFromTs;
            var searchObject = findSearchObjectType(input.searchObject);

            var drift = BackTrackSurfaceDrifts.create(input.surfaceDriftPoints);

            var twc = drift.calculateTWC(input.objectPosition, driftFromTs);
            var leeway = drift.calculateLeeway(input.objectPosition, driftFromTs, searchObject)
            var rdv = twc.add(leeway).limitPositionsTo(3).reverse();

            var circle = SearchCircle.build(input.xError, input.yError, input.safetyFactor, rdv.distance, rdv.getFirstPosition());
            result.rdv = rdv;
            result.circle = circle;

            return new BackTrackOutput(result);
        }

        return BackTrackOutput;
    }]);


    // USED IN sar-edit.controller.js and sar-controller.js
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

        function leadingZeros(value, number){
            var str = value.toString();
            while (str.length < number){
                str = "0" + str;
            }
            return str;
        }

        return {

            createSarId: function () {
                var now = new Date();
                return "AW-" + now.getUTCFullYear() + leadingZeros(now.getUTCMonth() + 1, 2) + leadingZeros(now.getUTCDate(),2)
                    + leadingZeros(now.getUTCHours(), 2) + leadingZeros(now.getUTCMinutes(), 2)
                    + leadingZeros(now.getUTCSeconds(), 2) + leadingZeros(now.getUTCMilliseconds(), 3);
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


    function EffortAllocationCalculator(SarTableFactory) {
        this.SarTableFactory = SarTableFactory;
    }

    EffortAllocationCalculator.prototype.lookupVelocityCorrection = function (sruType, targetType, speed) {
        var table = this.SarTableFactory.getSpeedCorrectionTable(sruType);
        if(table){
            return table.lookup(targetType, speed);
        }
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
    EffortAllocationCalculator.prototype.calculateTrackSpacing = function (input) {
        var wu = this.SarTableFactory.getSweepWidthTable(input.type).lookup(input.target, input.visibility);
        var fw = this.lookupWeatherCorrectionFactor(input.wind, input.waterElevation, input.target);
        var fv = this.lookupVelocityCorrection(input.type, input.target, input.speed);
        var wc = this.calculateCorrectedSweepWidth(wu, fw, fv, input.fatigue);
        var C = this.calculateCoverageFactor(input.pod)
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
        } else if (sar.input.type == embryo.sar.Operation.DatumLine){
            return sar.output.dsps[0].downWind.circle.datum;
        }
        return sar.output.circle.datum;
    };
    EffortAllocationCalculator.prototype.calculateSearchArea = function (areaSize, datum, sarArea) {
        //In NM?
        var quadrantLength = Math.sqrt(areaSize);

        var center = embryo.geo.Position.create(datum.lon, datum.lat);

        var bearingAB = null;
        var bearingDA = null;

        if(sarArea.A && sarArea.B && sarArea.D){
            var sarA = embryo.geo.Position.create(sarArea.A.lon, sarArea.A.lat);
            var sarB = embryo.geo.Position.create(sarArea.B.lon, sarArea.B.lat);
            var sarD = embryo.geo.Position.create(sarArea.D.lon, sarArea.D.lat);
            bearingAB = sarA.rhumbLineBearingTo(sarB);
            bearingDA = sarD.rhumbLineBearingTo(sarA);
        } else {
            bearingAB = 90;
            bearingDA = 180;
        }

        var zonePosBetweenAandB = center.transformRhumbLine(bearingAB, quadrantLength / 2);

        var zoneArea = {};
        zoneArea.B = zonePosBetweenAandB.transformRhumbLine(bearingDA, quadrantLength / 2);
        zoneArea.A = zoneArea.B.transformRhumbLine(embryo.geo.reverseDirection(bearingAB), quadrantLength);
        zoneArea.C = zoneArea.B.transformRhumbLine(embryo.geo.reverseDirection(bearingDA), quadrantLength);
        zoneArea.D = zoneArea.A.transformRhumbLine(embryo.geo.reverseDirection(bearingDA), quadrantLength);
        zoneArea.size = areaSize;

        return zoneArea;
    };

    EffortAllocationCalculator.prototype.calculate = function (input, sar) {
        var S = this.calculateTrackSpacing(input);
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


    // USED IN sar-edit.controller.js and sar-controller.js
    module.service('EffortAllocationService', ['LivePouch', '$log', function (LivePouch, $log) {

        var service = {
            deleteAllocationsForSameUser: function (effort, success) {
                LivePouch.query('sar/effortView', {
                    key: effort.sarId,
                    include_docs: true
                }).then(function (result) {
                    var efforts = [];
                    for (var index in result.rows) {
                        var doc = result.rows[index].doc;
                        if (doc['@type'] === embryo.sar.Type.EffortAllocation && doc.name == effort.name
                            && doc._id !== effort._id) {

                            doc._deleted = true;
                            efforts.push(doc)
                        } else if (doc['@type'] === embryo.sar.Type.SearchPattern && doc.name === effort.name) {
                            doc._deleted = true;
                            efforts.push(doc)
                        }
                    }
                    //delete allocations and search patterns
                    return LivePouch.bulkDocs(efforts)
                }).then(success).catch(function (error) {
                    $log.error("error during deleteEffortAllocationsForSameUser")
                    $log.error(error)
                });
            }

        };
        return service;
    }]);


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

        corners.sort(toTheNorth)

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
        var tmp = corner.transformRhumbLine(embryo.geo.reverseDirection(before.rhumbLineBearingTo(corner)), dist);
        var CSP = tmp.transformRhumbLine(corner.rhumbLineBearingTo(after), dist);
        return CSP;
    }

    SearchPatternCalculator.prototype.onSceneDistance = function (zone) {
        return zone.time * zone.speed ;
    }

    SearchPatternCalculator.getCalculator = function (type) {
        switch (type) {
            case (embryo.sar.effort.SearchPattern.ParallelSweep) :
                return new ParallelSweepSearchCalculator();
            case (embryo.sar.effort.SearchPattern.CreepingLine) :
                return new CreepingLineCalculator();
            case (embryo.sar.effort.SearchPattern.ExpandingSquare) :
                return new ExpandingSquareCalculator();
            case (embryo.sar.effort.SearchPattern.SectorSearch) :
             return new SectorCalculator();
           /*  case (embryo.sar.effort.SearchPattern.TrackLine) :
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
        var xtd = zone.S / 2

        var lastPosition = CSP;
        var nextIsSearchLeg = true;
        while (totalDistance < onSceneDistance) {
            var bearing = nextIsSearchLeg ? embryo.geo.reverseDirection(lastSearchLegBearing) : crossLegBearing;
            var distance = nextIsSearchLeg ? searchLegDistance : zone.S;

            if (totalDistance + distance > onSceneDistance) {
                distance = onSceneDistance - totalDistance;
            }
            var lastPosition = lastPosition.transformRhumbLine(bearing, distance);
            wayPoints.push(this.createWaypoint(index++, lastPosition, zone.speed, embryo.geo.Heading.RL, xtd));

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

    ExpandingSquareCalculator.prototype = new SearchPatternCalculator();

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
            var lastPosition = lastPosition.transformRhumbLine(bearing, distance);
            wayPoints.push(this.createWaypoint(index++, lastPosition, zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            totalDistance += distance;
        }
        return wayPoints;
    }



    ExpandingSquareCalculator.prototype.calculate = function (zone, sp) {
        var posA = this.cornerPosition(zone, "A");
        var posB = this.cornerPosition(zone, "B");
        var posC = this.cornerPosition(zone, "C");

        var distAB = posA.rhumbLineDistanceTo(posB);
        var distBC = posB.rhumbLineDistanceTo(posC);

        if(embryo.Math.round10(distAB, 2) != embryo.Math.round10(distBC, 2)){

        }

        var bearingAB = posA.rhumbLineBearingTo(posB);
        var bearingBC = posB.rhumbLineBearingTo(posC);

        var centerAB = posA.transformRhumbLine(bearingAB, distAB/2);
        var center = centerAB.transformRhumbLine(bearingBC, distBC/2);

        var wayPoints = this.createWaypoints(zone, center, bearingAB);

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

    function SectorCalculator() {
    }

    SectorCalculator.prototype = new ParallelSweepSearchCalculator();

    SectorCalculator.prototype.createWaypoints = function (zone, csp, center, initialDirection, radius, turn) {
        var wpIndex = 0;
        var totalDistance = 0;
        //var onSceneDistance = this.onSceneDistance(zone);

        var turnPoints = [csp];
        var direction = embryo.geo.reverseDirection(initialDirection);

        for(var counter = 0; counter < 5; counter++){
            direction= (direction + (turn === embryo.sar.effort.Side.Port ? -60 : 60)) % 360;
            turnPoints.push(center.transformRhumbLine(direction, radius))
        }

        var wayPoints = [];
        var index = 0;
        for(var counter = 0; counter < 3; counter++){
            wayPoints.push(this.createWaypoint(wpIndex++, turnPoints[index], zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            wayPoints.push(this.createWaypoint(wpIndex++, center, zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            index = (index + 3) % 6;
            wayPoints.push(this.createWaypoint(wpIndex++, turnPoints[index], zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            index++
        }
        wayPoints.push(this.createWaypoint(wpIndex, turnPoints[0], zone.speed, embryo.geo.Heading.RL, zone.S / 2));
        return wayPoints;
    }

    SectorCalculator.prototype.center = function (zone, sp) {
        var center;
        if (sp.sar.output.circle) {
            center = sp.sar.output.circle.datum;
        } else if (sp.sar.output.downWind.circle) {
            center = sp.sar.output.downWind.circle.datum;
        } else {
            var posA = this.cornerPosition(zone, "A");
            var posB = this.cornerPosition(zone, "B");
            var posC = this.cornerPosition(zone, "C");

            var distAB = posA.rhumbLineDistanceTo(posB);
            var distBC = posB.rhumbLineDistanceTo(posC);

            var bearingAB = posA.rhumbLineBearingTo(posB);
            var bearingBC = posB.rhumbLineBearingTo(posC);

            var centerAB = posA.transformRhumbLine(bearingAB, distAB / 2);
            center = centerAB.transformRhumbLine(bearingBC, distBC / 2);
        }
        return center
    }

    SectorCalculator.prototype.calculate = function (zone, sp) {
        var center = this.center(zone,sp);

        var direction = parseInt(sp.direction)

        var wayPoints = this.createWaypoints(zone, sp.csp, center, direction, sp.radius, sp.turn);

        var searchPattern = {
            _id: "sarSp-" + Date.now(),
            sarId: zone.sarId,
            effId: zone._id,
            type: embryo.sar.effort.SearchPattern.SectorSearch,
            name: zone.name,
            wps: wayPoints,
            direction : sp.direction,
            radius : sp.radius,
            turn : sp.turn
        }
        searchPattern['@type'] = embryo.sar.Type.SearchPattern;

        return searchPattern;
    }

    SectorCalculator.prototype.calculateCSP = function (zone, sp) {
        var center = this.center(zone,sp);
        return center.transformRhumbLine(embryo.geo.reverseDirection(sp.direction), sp.radius)
    }


    module.factory('TrackLineReturn',['Position', 'Route', function (Position, Route) {

        function TrackLineReturn(){}

        TrackLineReturn.prototype = new SearchPatternCalculator();

        TrackLineReturn.prototype.createWaypoints = function (zone, sp, routePoints) {
            var distanceToTravel = zone.time * zone.speed;

            var routeLengthToTravel = (distanceToTravel - zone.S)/2;

            var wps = [];
            for(var i in routePoints){
                wps.push({
                    longitude : routePoints[i].lon,
                    latitude : routePoints[i].lat
                })
            }

            var route = Route.build({
                waypoints : wps
            });

            var routePointsToTravel = [];
            var startPos = sp.dragPoint ? Position.create(sp.dragPoint) : null;

            for(var i = 0; i < route.waypoints.length - 1 && routeLengthToTravel >= 0; i++){
                var wp1 = Position.create(route.waypoints[i]);
                var wp2 = Position.create(route.waypoints[i+1]);

                var bearing = wp1.bearingTo(wp2, embryo.geo.Heading.RL);
                var distance =  wp1.distanceTo(wp2, embryo.geo.Heading.RL);

                if(startPos) {
                    var distanceToWp1 = startPos.distanceTo(wp1, embryo.geo.Heading.RL);
                    var distanceToWp2 = startPos.distanceTo(wp2, embryo.geo.Heading.RL);
                    if (Math.abs(distanceToWp1 + distanceToWp2 - distance) < 0.1) {
                        // on route leg

                        wp1 = startPos;
                        distance = distanceToWp2;
                        startPos = null;
                    }
                }

                if(!startPos){
                    if (distance >= routeLengthToTravel) {
                        wp2 = wp1.transformRhumbLine(bearing, routeLengthToTravel);
                    }

                    if(routePointsToTravel.length === 0 && !startPos){
                        routePointsToTravel.push(wp1);
                    }
                    routePointsToTravel.push(wp2);

                    routeLengthToTravel -= distance;
                }
            }

            if(sp.direction === embryo.sar.effort.TrackLineDirection.OppositeRoute){
                routePointsToTravel.reverse();
            }

            // TODO if great circle we need to include all points between waypoints
            var turnPointsOut = [];
            var turnPointsReturn = [];

            var outBearing = sp.turn === embryo.sar.effort.Side.Starboard ? -90 : 90;
            var returnBearing = sp.turn === embryo.sar.effort.Side.Port ? -90 : 90;

            for(var i = 0; i < routePointsToTravel.length - 1; i++){
                var p1 = routePointsToTravel[i];
                var p2 = routePointsToTravel[i + 1];

                var bearing = p1.bearingTo(p2, embryo.geo.Heading.RL);
                turnPointsOut.push(p1.transformRhumbLine(bearing + outBearing, zone.S/2));
                turnPointsReturn.push(p1.transformRhumbLine(bearing + returnBearing, zone.S/2));
                turnPointsOut.push(p2.transformRhumbLine(bearing + outBearing, zone.S/2));
                turnPointsReturn.push(p2.transformRhumbLine(bearing + returnBearing, zone.S/2))
            }

            var turnPoints = turnPointsOut.concat(turnPointsReturn.reverse());

            var wayPoints = [];
            for(var i in turnPoints){
                wayPoints.push(this.createWaypoint(i, turnPoints[i], zone.speed, embryo.geo.Heading.RL, zone.S / 2));
            }
            return wayPoints;
        };


        TrackLineReturn.prototype.calculate = function (zone, sp, sar) {
            var wayPoints = this.createWaypoints(zone, sp, sar.input.planedRoute.points);
            var searchPattern = {
                _id: "sarSp-" + Date.now(),
                sarId: zone.sarId,
                effId: zone._id,
                type: embryo.sar.effort.SearchPattern.TrackLineReturn,
                name: zone.name,
                dragPoint: sp.dragPoint ? sp.dragPoint : Position.create(sar.input.planedRoute.points[0]),
                wps: wayPoints,
                direction : sp.direction,
                turn : sp.turn
            }
            searchPattern['@type'] = embryo.sar.Type.SearchPattern;

            return searchPattern;
        }

        return new TrackLineReturn();
    }]);

    module.factory('TrackLineNonReturn',['Position', 'Route', function (Position, Route) {

        function TrackLineNonReturn(){};

        TrackLineNonReturn.prototype = new SearchPatternCalculator();

        TrackLineNonReturn.prototype.createWaypoints = function (zone, sp, routePoints, fromStartPos) {
            var distanceToTravel = zone.time * zone.speed;
            var routeLengthToTravel = (distanceToTravel - 3 * zone.S)/3

            var wps = []
            for(var i in routePoints){
                wps.push({
                    longitude : routePoints[i].lon,
                    latitude : routePoints[i].lat
                })
            }

            var route = Route.build({
                waypoints : wps
            });

            var routePointsToTravel = []
            var startPos = sp.dragPoint ? Position.create(sp.dragPoint) : null;

            for(var i = 0; i < route.waypoints.length - 1 && routeLengthToTravel >= 0; i++){
                var wp1 = Position.create(route.waypoints[i]);
                var wp2 = Position.create(route.waypoints[i+1]);

                var bearing = wp1.bearingTo(wp2, embryo.geo.Heading.RL);
                var distance =  wp1.distanceTo(wp2, embryo.geo.Heading.RL);

                if(startPos) {
                    var distanceToWp1 = startPos.distanceTo(wp1, embryo.geo.Heading.RL);
                    var distanceToWp2 = startPos.distanceTo(wp2, embryo.geo.Heading.RL)
                    if (Math.abs(distanceToWp1 + distanceToWp2 - distance) < 0.1) {
                        // on route leg

                        wp1 = startPos;
                        distance = distanceToWp2;
                        startPos = null;
                    }
                }

                if(!startPos){
                    if (distance >= routeLengthToTravel) {
                        wp2 = wp1.transformRhumbLine(bearing, routeLengthToTravel);
                    }

                    if(routePointsToTravel.length === 0 && !startPos){
                        routePointsToTravel.push(wp1);
                    }
                    routePointsToTravel.push(wp2);

                    routeLengthToTravel -= distance;
                }
            }

            if(sp.direction === embryo.sar.effort.TrackLineDirection.OppositeRoute){
                routePointsToTravel.reverse();
            }

            // TODO if great circle we need to include all points between waypoints
            var leg1Out = [];
            var leg2Return = [];
            var leg3Out =[];

            var returnBearing = sp.turn === embryo.sar.effort.Side.Port ? -90 : 90
            var out3Bearing = sp.turn === embryo.sar.effort.Side.Starboard ? -90 : 90

            for(var i = 0; i < routePointsToTravel.length - 1; i++){
                var p1 = routePointsToTravel[i];
                var p2 = routePointsToTravel[i+1];

                var bearing = p1.bearingTo(p2, embryo.geo.Heading.RL);

                leg1Out.push(p1);
                leg2Return.push(p1.transformRhumbLine(bearing + returnBearing, zone.S))
                leg3Out.push(p1.transformRhumbLine(bearing + out3Bearing, zone.S))

                leg1Out.push(p2);
                leg2Return.push(p2.transformRhumbLine(bearing + returnBearing, zone.S))
                leg3Out.push(p2.transformRhumbLine(bearing + out3Bearing, zone.S))
            }

            var turnPoints = leg1Out.concat(leg2Return.reverse()).concat(leg3Out);

            var wayPoints = [];
            for(var i in turnPoints){
                wayPoints.push(this.createWaypoint(i, turnPoints[i], zone.speed, embryo.geo.Heading.RL, zone.S));
            }
            return wayPoints;
        }


        TrackLineNonReturn.prototype.calculate = function (zone, sp, sar) {
            var wayPoints = this.createWaypoints(zone, sp, sar.input.planedRoute.points);

            var searchPattern = {
                _id: "sarSp-" + Date.now(),
                sarId: zone.sarId,
                effId: zone._id,
                type: embryo.sar.effort.SearchPattern.TrackLineNonReturn,
                name: zone.name,
                dragPoint: sp.dragPoint ? sp.dragPoint : wayPoints[0],
                wps: wayPoints,
                direction : sp.direction,
                turn : sp.turn
            }
            searchPattern['@type'] = embryo.sar.Type.SearchPattern;

            return searchPattern;
        }

        return new TrackLineNonReturn();
    }]);

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    // USED IN sar-edit.controller.js and sar-controller.js
    module.service('SarService', ['$log', '$timeout', 'Subject', 'Position', 'SarTableFactory',
        function ($log, $timeout, Subject, Position, SarTableFactory) {

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
            calculateEffortAllocations: function (allocationInputs, sar) {
                var s = clone(sar);
                var result = new EffortAllocationCalculator(SarTableFactory).calculate(allocationInputs, s);
                var area = clone(result.area);

                area.A = result.area.A.toDegreesAndDecimalMinutes();
                area.B = result.area.B.toDegreesAndDecimalMinutes();
                area.C = result.area.C.toDegreesAndDecimalMinutes();
                area.D = result.area.D.toDegreesAndDecimalMinutes();
                result.area = area;
                result.coordinator = sar.coordinator.userName;
                return result;
            },
            calculateTrackSpacing: function (input) {
                var S = new EffortAllocationCalculator(SarTableFactory).calculateTrackSpacing(input);
                var allocation = clone(input);
                allocation.S = S;
                // FIXME can not rely on local computer time
                allocation.modified = Date.now();
                return allocation;
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
            calculateSectorCsp: function(z, sp){
                var zone = clone(z);
                if(zone.area){
                    zone.area = service.toGeoPositions(zone.area);
                }
                if(sp.sar && sp.sar.output){
                    sp = clone(sp);
                    if(sp.sar.output.circle){
                        sp.sar.output.circle.datum = Position.create(sp.sar.output.circle.datum);
                    }else if (sp.sar.output.downWind && sp.sar.output.downWind.circle){
                        sp.sar.output.downWind.circle.datum = Position.create(sp.sar.output.downWind.circle.datum);
                    }
                }
                var sectorCalculator =SearchPatternCalculator.getCalculator(embryo.sar.effort.SearchPattern.SectorSearch);
                return sectorCalculator.calculateCSP(zone,sp);
            },
            toGeoPositions : function(area){
                return {
                    A : Position.create(area.A),
                    B : Position.create(area.B),
                    C : Position.create(area.C),
                    D : Position.create(area.D)
                }
            },
            generateSearchPattern: function (z, sp) {
                var zone = clone(z);
                if(zone.area){
                    zone.area = service.toGeoPositions(zone.area);
                }
                if(sp.sar && sp.sar.output){
                    sp = clone(sp);
                    if(sp.sar.output.circle){
                        sp.sar.output.circle.datum = Position.create(sp.sar.output.circle.datum);
                    }else if (sp.sar.output.downWind && sp.sar.output.downWind.circle){
                        sp.sar.output.downWind.circle.datum = Position.create(sp.sar.output.downWind.circle.datum);
                    }
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
            setUserAsCoordinator: function (sar, allocationsAndPatterns, user){
                var sarOperation = clone(sar);
                var coordinator = clone(user);
                delete coordinator._rev
                delete coordinator['@class']
                delete coordinator['@type']
                sarOperation.coordinator = coordinator;
                var updatedDocs = [sarOperation];

                for(var i in allocationsAndPatterns){
                    var doc = clone(allocationsAndPatterns[i])
                    doc.coordinator = coordinator.userName;
                    updatedDocs.push(doc);
                }

                return updatedDocs;
            },
            findAndPrepareCurrentUserAsCoordinator: function (users){
                function findUser(){
                    var userName = Subject.getDetails().userName
                    for(var index in users) {
                        if (users[index].userName === userName) {
                            return users[index];
                        }
                    }
                    return null;
                }
                var user = findUser();
                if(!user){
                    throw new Error("Current user not found among existing users");
                }
                var updatedDocs = service.setUserAsCoordinator({}, [], user);
                return updatedDocs[0].coordinator;
            },
            prepareSearchAreaForDisplayal: function(sa){
                if (sa['@type'] != embryo.sar.Type.SearchArea){
                    return sa;
                }
                var details = Subject.getDetails();
                if(details.userName === sa.coordinator.userName){
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

})();
