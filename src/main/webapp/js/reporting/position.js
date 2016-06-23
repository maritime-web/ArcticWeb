(function() {
    "use strict";

    function clone(object) {
        if(undefined){
            return undefined
        }
        return JSON.parse(JSON.stringify(object));
    }

    embryo.position = {};

    embryo.position.parseLatitude = function (value) {
        if ($.trim(value).indexOf(" ") < 0) {
            var parsed = parseFloat(value);
            if (parsed == value) {
                return parsed;
            }
        }
        var parts = splitFormattedPos(value);
        return parseLat(parts[0], parts[1], parts[2]);
    };

    embryo.position.parseLongitude = function (value) {
        if ($.trim(value).indexOf(" ") < 0) {
            var parsed = parseFloat(value);
            if (parsed == value) {
                return parsed;
            }
        }
        var parts = splitFormattedPos(value);
        return parseLon(parts[0], parts[1], parts[2]);
    };

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

    var module = angular.module('embryo.position', []);


    function positionDirective(formatter1, parser) {
        function formatter(value) {
            if (value || value === 0) return formatter1(value);
            return null;
        }

        return {
            require : '^ngModel',
            restrict : 'A',
            link : function(scope, element, attr, ngModelController) {
                ngModelController.$formatters.push(function(modelValue) {
                    if (!modelValue) {
                        return null;
                    }
                    return formatter(modelValue);
                });

                ngModelController.$parsers.push(function(valueFromInput) {
                    try {
                        return parser(valueFromInput);
                    } catch (e) {
                        return null;
                    }
                });

                element.bind('change', function(event) {
                    if (!ngModelController.$modelValue) {
                        ngModelController.$viewValue = null;
                    }
                    ngModelController.$viewValue = formatter(ngModelController.$modelValue);
                    ngModelController.$render();
                });
            }
        };
    }

    module.service('PositionService', [ function() {

        var regDec = /^\d$/;
        var regSep = /^[\. ]$/;
        var regWE = /^[WEwe]$/;
        var regNS = /^[NSns]$/;
        var regLon = /^(([0]\d{2}|1[0-7]\d) \d{2}\.\d{3}|180 00\.000)[EW]$/;
        var regLat = /^([0-8]\d \d{2}\.\d{3}|90 00\.000)[NS]$/;

        function CoordinateBuilder(strValue){
             var str = strValue;
             var index = 0;
             var separator;

             this.result = "";

             this.parseNumbers = function(maxLengthToParse){
                 var resultStartLength = this.result.length;
                 var separatorLength = 0;
                 for(var start = index, stopAt = index + maxLengthToParse; index < stopAt && index < str.length; index++){
                     var char = str.charAt(index)
                     if(!regDec.test(char)){
                         return false;
                     }
                     if(start == index && separator){
                         this.result += separator;
                         separatorLength = separator.length
                         separator = null;
                     }
                     this.result += char;
                 }
                 return (resultStartLength + maxLengthToParse + separatorLength) == this.result.length;
             }

             this.parseSeparator = function(separatorValue){
                 if(index < str.length && regSep.test(str.charAt(index))){
                     index++
                 }
                 separator = separatorValue;
             }

             this.parseCardinalDirection = function(regEx){
                 if(index < str.length && regEx.test(str.charAt(index))){
                     this.result += str.charAt(index).toUpperCase();
                     return true;
                 }
                 return false;
             }

             this.parsePosition = function(firstMaxLength, reg){
                 if(!this.parseNumbers(firstMaxLength)){
                     return this.result;
                 }
                 this.parseSeparator(" ");
                 if(!this.parseNumbers(2)){
                     return this.result;
                 }
                 this.parseSeparator(".");
                 if(!this.parseNumbers(3)){
                     return this.result;
                 }
                 this.parseCardinalDirection(reg);
                 return this.result;
             }
        }
        var service = {
            degreesToStrings: function(latLonObj){
                var result = clone(latLonObj);
                result.lat = formatLatitude(latLonObj.lat);
                result.lon = formatLongitude(latLonObj.lon);
                return result;
            },
            stringsToDegrees: function(latLonObj){
                var result = clone(latLonObj);
                result.lat = service.parseLatitude(latLonObj.lat);
                result.lon = service.parseLongitude(latLonObj.lon);
                return result;
            },
            parseLongitude : function(str){
                return embryo.position.parseLongitude(str);
            },
            parseLatitude : function(str){
                return embryo.position.parseLatitude(str);
            },
            parseLongitudeAsString : function(str){
                if(service.validateLongitude(str)){
                    return str;
                }
                var coordinateBuilder = new CoordinateBuilder(str);
                return coordinateBuilder.parsePosition(3, regWE);
            },
            parseLatitudeAsString : function(str){
                if(service.validateLatitude(str)){
                    return str;
                }
                var coordinateBuilder = new CoordinateBuilder(str);
                return coordinateBuilder.parsePosition(2, regNS);
            },
            validateLongitude : function(longitude) {
                return regLon.test(longitude);
            },
            validateLatitude : function(latitude) {
                return regLat.test(latitude);
            },
            stringsToPositions: function(latLonObj){
                var latLon = this.stringsToDegrees(latLonObj);
                return new embryo.geo.Position(latLon.lon, latLon.lat);
            }
        };
        return service;
    }]);

    function positionDirective2(name, parser, validator) {
        return {
            require : '^ngModel',
            restrict : 'A',
            link : function(scope, element, attr, ngModelController) {
                ngModelController.$formatters.push(function(modelValue) {
                    if (!modelValue) {
                        return null;
                    }
                    ngModelController.$setValidity(name, validator(modelValue));
                    return modelValue;
                });

                ngModelController.$parsers.push(function(valueFromInput) {
                    if(!valueFromInput){
                        return null;
                    }
                    var modelValue = parser(valueFromInput);
                    ngModelController.$setValidity(name, validator(modelValue));
                    ngModelController.$viewValue = modelValue;
                    ngModelController.$render();
                    return modelValue;
                });
/*
                element.bind('change', function(event) {
                    if (!ngModelController.$modelValue) {
                        ngModelController.$viewValue = null;
                    }
                    ngModelController.$viewValue = formatter(ngModelController.$modelValue);
                    ngModelController.$render();
                });
                */
            }
        };
    }

    module.directive('latitude', function() {
        return positionDirective(formatLatitude, embryo.position.parseLatitude);
    });

    module.directive('longitude', function() {
        return positionDirective(formatLongitude, embryo.position.parseLongitude);
    });


    module.directive('latitude2', ["PositionService", function(PositionService) {
        return positionDirective2('latitude', PositionService.parseLatitudeAsString, PositionService.validateLatitude);
    }]);

    module.directive('longitude2', ["PositionService", function(PositionService) {
        return positionDirective2('longitude', PositionService.parseLongitudeAsString, PositionService.validateLongitude);
    }]);

}());

