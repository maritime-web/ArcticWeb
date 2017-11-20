describe('PositionService', function() {

    var service;
    beforeEach(function () {
        module('embryo.position');
    });

    beforeEach(inject(function (PositionService) {
        service = PositionService;
    }));
    describe('validateLongitude', function() {
        it('validateLongitude evaluates "058 10.400W" to true', function() {
            expect(service.validateLongitude('058 10.400W')).toBeTruthy();
        });

        it('validateLongitude evaluates "058.10.400W" to false', function() {
            expect(service.validateLongitude('058.10.400W')).toBeFalsy();
        });

        it('validateLongitude evaluates "058 10 400W" to false', function() {
            expect(service.validateLongitude('058 10 400W')).toBeFalsy();
        });

        it('validateLongitude evaluates "05810.400W" to false', function() {
            expect(service.validateLongitude('05810.400W')).toBeFalsy();
        });

        it('validateLongitude evaluates "058.10400W" to false', function() {
            expect(service.validateLongitude('058.10400W')).toBeFalsy();
        });

        it('validateLongitude evaluates "05810400W" to false', function() {
            expect(service.validateLongitude('05810400W')).toBeFalsy();
        });

        it('validateLongitude evaluates "058 10.400w" to false', function() {
            expect(service.validateLongitude('058 10.400w')).toBeFalsy();
        });

        it('validateLongitude evaluates "012 09.123E" to true', function() {
            expect(service.validateLongitude('012 09.123E')).toBeTruthy();
        });

        it('validateLongitude evaluates "012 09.123e" to false', function() {
            expect(service.validateLongitude('012 09.123e')).toBeFalsy();
        });

        it('validateLongitude evaluates "012 09.123e" to false', function() {
            expect(service.validateLongitude('012 09.123e')).toBeFalsy();
        });

        it('validateLongitude evaluates "212 09.123E" to false', function() {
            expect(service.validateLongitude('212 09.123E')).toBeFalsy();
        });
        it('validateLongitude evaluates "180 09.123E" to false', function() {
            expect(service.validateLongitude('180 09.123E')).toBeFalsy();
        });

        it('validateLongitude evaluates "179 09.123E" to true', function() {
            expect(service.validateLongitude('179 09.123E')).toBeTruthy();
        });

        it('validateLongitude evaluates "180 00.001E" to false', function() {
            expect(service.validateLongitude('180 00.001E')).toBeFalsy();
        });

        it('validateLongitude evaluates "180 00.000E" to true', function() {
            expect(service.validateLongitude('180 00.000E')).toBeTruthy();
        });

        //TODO write more test
    });

    describe('validateLatitude', function() {
        it('validateLatitude evaluates "61 11.124S" to true', function() {
            expect(service.validateLatitude('61 11.124S')).toBeTruthy();
        });

        it('validateLatitude evaluates "61 11.124S" to true', function() {
            expect(service.validateLatitude('61 11.124S')).toBeTruthy();
        });

        it('validateLatitude evaluates "90 00.000S" to true', function() {
            expect(service.validateLatitude('90 00.000S')).toBeTruthy();
        });

        it('validateLatitude evaluates "90 00.000N" to true', function() {
            expect(service.validateLatitude('90 00.000N')).toBeTruthy();
        });

        it('validateLatitude evaluates "91 11.124S" to false', function() {
            expect(service.validateLatitude('91 11.124S')).toBeFalsy();
        });

        it('validateLatitude evaluates "90 00.001S" to false', function() {
            expect(service.validateLatitude('90 00.001S')).toBeFalsy();
        });

        it('validateLatitude evaluates "89 99.999S" to false', function() {
            expect(service.validateLatitude('90 00.001S')).toBeFalsy();
        });

        it('validateLatitude evaluates "90 00.000W" to false', function() {
            expect(service.validateLatitude('90 00.000W')).toBeFalsy();
        });

        it('validateLatitude evaluates "061 11.124S" to false', function() {
            expect(service.validateLatitude('061 11.124S')).toBeFalsy();
        });

        it('validateLatitude evaluates "061 11.124Sasfdfasdfd" to false', function() {
            expect(service.validateLatitude('061 11.124Sasfdfasdfd')).toBeFalsy();
        });

        it('validateLatitude evaluates "061 11.124S1" to false', function() {
            expect(service.validateLatitude('"061 11.124S1')).toBeFalsy();
        });

        it('validateLatitude evaluates "061 11.124SN" to false', function() {
            expect(service.validateLatitude('061 11.124SN')).toBeFalsy();
        });

    });

    describe('parseLongitudeAsString', function() {
        it('parseLongitudeAsString parses the string 058 10.400W to the same value', function() {
            var lon = service.parseLongitudeAsString('058 10.400W');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 05810.400W to "058 10.400W"', function() {
            var lon = service.parseLongitudeAsString('05810.400W');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 058 10400W to "058 10.400W"', function() {
            var lon = service.parseLongitudeAsString('058 10400W');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 05810400W to "058 10.400W"', function() {
            var lon = service.parseLongitudeAsString('05810400W');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 05810400w to "058 10.400W"', function() {
            var lon = service.parseLongitudeAsString('05810400w');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 058a10400w to "058"', function() {
            var lon = service.parseLongitudeAsString('058a10400w');
            expect(lon).toBe("058 10.400W");
        });

        it('parseLongitudeAsString parses the string 05a10400w to "05"', function() {
            var lon = service.parseLongitudeAsString('05a10400w');
            expect(lon).toBe("051 04.00W");
        });

        it('parseLongitudeAsString parses the string 05 10400w to "05"', function() {
            var lon = service.parseLongitudeAsString('05 10400w');
            expect(lon).toBe("051 04.00W");
        });

        it('parseLongitudeAsString parses the string 0581 to "058 1"', function() {
            var lon = service.parseLongitudeAsString('0581');
            expect(lon).toBe("058 1");
        });

        it('parseLongitudeAsString parses the string 0 to "0"', function() {
            var lon = service.parseLongitudeAsString('0');
            expect(lon).toBe("0");
        });

        it('parseLongitudeAsString parses the string 05 to "05"', function() {
            var lon = service.parseLongitudeAsString('05');
            expect(lon).toBe("05");
        });

        it('parseLongitudeAsString parses the string 05812 to "058 12"', function() {
            var lon = service.parseLongitudeAsString('05812');
            expect(lon).toBe("058 12");
        });

        it('parseLongitudeAsString parses the string 058123 to "058 12.3"', function() {
            var lon = service.parseLongitudeAsString('058123');
            expect(lon).toBe("058 12.3");
        });
    });
    describe('parseLatitudeAsString', function() {
        it('parseLatitudeAsString parses the string 61 10.312N to the same value', function() {
            expect(service.parseLatitudeAsString('61 10.312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 061 10.312N to "06 1"', function() {
            expect(service.parseLatitudeAsString('061 10.312N')).toBe("06 11.0312N");
        });

        it('parseLatitudeAsStringAsString parses the string 6110312N to "61 10.312N"', function() {
            expect(service.parseLatitudeAsString('6110312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 61.10312N to "61 10.312N"', function() {
            expect(service.parseLatitudeAsString('61.10312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 61.10.312N to "61 10.312N"', function() {
            expect(service.parseLatitudeAsString('61.10.312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 61.10 312N to "61 10.312N"', function() {
            expect(service.parseLatitudeAsString('61.10 312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 61 10 312N to "61 10.312N"', function() {
            expect(service.parseLatitudeAsString('61 10 312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 61 103.12N to "61 10"', function() {
            expect(service.parseLatitudeAsString('61 103.12N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsStringAsString parses the string 6 110.312N to ""', function() {
            expect(service.parseLatitudeAsString('6 110 312N')).toBe("61 10.312N");
        });

        it('parseLatitudeAsString parses the string 058 10.400W to "05 8"', function() {
            expect(service.parseLatitudeAsString('058 10.400W')).toBe("05 81.0400");
        });
    });

});