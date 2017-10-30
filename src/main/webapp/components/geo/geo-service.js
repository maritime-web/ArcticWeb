(function () {
    "use strict";

    var EARTH_RADIUS_KM = 6371.0087714;

    var module = angular.module('embryo.geo.services', []);

    embryo.geo = {}
    embryo.geo.Heading = Object.freeze({"RL": "RL", "GC": "GC"})

    var VincentyCalculationType = Object.freeze({
        "DISTANCE": "distance",
        "INITIAL_BEARING": "init-bearing",
        FINAL_BEARING: "final-bearing"
    })

    /**
     * Vincenty formula
     */
    function vincentyFormula(latitude1, longitude1, latitude2, longitude2, type) {
        var a = 6378137;
        var b = 6356752.3142;
        var f = 1 / 298.257223563; // WGS-84 ellipsoid
        var L = embryo.Math.toRadians(longitude2 - longitude1);
        var U1 = Math.atan((1 - f) * Math.tan(embryo.Math.toRadians(latitude1)));
        var U2 = Math.atan((1 - f) * Math.tan(embryo.Math.toRadians(latitude2)));
        var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
        var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

        var lambda = L;
        var lambdaP = 2 * Math.PI;
        var iterLimit = 20;
        var sinLambda = 0;
        var cosLambda = 0;
        var sinSigma = 0;
        var cosSigma = 0;
        var sigma = 0;
        var sinAlpha = 0;
        var cosSqAlpha = 0;
        var cos2SigmaM = 0;
        var C;
        while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
            sinLambda = Math.sin(lambda);
            cosLambda = Math.cos(lambda);
            sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda)
            + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
            if (sinSigma == 0) {
                return 0; // co-incident points
            }
            cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
            cosSqAlpha = 1 - sinAlpha * sinAlpha;
            cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
            if (angular.isNumber(cos2SigmaM) && isNaN(cos2SigmaM)) {
                cos2SigmaM = 0; // equatorial line
            }
            C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
            lambdaP = lambda;
            lambda = L + (1 - C) * f * sinAlpha
            * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
        }
        if (iterLimit == 0) {
            return Number.NaN; // formula failed to converge
        }

        if (type == VincentyCalculationType.DISTANCE) {
            var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
            var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
            var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
            var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4
                * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM
                * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
            var distance = b * A * (sigma - deltaSigma);
            return distance;
        }
        // initial bearing
        var fwdAz = embryo.Math.toDegrees(Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
        if (type == VincentyCalculationType.INITIAL_BEARING) {
            return fwdAz;
        }
        // final bearing
        return embryo.Math.toDegrees(Math.atan2(cosU1 * sinLambda, -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda));
    }

    function CoordinateSystem() {
    }

    CoordinateSystem.CARTESIAN = function () {
    }

    CoordinateSystem.CARTESIAN.distanceBetween = function (latitude1, longitude1, latitude2, longitude2) {
        var lat1 = embryo.Math.toRadians(latitude1);
        var lat2 = embryo.Math.toRadians(latitude2);
        var dLat = embryo.Math.toRadians(latitude2 - latitude1);
        var dLon = embryo.Math.toRadians(Math.abs(longitude2 - longitude1));
        var dPhi = Math.log(Math.tan(lat2 / 2.0 + 0.7853981633974483) / Math.tan(lat1 / 2.0 + 0.7853981633974483));
        var q = dPhi == 0.0 ? Math.cos(lat1) : dLat / dPhi;
        if (dLon > 3.141592653589793) {
            dLon = 6.283185307179586 - dLon;
        }

        return Math.sqrt(dLat * dLat + q * q * dLon * dLon) * 6371.0087714 * 1000.0;
    }

    CoordinateSystem.GEODETIC = function () {
    };

    CoordinateSystem.GEODETIC.distanceBetween = function (latitude1, longitude1, latitude2, longitude2) {
        return vincentyFormula(latitude1, longitude1, latitude2, longitude2, VincentyCalculationType.DISTANCE);
    }

    /**
     * Encapsulation of an ellipsoid, and declaration of common reference
     * ellipsoids.
     *
     * @author Mike Gavaghan
     */
    embryo.geo.Ellipsoid = function (semiMajorAxisInMeters, semiMinorAxisInMeters, flattening, inverseFlattening) {
        /** Semi major axis (meters). */
        this.semiMajorAxisInMeters = semiMajorAxisInMeters;
        /** Semi minor axis (meters). */
        this.semiMinorAxisInMeters = semiMinorAxisInMeters;
        this.flattening = flattening;
        this.inverseFlattening = inverseFlattening;
    }
    /**
     * Build an Ellipsoid from the semi major axis measurement and the inverse
     * flattening.
     */
    embryo.geo.Ellipsoid.fromAAndInverseF = function (semiMajor, inverseFlattening) {
        var f = 1.0 / inverseFlattening;
        var b = (1.0 - f) * semiMajor;
        return new embryo.geo.Ellipsoid(semiMajor, b, f, inverseFlattening);
    };

    /**
     * Build an Ellipsoid from the semi major axis measurement and the
     * flattening.
     */
    embryo.geo.Ellipsoid.fromAAndF = function (semiMajorMeters, flattening) {
        var inverseF = 1.0 / flattening;
        var b = (1.0 - flattening) * semiMajorMeters;
        return new embryo.geo.Ellipsoid(semiMajorMeters, b, flattening, inverseF);
    }

    /** The WGS84 ellipsoid. */
    embryo.geo.Ellipsoid.WGS84 = embryo.geo.Ellipsoid.fromAAndInverseF(6378137.0, 298.257223563);

    /** The GRS80 ellipsoid. */
    embryo.geo.Ellipsoid.GRS80 = embryo.geo.Ellipsoid.fromAAndInverseF(6378137.0, 298.257222101);

    /** The GRS67 ellipsoid. */
    embryo.geo.Ellipsoid.GRS67 = embryo.geo.Ellipsoid.fromAAndInverseF(6378160.0, 298.25);

    /** The ANS ellipsoid. */
    embryo.geo.Ellipsoid.ANS = embryo.geo.Ellipsoid.fromAAndInverseF(6378160.0, 298.25);

    /** The WGS72 ellipsoid. */
    embryo.geo.Ellipsoid.WGS72 = embryo.geo.Ellipsoid.fromAAndInverseF(6378135.0, 298.26);

    /** The Clarke1858 ellipsoid. */
    embryo.geo.Ellipsoid.CLARKE1858 = embryo.geo.Ellipsoid.fromAAndInverseF(6378293.645, 294.26);

    /** The Clarke1880 ellipsoid. */
    embryo.geo.Ellipsoid.CLARKE1880 = embryo.geo.Ellipsoid.fromAAndInverseF(6378249.145, 293.465);

    /** A spherical "ellipsoid". */
    embryo.geo.Ellipsoid.SPHERE = embryo.geo.Ellipsoid.fromAAndF(6371000, 0.0);


    embryo.geo.Converter = {
        knots2Ms: function (knots) {
            return knots * 1.852 / 3.6;
        },
        ms2Knots: function (ms) {
            return ms * 3.6 / 1.852;
        },
        nmToMeters: function (nm) {
            return nm * 1852;
        },
        metersToNm: function (meters) {
            return meters / 1852;
        },
        squareMetersToSquareNm: function (squareMeters) {
            return squareMeters / (1852 * 1852);
        }
    }

    embryo.geo.formatLongitude = function (longitude) {
        var ns = "E";
        if (longitude < 0) {
            ns = "W";
            longitude *= -1;
        }
        var hours = Math.floor(longitude);
        longitude -= hours;
        longitude *= 60;
        var lonStr = longitude.toFixed(3);
        while (lonStr.indexOf('.') < 2) {
            lonStr = "0" + lonStr;
        }

        return (hours / 1000.0).toFixed(3).substring(2) + " " + lonStr + ns;
    }

    embryo.geo.formatLatitude = function (latitude) {
        var ns = "N";
        if (latitude < 0) {
            ns = "S";
            latitude *= -1;
        }
        var hours = Math.floor(latitude);
        latitude -= hours;
        latitude *= 60;
        var latStr = latitude.toFixed(3);
        while (latStr.indexOf('.') < 2) {
            latStr = "0" + latStr;
        }

        return (hours / 100.0).toFixed(2).substring(2) + " " + latStr + ns;
    }

    embryo.geo.reverseDirection = function (direction) {
        var newDirection = direction + 180;

        if (newDirection > 360) {
            newDirection = newDirection - 360;
        }

        if (newDirection < -0) {
            newDirection = newDirection + 360;
        }
        return newDirection;
    }

    function decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    embryo.Math = {};
    embryo.Math.toRadians = function (degree) {
        return degree / 360 * 2 * Math.PI;
    }

    embryo.Math.toDegrees = function (rad) {
        return rad * 360 / 2 / Math.PI;
    }

    embryo.Math.round10 = function (value, exp) {
        return decimalAdjust('round', value, exp);
    };


    /**
     * This method is a slightly modified reimplementation in JavaScript of dk.dma.epd.common.util.Calculator.calculateEndingGlobalCoordinates()
     *
     * @param ellipsoid
     * @param startPosition
     * @param startBearing
     * @param distance
     * @param endBearing
     * @returns {latitude}
     */
    embryo.geo.Ellipsoid.prototype.calculateEndingGlobalCoordinates =
        function (startPosition, startBearing, distance) {

            var ellipsoid = this;

            var a = ellipsoid.semiMajorAxisInMeters;
            var b = ellipsoid.semiMajorAxisInMeters;

            var aSquared = a * a;
            var bSquared = b * b;
            var f = ellipsoid.flattening;
            var phi1 = embryo.Math.toRadians(startPosition.lat);
            var alpha1 = embryo.Math.toRadians(startBearing);

            var cosAlpha1 = Math.cos(alpha1);
            var sinAlpha1 = Math.sin(alpha1);
            var tanU1 = (1.0 - f) * Math.tan(phi1);
            var cosU1 = 1.0 / Math.sqrt(1.0 + tanU1 * tanU1);
            var sinU1 = tanU1 * cosU1;

            // eq. 1
            var sigma1 = Math.atan2(tanU1, cosAlpha1);

            // eq. 2
            var sinAlpha = cosU1 * sinAlpha1;

            var sin2Alpha = sinAlpha * sinAlpha;
            var cos2Alpha = 1 - sin2Alpha;
            var uSquared = cos2Alpha * (aSquared - bSquared) / bSquared;

            // eq. 3
            var A = 1 + uSquared / 16384 * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared)));

            // eq. 4
            var B = uSquared / 1024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared)));

            // iterate until there is a negligible change in sigma
            var deltaSigma;
            var sOverbA = distance / (b * A);
            var sigma = sOverbA;
            var sinSigma;
            var prevSigma = sOverbA;
            var sigmaM2;
            var cosSigmaM2;
            var cos2SigmaM2;

            for (; ;) {
                // eq. 5

                sigmaM2 = 2.0 * sigma1 + sigma;
                cosSigmaM2 = Math.cos(sigmaM2);
                cos2SigmaM2 = cosSigmaM2 * cosSigmaM2;
                sinSigma = Math.sin(sigma);
                var cosSignma = Math.cos(sigma);

                // eq. 6
                deltaSigma = B * sinSigma
                * (cosSigmaM2 + B / 4.0 * (cosSignma * (-1 + 2 * cos2SigmaM2) - B / 6.0
                * cosSigmaM2 * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM2)));

                // eq. 7
                sigma = sOverbA + deltaSigma;

                // break if undefined detected to avoid infinite loop
                if (sigma === undefined || sigma === NaN) {
                    break;
                }
                // break after converging to tolerance
                if (Math.abs(sigma - prevSigma) < 0.0000000000001) {
                    break;
                }

                prevSigma = sigma;
            }

            sigmaM2 = 2.0 * sigma1 + sigma;
            cosSigmaM2 = Math.cos(sigmaM2);
            cos2SigmaM2 = cosSigmaM2 * cosSigmaM2;

            var cosSigma = Math.cos(sigma);
            sinSigma = Math.sin(sigma);

            // eq. 8
            var phi2 = Math.atan2(
                sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
                (1.0 - f)
                * Math.sqrt(sin2Alpha
                + Math.pow(sinU1 * sinSigma - cosU1 * cosSigma
                * cosAlpha1, 2.0)));

            // eq. 9
            // This fixes the pole crossing defect spotted by Matt Feemster. When a
            // path passes a pole and essentially crosses a line of latitude twice -
            // once in each direction - the longitude calculation got messed up.
            // Using atan2 instead of atan fixes the defect. The change is in the next 3 lines.
            // double tanLambda = sinSigma * sinAlpha1 / (cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
            // double lambda = Math.atan(tanLambda);
            var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);

            // eq. 10
            var C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));

            // eq. 11
            var L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cosSigmaM2 + C * cosSigma * (-1 + 2 * cos2SigmaM2)));

            // eq. 12
            //var alpha2 = Math.atan2(sinAlpha, -sinU1 * sinSigma + cosU1 * cosSigma * cosAlpha1);

            // build result
            var latitude = embryo.Math.toDegrees(phi2);
            var longitude = startPosition.lon + embryo.Math.toDegrees(L);

            //if (endBearing != null && endBearing.length > 0) {
            //    endBearing[0] = Math.toDegrees(alpha2);
            //}

            return new embryo.geo.Position(longitude, latitude);

        }

    embryo.geo.Position = function (lon, lat) {
        this.lon = lon;
        this.lat = lat;
    }

    /**
     * @param startBearing
     * @param distance
     * @returns a new instance of Position moved according to the parameters startBearing and distanceInNm.
     */
    embryo.geo.Position.prototype.transformPosition = function (startBearing, distanceInNm) {
        var startLocation = this;
        var sphere = embryo.geo.Ellipsoid.SPHERE;
        var distanceInMeters = embryo.geo.Converter.nmToMeters(distanceInNm);
        var dest = sphere.calculateEndingGlobalCoordinates(startLocation, startBearing, distanceInMeters);
        return dest;
    }


    embryo.geo.Position.prototype.transform = function (bearing, distanceInNm, heading) {
        if (heading == embryo.geo.Heading.RL) {
            return this.transformRhumbLine(bearing, distanceInNm);
        } else {
            return this.transformPosition(bearing, distanceInNm);
        }
    }

    embryo.geo.Position.prototype.transformRhumbLine = function(bearing, distanceInNm) {
        // Taken from http://cdn.rawgit.com/chrisveness/geodesy/v1.1.1/latlon-spherical.js
        // Consider including latlon-spherical.js in application and let Position use LatLon object
        // (Composition pattern)
        var distanceInMeters = embryo.geo.Converter.nmToMeters(distanceInNm);
        var d = distanceInMeters / (EARTH_RADIUS_KM*1e3);
        var bearingRad = embryo.Math.toRadians(bearing);
        var ø1 = embryo.Math.toRadians(this.lat);
        var λ1 = embryo.Math.toRadians(this.lon);
        var Δφ = d * Math.cos(bearingRad);
        var ø2 = ø1 + Δφ;

        if(Math.abs(ø2) > Math.PI/2){
            ø2 = ø2 > 0 ?Math.PI - ø2 : -Math.PI-ø2;
        }
        var Δψ = Math.log(Math.tan(ø2/2+Math.PI/4)/Math.tan(ø1/2+Math.PI/4));
        var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(ø1); // E-W course becomes ill-conditioned with 0/0

        var Δλ = d*Math.sin(bearingRad)/q;
        var λ2 = λ1 + Δλ;

        var lat2 = embryo.Math.toDegrees(ø2);
        var lon2 = embryo.Math.toDegrees(λ2);

        return new embryo.geo.Position((lon2+540) % 360 - 180, lat2);
    }

    embryo.geo.Position.prototype.rhumbLineBearingTo = function (destination) {
        var lat1 = embryo.Math.toRadians(this.lat);
        var lat2 = embryo.Math.toRadians(destination.lat);
        var phi = Math.log(Math.tan(lat2 / 2.0 + 0.7853981633974483) / Math.tan(lat1 / 2.0 + 0.7853981633974483));
        var lon = embryo.Math.toRadians(destination.lon - this.lon);
        if (Math.abs(lon) > 3.141592653589793) {
            lon = lon > 0.0 ? -(6.283185307179586 - lon) : 6.283185307179586 + lon;
        }
        var bearing = Math.atan2(lon, phi);
        return (embryo.Math.toDegrees(bearing) + 360.0) % 360.0;
    }

    embryo.geo.Position.prototype.geodesicInitialBearingTo = function (destination) {
        return vincentyFormula(this.lat, this.lon, destination.lat, destination.lon, VincentyCalculationType.INITIAL_BEARING);
    }

    embryo.geo.Position.prototype.bearingTo = function (destination, heading) {
        if (heading == embryo.geo.Heading.RL) {
            return this.rhumbLineBearingTo(destination);
        } else {
            return this.geodesicInitialBearingTo(destination);
        }
    }

    embryo.geo.Position.prototype.geodesicDistanceTo = function (destination) {
        var distanceInMeters = CoordinateSystem.GEODETIC.distanceBetween(this.lat, this.lon, destination.lat, destination.lon, VincentyCalculationType.DISTANCE);
        return embryo.geo.Converter.metersToNm(distanceInMeters);
    }

    embryo.geo.Position.prototype.rhumbLineDistanceTo = function (destination) {
        var distanceInMeters = CoordinateSystem.CARTESIAN.distanceBetween(this.lat, this.lon, destination.lat, destination.lon, VincentyCalculationType.DISTANCE);
        return embryo.geo.Converter.metersToNm(distanceInMeters);
    }

    /**
     * Find distance between this point and a destination point given heading
     *
     * @param destination
     * @param heading
     */
    embryo.geo.Position.prototype.distanceTo = function (destination, heading) {
        var distanceInNm;
        if (heading == embryo.geo.Heading.RL) {
            distanceInNm = this.rhumbLineDistanceTo(destination);
        } else {
            distanceInNm = this.geodesicDistanceTo(destination);
        }
        return distanceInNm;
    }


    /* To be replaced by embryo.geo.Position.formatLongitude*/
    function formatLongitude(longitude) {
        var ns = "E";
        if (longitude < 0) {
            ns = "W";
            longitude *= -1;
        }
        var hours = Math.floor(longitude);
        longitude -= hours;
        longitude *= 60;
        var lonStr = longitude.toFixed(3);
        while (lonStr.indexOf('.') < 2) {
            lonStr = "0" + lonStr;
        }

        return (hours / 1000.0).toFixed(3).substring(2) + " " + lonStr + ns;
    }

    /* To be replaced by embryo.geo.Position.formatLatitude*/
    function formatLatitude(latitude) {
        var ns = "N";
        if (latitude < 0) {
            ns = "S";
            latitude *= -1;
        }
        var hours = Math.floor(latitude);
        latitude -= hours;
        latitude *= 60;
        var latStr = latitude.toFixed(3);
        while (latStr.indexOf('.') < 2) {
            latStr = "0" + latStr;
        }

        return (hours / 100.0).toFixed(2).substring(2) + " " + latStr + ns;
    }


    embryo.geo.Position.prototype.toDegreesAndDecimalMinutes = function () {
        return {
            lat : formatLatitude(this.lat),
            lon : formatLongitude(this.lon)
        }
    }


    function splitFormattedPos(posStr) {
        var parts = [];
        parts[2] = posStr.substring(posStr.length - 1);
        posStr = posStr.substring(0, posStr.length - 1);
        var posParts = $.trim(posStr).split(" ");
        if (posParts.length != 2) {
            throw "Format exception";
        }
        parts[0] = posParts[0];
        parts[1] = posParts[1];
        return parts;
    }

    function parseString(str){
        str = $.trim(str);
        if (str == null || str.length == 0) {
            return null;
        }
        return str;
    }

    function parseLat(hours, minutes, northSouth) {
        var h = parseInt(hours, 10);
        var m = parseFloat(minutes);
        var ns = parseString(northSouth);
        if (h == null || m == null || ns == null) {
            throw "Format exception";
        }
        ns = ns.toUpperCase();
        if (!(ns == "N") && !(ns == "S")) {
            throw "Format exception";
        }
        var lat = h + m / 60.0;
        if (ns == "S") {
            lat *= -1;
        }
        return lat;
    }

    function parseLon(hours, minutes, eastWest) {
        var h = parseInt(hours, 10);
        var m = parseFloat(minutes);
        var ew = parseString(eastWest);
        if (h == null || m == null || ew == null) {
            throw "Format exception";
        }
        ew = ew.toUpperCase();
        if (!(ew == "E") && !(ew == "W")) {
            throw "Format exception";
        }
        var lon = h + m / 60.0;
        if (ew == "W") {
            lon *= -1;
        }
        return lon;
    }

    embryo.geo.Position.parseLatitude = function (value) {
        if ($.trim(value).indexOf(" ") < 0) {
            var parsed = parseFloat(value);
            if (parsed == value) {
                return parsed;
            }
        }
        var parts = splitFormattedPos(value);
        return parseLat(parts[0], parts[1], parts[2]);
    };

    embryo.geo.Position.parseLongitude = function (value) {
        if ($.trim(value).indexOf(" ") < 0) {
            var parsed = parseFloat(value);
            if (parsed == value) {
                return parsed;
            }
        }
        var parts = splitFormattedPos(value);
        return parseLon(parts[0], parts[1], parts[2]);
    };


    embryo.geo.Position.toDegreesAndDecimalMinutes = function (positionArray) {
        var result = [];
        for(var index in positionArray){
            result.push(positionArray[index].toDegreesAndDecimalMinutes());
        }
        return result;
    }

    embryo.geo.Position.fromDegreesAndDecimalMinutes = function (position) {
        return embryo.geo.Position.create(lon, lat);
    }

    embryo.geo.Position.prototype.asLonLatArray = function () {
        return [this.lon, this.lat];
    };

    module.factory('Position', function () {
        /**
         * Can be used with
         * - two parameters (longitude, latitude) in the format "degree and decimal minutes" (e.g. 010 12.432W, 12 43.123N)
         * - two parameters (longitude, latitude) in the format "degrees" (e.g. 10.5 and 12.34)
         * - a parameter, an object with "lon" and "lat" properties having values following either of the above.
         * - a parameter, an object with "longitude" and "latitude" properties having values following either of the above.
         * - a parameter, an array with two numbers, longitude first.
        */
        embryo.geo.Position.create = function (){
            var lon, lat;
            if(arguments.length === 1) {
                if (Array.isArray(arguments[0])) {
                    var lonLat = arguments[0];
                    lon = lonLat[0];
                    lat = lonLat[1];
                } else if (typeof arguments[0] === "object") {
                    if(arguments[0].longitude && arguments[0].latitude){
                        lon = arguments[0].longitude, lat = arguments[0].latitude;
                    }else {
                        assertObjectFieldValue(arguments[0], "lon");
                        assertObjectFieldValue(arguments[0], "lat");
                        lon = arguments[0].lon;
                        lat = arguments[0].lat;
                    }
                }
            } else if(arguments.length === 2){
                lon = arguments[0];
                lat = arguments[1];
            }

            if(typeof lon === "string"  && typeof lat === "string"){
                lon = embryo.geo.Position.parseLongitude(lon);
                lat = embryo.geo.Position.parseLatitude(lat);
            }
            return new embryo.geo.Position(lon, lat);
        };
        return embryo.geo.Position;
    });

    embryo.geo.Circle = function(centerPosition, radius){
        this.center = centerPosition;
        this.radius = radius;
    }

    embryo.geo.Circle = function(centerPosition, radius){
        this.center = centerPosition;
        this.radius = radius;
    }

    module.factory('Circle', ["Position", function (Position) {
        embryo.geo.Circle.create = function (centerPosition, radius){
            return new embryo.geo.Circle(centerPosition, radius);
        }

        embryo.geo.Circle.prototype.toPolygon = function(numberOfVertices){
            var points = [];
            var lat1 = embryo.Math.toRadians(this.center.lat);
            var lon1 = embryo.Math.toRadians(this.center.lon);
            var R = 6371; // earths mean radius
            var radiusInKm = embryo.geo.Converter.nmToMeters(this.radius)/1000;
            for ( var i = 0; i < numberOfVertices; i++) {
                var bearing = Math.PI * 2 * i / numberOfVertices;
                var lat2 = Math.asin(Math.sin(lat1) * Math.cos(radiusInKm / R) + Math.cos(lat1) * Math.sin(radiusInKm / R) * Math.cos(bearing));
                var lon2 = lon1
                    + Math.atan2(Math.sin(bearing) * Math.sin(radiusInKm / R) * Math.cos(lat1), Math.cos(radiusInKm / R) - Math.sin(lat1)
                        * Math.sin(lat2));
                points.push(Position.create(embryo.Math.toDegrees(lon2), embryo.Math.toDegrees(lat2)));
            }
            return points;
        }

        return embryo.geo.Circle;
    }])

    // Find the points where this circle and the circle argument intersects
    embryo.geo.Circle.prototype.circleIntersectionPoints = function (circle1) {
        var circle0 = this;

        // calculations inspired by: http://www.vb-helper.com/howto_net_circle_circle_intersection.html
        // Find the distance between the centers.
        var dist = circle0.center.rhumbLineDistanceTo(circle1.center);

        // See how many solutions there are.
        if(dist > circle0.radius + circle1.radius){
            throw new Error("No intersection points. Circles to far apart.");
        }else if(dist < Math.abs(circle0.radius - circle1.radius)){
            throw new Error("No intersection points, one circle contains the other.");
        }else if (dist == 0 && circle0.radius == circle1.radius){
            throw new Error("No intersection points, the circles coincide.");
        }

        //Find a and h.
        // FIXME: This should not be ordinary 2D calculation if other calculations are based on calculations on the globe
        var a = (Math.pow(circle0.radius, 2) - Math.pow(circle1.radius, 2) + Math.pow(dist,2)) / (2 * dist);

        var h = Math.sqrt(Math.pow(circle0.radius, 2) - Math.pow(a, 2));

        // Find P2.
        // FIXME: This should not be ordinary 2D calculation if other calculations are based on calculations on the globe
        var bearing = circle0.center.rhumbLineBearingTo(circle1.center);
        var P2 = circle0.center.transformRhumbLine(bearing, a);
        //var lon = circle0.center.lon + a * (circle1.center.lon - circle0.center.lon) / dist;
        //var lat = circle0.center.lat + a * (circle1.center.lat - circle0.center.lat) / dist;
        //var P2 = new embryo.geo.Position(lon, lat);

        // Get one of the points P3.
        // FIXME: This should not be ordinary 2D calculation if other calculations are based on calculations on the globe
        //var intersections = {
        //    p1 : new embryo.geo.Position(P2.lon + h * (circle1.center.lat - circle0.center.lat) / dist,
        //        P2.lat - h * (circle1.center.lon - circle0.center.lon) / dist)
        //}
        var intersections = {
            p1 : P2.transformRhumbLine(bearing - 90, h)
        }

        // if two intersections, then calculate it.
        // FIXME: This should not be ordinary 2D calculation if other calculations are based on calculations on the globe
        if(dist != circle0.radius + circle1.radius){
            //intersections.p2 = new embryo.geo.Position(
            //    P2.lon - h * (circle1.center.lat - circle0.center.lat) / dist,
            //    P2.lat + h * (circle1.center.lon - circle0.center.lon) / dist)
            intersections.p2 = P2.transformRhumbLine(bearing + 90, h);
        }
        return intersections;
    }

    embryo.geo.Circle.prototype.calculateTangents = function(externalPoint){
        // calculations inspired by: http://www.vb-helper.com/howto_net_find_circle_tangents.html

        var circle = this;

        var dist  = circle.center.rhumbLineDistanceTo(externalPoint);
        if (dist < circle.radius){
            throw new Error("Point is inside circle. Can not find tangents");
        }


        var L = Math.sqrt(Math.pow(dist,2) - Math.pow(circle.radius,2))

        // Find the points of intersection between the original circle and the circle with
        // center external_point and radius L.
        var intersectionPoints = circle.circleIntersectionPoints({
            center:  externalPoint,
            radius: L
        });

        if(intersectionPoints.p1 && !intersectionPoints.p2){
            throw new Error("Only one intersection point found. Can not calculate tangents");
        }

        return [{
            point1 : externalPoint,
            point2 : intersectionPoints.p1
        },{
            point1 : externalPoint,
            point2 : intersectionPoints.p2
        }]
    }

    embryo.geo.Circle.prototype.calculateExternalTangents = function(circle2){
        // inspired by : http://www.vb-helper.com/howto_net_circle_circle_tangents.html

        var circle1 = this;

        //TODO if one circle inside the other, then use special calculation or throw error

        var c1, c2;
        if(circle1.radius < circle2.radius){
            c1 = circle1, c2 = circle2;
        }else{
            c1 = circle2, c2 = circle1;
        }

        // ***************************
        // * Find the outer tangents *
        // ***************************

        // FIXME: Should also work for c2 and c1 have equal radius.

        var circle2a = new embryo.geo.Circle(c2.center, c2.radius - c1.radius)
        var tangents = circle2a.calculateTangents(c1.center);

        // Offset the tangent vector's points.
        var bearingToTangent1 = circle2a.center.bearingTo(tangents[0].point2, embryo.geo.Heading.RL);
        var tangent1 = {
            point1 : c1.center.transformRhumbLine(bearingToTangent1, c1.radius),
            point2 : tangents[0].point2.transformRhumbLine(bearingToTangent1, c1.radius)
        }

        // Offset the tangent vector's points.
        var bearingToTangent2 = circle2a.center.bearingTo(tangents[1].point2, embryo.geo.Heading.RL);
        var tangent2 = {
            point1 : c1.center.transformRhumbLine(bearingToTangent2, c1.radius),
            point2 : tangents[1].point2.transformRhumbLine(bearingToTangent2, c1.radius)
        }

        return [tangent1, tangent2]
    }

    /**
     * Create all combinations of external tangents between any two circles
     */
    embryo.geo.Circle.createAllExternalTangents = function (circles){
        var tangents = [];
        for(var i = 0; i < circles.length - 1; i++){
            for(var j = i + 1 ; j < circles.length; j++){
                tangents.push(circles[i].calculateExternalTangents(circles[j]));
            }
        }
        return tangents;
    }


    embryo.geo.Rectangle = function (cornerPositions) {
        if (!cornerPositions || !Array.isArray(cornerPositions) || cornerPositions.length != 4) {
            throw new Error("Rectangle must be initialized with array containing the 4 corner positions of a rectangle");
        }

        for (var i in cornerPositions) {
            if (cornerPositions[i].constructor !== embryo.geo.Position)
                throw new Error("Rectangle array must be populated with instances of embryo.geo.Position");
        }

        this.positions = cornerPositions;
    }

    embryo.geo.Rectangle.prototype.calculateArea = function () {
        //TODO verify these calculations with Erik
        var cPosA = this.positions[0], cPosB = this.positions[1], cPosC = this.positions[2];
        var lengthLineA2BInNm = cPosA.distanceTo(cPosB, embryo.geo.Heading.RL);
        var lengthLineB2CInNm = cPosB.distanceTo(cPosC, embryo.geo.Heading.RL);
        return lengthLineA2BInNm * lengthLineB2CInNm;
    }

    embryo.geo.Rectangle.prototype.getArea = function () {
        if (!this.area) {
            this.area = this.calculateArea();
        }
        return this.area;
    }

    embryo.geo.Rectangle.prototype.calculateDistanceToLine = function (lineIndex, position) {
        var heading = embryo.geo.Heading.RL;
        if (lineIndex < 0 || lineIndex > this.positions.length) {
            throw new Error("lineIndex must be in the range 0-" + this.positions.length);
        }
        // These calculations are inspired byhttp://www.vb-helper.com/howto_net_circle_circle_intersection.html
        var cCenter0 = this.positions[lineIndex];
        var cCenter1 = this.positions[lineIndex == this.positions.length - 1 ? 0 : lineIndex + 1];
        var d = cCenter0.distanceTo(cCenter1, heading);

        var radius0 = cCenter0.distanceTo(position, heading);
        var radius1 = cCenter1.distanceTo(position, heading);

        var a = (Math.pow(radius0, 2) - Math.pow(radius1, 2) + Math.pow(d, 2)) / (d * 2);
        var h = Math.sqrt(Math.pow(radius0, 2) - Math.pow(a, 2))

        var p2 = cCenter0.transformRhumbLine(cCenter0.bearingTo(cCenter1, heading), a);

        return {
            pointOnLine: p2,
            distanceToLine: h
        }
    }

    embryo.geo.Rectangle.prototype.getBearing = function (bearingToMoveLine, awayFromRectangle) {
        bearingToMoveLine + 90;

    }

    embryo.geo.Rectangle.prototype.reshapeFixedArea = function (lineIndex, position) {
        if (lineIndex < 0 || lineIndex > this.positions.length) {
            throw new Error("lineIndex must be in the range 0-" + this.positions.length);
        }

        var area = this.getArea();

        var heading = embryo.geo.Heading.RL;
        var lineInfo = this.calculateDistanceToLine(lineIndex, position);


        var position0 = this.positions[lineIndex];
        var position1 = this.positions[lineIndex + 1 == this.positions.length ? 0 : lineIndex + 1];
        var position2;
        var position3 = this.positions[lineIndex == 0 ? this.positions.length - 1 : lineIndex - 1];

        var pos3ToPos0Dist = position3.distanceTo(position0, heading);
        var pos0ToPos1Dist = position0.distanceTo(position1, heading);
        var bearingPoint0To1 = position0.bearingTo(position1, heading);

        var bearingToMoveLine = lineInfo.pointOnLine.bearingTo(position, heading);
        var awayFromRectangle = Math.abs(bearingToMoveLine - position3.bearingTo(position0, heading)) < 50;

        // workaround to avoid newPos3ToPos0Length values close to 0 and thereby newPos0ToPos1Length of almost infinite length
        // and weird map behaviour as a result
        var newPos3ToPos0Length = pos3ToPos0Dist + (awayFromRectangle ? lineInfo.distanceToLine : -lineInfo.distanceToLine);
        if (newPos3ToPos0Length <= 0.5) {
            newPos3ToPos0Length = 0.5
            lineInfo.distanceToLine = Math.abs(pos3ToPos0Dist - newPos3ToPos0Length);
        }

        var newPos0ToPos1Length = area / newPos3ToPos0Length;
        var delta = Math.abs(newPos0ToPos1Length - pos0ToPos1Dist) / 2;

        position0 = position0.transform(bearingToMoveLine, lineInfo.distanceToLine, heading);
        var bearingToMovePoint0 = (bearingToMoveLine + 90 + 360) % 360;

        position0 = position0.transform(bearingToMovePoint0, delta, heading);
        position1 = position0.transform(bearingPoint0To1, newPos0ToPos1Length, heading);
        position2 = position1.transform(bearingPoint0To1 + 90, newPos3ToPos0Length, heading);
        position3 = position0.transform(bearingPoint0To1 + 90, newPos3ToPos0Length, heading);

        var newPositions = [];
        newPositions[lineIndex] = position0;
        newPositions[lineIndex + 1 == this.positions.length ? 0 : lineIndex + 1] = position1;
        newPositions[lineIndex + 2 >= this.positions.length ? lineIndex - 2 : lineIndex + 2] = position2;
        newPositions[lineIndex == 0 ? this.positions.length - 1 : lineIndex - 1] = position3;

        return new embryo.geo.Rectangle(newPositions);
    }

    module.factory('Polygon', ["Position", function (Position) {
        function Polygon(positions){
            this.positions = positions;
        }

        Polygon.create = function(positions){
            return new Polygon(positions);
        }

        function toTurfPolygon(polygon) {
            var tmp = [];
            for (var i in polygon.positions) {
                tmp.push([polygon.positions[i].lon,polygon.positions[i].lat]);
            }
            tmp.push([polygon.positions[0].lon,polygon.positions[0].lat]);
            var feature = turf.polygon([tmp], {"fill": "#00f"});
            return feature;
        }

        function fromTurfToGeoPolygon(turfPolygon) {
            var positions = [];
            for (var i in turfPolygon) {
                positions.push(Position.create(turfPolygon[i][0], turfPolygon[i][1]));
            }
            return Polygon.create(positions);
        }

        function cross(o, a, b) {
            return (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon);
        }

        Polygon.prototype.size = function(){
            var turfPolygon = toTurfPolygon(this);
            return embryo.geo.Converter.squareMetersToSquareNm(turf.area(turfPolygon));
        }


        Polygon.convexHull = function (positions){
            positions.sort(function(p1, p2) {
                return p1.lon == p2.lon ? p1.lat - p2.lat : p1.lon - p2.lon;
            });
            var lower = [];
            for (var i = 0; i < positions.length; i++) {
                while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], positions[i]) <= 0) {
                    lower.pop();
                }
                lower.push(positions[i]);
            }
            var upper = [];
            for (var i = positions.length - 1; i >= 0; i--) {
                while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], positions[i]) <= 0) {
                    upper.pop();
                }
                upper.push(positions[i]);
            }
            upper.pop();
            lower.pop();
            return Polygon.create(upper.concat(lower));
        }

        Polygon.union = function (polygons){
            if(!Array.isArray(polygons)){
                polygons = [polygons];
            }
            var resultingFeature = null;
            for (var i in polygons) {
                var turfFeature = toTurfPolygon(polygons[i]);
                resultingFeature = resultingFeature == null ? turfFeature : resultingFeature = turf.union(turfFeature, resultingFeature);
            }
            return resultingFeature == null ? null : fromTurfToGeoPolygon(resultingFeature.geometry.coordinates[0])
        }

        return Polygon;
    }])

})();
