describe('embryo.sar.service', function () {
    beforeEach(function () {
        module('embryo.sar.type')
        module('embryo.sar.livePouch')
        module('embryo.sar.model');
        module('embryo.sar.service');
    });

    function execWithTryCatch(fn) {
        try {
            fn();
        } catch (Error) {
            return Error;
        }
        return null;
    }

    function assertErrorContent(err, fieldName) {
        expect(err).toBeDefined();
        expect(err.message).toBeDefined();
        expect(err.message.indexOf(fieldName) >= 0).toBe(true);
    }

/* describe('SurfaceDrift', function () {
        it('SurfaceDrift.build with one row', inject(function (SurfaceDrift) {
            var now = Date.now();

            var surfaceDrifts = [{ts : now - 7200, twcSpeed : 5, twcDirection: 90, leewaySpeed: 5, leewayDirection:0}]
            var searchObject = embryo.sar.searchObjectTypes[0];

            var drift = SurfaceDrift.build({
                lon : "010 00.000W",
                lat : "10 00.000N",
                ts : now - 60 * 60 * 1000
            }, now, surfaceDrifts, searchObject);

            expect(drift.currentPositions).toBeDefined();
            expect(drift.currentPositions.length).toBe(1);
            expect(drift.datumDownwindPositions).toBeDefined();
            expect(drift.datumDownwindPositions.length).toBe(1);
            expect(drift.datumMaxPositions).toBeDefined();
            expect(drift.datumMaxPositions.length).toBe(1);
            expect(drift.datumMinPositions).toBeDefined();
            expect(drift.datumMinPositions.length).toBe(1);

            expect(drift.datumDownwind).toBeDefined();
            expect(drift.datumDownwindPositions[0].lon).toBe(drift.datumDownwind.lon);
            expect(drift.datumDownwindPositions[0].lat).toBe(drift.datumDownwind.lat);

            expect(drift.datumMax).toBeDefined();
            expect(drift.datumMaxPositions[0].lon).toBe(drift.datumMax.lon);
            expect(drift.datumMaxPositions[0].lat).toBe(drift.datumMax.lat);

            expect(drift.datumMin).toBeDefined();
            expect(drift.datumMinPositions[0].lon).toBe(drift.datumMin.lon);
            expect(drift.datumMinPositions[0].lat).toBe(drift.datumMin.lat);
        }))
        it('SurfaceDrift.build with one row and "raft 4-6 persons" search object', inject(function (SurfaceDrift) {
            var now = Date.now();

            var surfaceDrifts = [{ts : now - 7200, twcSpeed : 5, twcDirection: 90, leewaySpeed: 5, leewayDirection:0}]
            var searchObject = embryo.sar.searchObjectTypes[1];

            var drift = SurfaceDrift.build({
                lon : "010 00.000W",
                lat : "10 00.000N",
                ts : now - 60 * 60 * 1000
            }, now, surfaceDrifts, searchObject);

            expect(drift.currentPositions).toBeDefined();
            expect(drift.currentPositions.length).toBe(1);
            expect(drift.datumDownwindPositions).toBeDefined();
            expect(drift.datumDownwindPositions.length).toBe(1);
            expect(drift.datumMaxPositions).toBeDefined();
            expect(drift.datumMaxPositions.length).toBe(1);
            expect(drift.datumMinPositions).toBeDefined();
            expect(drift.datumMinPositions.length).toBe(1);

            expect(drift.datumDownwind).toBeDefined();
            expect(drift.datumDownwindPositions[0].lon).toBe(drift.datumDownwind.lon);
            expect(drift.datumDownwindPositions[0].lat).toBe(drift.datumDownwind.lat);

            expect(drift.datumMax).toBeDefined();
            expect(drift.datumMaxPositions[0].lon).toBe(drift.datumMax.lon);
            expect(drift.datumMaxPositions[0].lat).toBe(drift.datumMax.lat);

            expect(drift.datumMin).toBeDefined();
            expect(drift.datumMinPositions[0].lon).toBe(drift.datumMin.lon);
            expect(drift.datumMinPositions[0].lat).toBe(drift.datumMin.lat);
        }))
    })*/
/*
    describe('DatumPointSearchAreaCalculator - integration test', function () {
        it('DatumPointSearchAreaCalculator.calculate', inject(function (DatumPointSearchAreaCalculator) {
            var min = {
                circle : {
                    datum : {
                        lon: "015 12.124W",
                        lat: "12 12.123N"
                    },
                    radius : 5
                }
            }
            var downwind = {
                circle : {
                    datum : {
                        lon: "014 12.124W",
                        lat: "11 12.123N"
                    },
                    radius : 4
                }
            }
            var max = {
                circle : {
                    datum : {
                        lon: "013 12.124W",
                        lat: "10 12.123N"
                    },
                    radius : 3
                }
            }
            var searchArea = DatumPointSearchAreaCalculator.calculate(min, max, downwind);

            expect(searchArea).toBeDefined();
            expect(typeof searchArea.size).toBe("number");
            expect(typeof searchArea.A).toBeDefined();
            expect(typeof searchArea.A.lon).toBe("string");
            expect(typeof searchArea.A.lat).toBe("string");
            expect(typeof searchArea.B).toBeDefined();
            expect(typeof searchArea.B.lon).toBe("string");
            expect(typeof searchArea.B.lat).toBe("string");
            expect(typeof searchArea.C).toBeDefined();
            expect(typeof searchArea.C.lon).toBe("string");
            expect(typeof searchArea.C.lat).toBe("string");
            expect(typeof searchArea.D).toBeDefined();
            expect(typeof searchArea.D.lon).toBe("string");
            expect(typeof searchArea.D.lat).toBe("string");
        }))
    })*/


    function createSarInputTestObject(service) {
        var searchObjectTypes = service.searchObjectTypes();
        return {
            sarNo: 1,
            type: embryo.sar.Operation.RapidResponse,
            lastKnownPosition: {
                ts: Date.now() - 60 * 60 * 1000,
                lon: "051 00.000W",
                lat: "61 00.000N"
            },
            startTs: Date.now(),
            surfaceDriftPoints: [{
                ts: Date.now() - 60 * 60 * 1000,
                twcSpeed: 5,
                twcDirection: 45,
                leewaySpeed: 15,
                leewayDirection: 30
            }],
            xError: 1,
            yError: 0.1,
            safetyFactor: 1,
            searchObject: searchObjectTypes[0].id
        }
    }

    /*
    describe('RapidResponseOutput integration test', function () {*/
        /**
         * This unit test has been produced to ensure the same result as when calculating rapid response SAR operations in the EPD project.
         * The unit test was first written in Java in the EPD project, just making assertion values fit what was actually calculated, and then
         * there after ported to JavaScript. This way it is ensured that the JavaScript SAR calculations at least behaves the same as the Java
         * version did at the time of the SAR operations was implemented.
         *
         * Produced SAR unit test: https://github.com/dma-enav/EPD/blob/master/epd-common/src/test/java/dk/dma/epd/common/prototype/model/voct/SarOperationTest.java
         * as testRapidResponseWithOneSurfarceDriftPoint()
         */
        /*
        it('create rapid response output from one surface drift point', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);

            var output = RapidResponseOutput.calculate(input);

            expect(output).toBeDefined();

            // ASSERT DATUM
            expect(output.circle.datum.lon).toBe("050 52.939W");
            expect(output.circle.datum.lat).toBe("61 03.328N");
            expect(output.circle.radius).toBeCloseTo(2.532634, 4);

            expect(output.rdv.direction).toBeCloseTo(45.780030, 4);
            expect(output.rdv.distance).toBeCloseTo(4.775445, 4);
            expect(output.rdv.speed).toBeCloseTo(4.775445, 4);

            expect(output.searchArea.A.lat).toBe("61 06.905N");
            expect(output.searchArea.A.lon).toBe("050 52.842W");

            expect(output.searchArea.B.lat).toBe("61 03.278N");
            expect(output.searchArea.B.lon).toBe("050 45.541W");

            expect(output.searchArea.C.lat).toBe("60 59.748N");
            expect(output.searchArea.C.lon).toBe("050 53.043W");

            expect(output.searchArea.D.lat).toBe("61 03.375N");
            expect(output.searchArea.D.lon).toBe("051 00.331W");
            expect(output.searchArea.size).toBeCloseTo(2.5326335063948107 * 2.5326335063948107 * 4, 4);
        }));
*/

        /**
         * This unit test has been produced to ensure the same result as when calculating rapid response SAR operations in the EPD project.
         * The unit test was first written in Java in the EPD project, just making assertion values fit what was actually calculated, and then
         * there after ported to JavaScript. This way it is ensured that the JavaScript SAR calculations at least behaves the same as the Java
         * version did at the time of the SAR operations was implemented.
         *
         * Produced SAR unit test: https://github.com/dma-enav/EPD/blob/master/epd-common/src/test/java/dk/dma/epd/common/prototype/model/voct/SarOperationTest.java
         * as testRapidResponseWithTwoSurfarceDriftPoint()
         */
/*
         it('create rapid response SAR operation with two surface drift points', inject(function (RapidResponseOutput, SarService) {
             var input = createSarInputTestObject(SarService);
             input.surfaceDriftPoints = [{
                        ts: Date.now() - 60 * 60 * 1000,
                        twcSpeed: 5,
                        twcDirection: 45,
                        leewaySpeed: 15,
                        leewayDirection: 30
                    }, {
                        ts: Date.now() - 30 * 60 * 1000,
                        twcSpeed: 8,
                        twcDirection: 35,
                        leewaySpeed: 10,
                        leewayDirection: 20
                    }];

             input.xError = 0.1;

             //var sarOperation = null;
             var output = RapidResponseOutput.calculate(input);
             expect(output).toBeDefined();

             // ASSERT DATUM
             expect(output.circle.datum.lat).toBe("61 04.854N");
             expect(output.circle.datum.lon).toBe("050 51.794W");
             expect(output.circle.radius).toBeCloseTo(1.374240, 4);

             expect(output.rdv.direction).toBeCloseTo(35.372815, 4);
             expect(output.rdv.distance).toBeCloseTo(3.914134, 4);
             expect(output.rdv.speed).toBeCloseTo(7.828269, 4);

             expect(output.searchArea.A.lat).toBe("61 06.769N");
             expect(output.searchArea.A.lon).toBe("050 52.467W");

             expect(output.searchArea.B.lat).toBe("61 05.179N");
             expect(output.searchArea.B.lon).toBe("050 47.833W");

             expect(output.searchArea.C.lat).toBe("61 02.939N");
             expect(output.searchArea.C.lon).toBe("050 51.124W");

             expect(output.searchArea.D.lat).toBe("61 04.529N");
             expect(output.searchArea.D.lon).toBe("050 55.753W");
             expect(output.searchArea.size).toBeCloseTo(1.3742403439070814 * 1.3742403439070814 * 4, 4);
         }));
        it('Error thrown if lastKnownPosition.ts has no value', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.lastKnownPosition.ts = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "ts");
        }));

        it('Error thrown if lastKnownPosition.lon has no value', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.lastKnownPosition.lon = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "lon");
        }));

        it('Error thrown if lastKnownPosition.lat has no value', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.lastKnownPosition.lat = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "lat");
        }));

        it('Error thrown if startTs has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.startTs = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            console.log(err);
            assertErrorContent(err, "commenceSearchStart");
        }));

        it('Error thrown if surfaceDriftPoint.ts has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.surfaceDriftPoints[0].ts = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "ts");
        }));

        it('Error thrown if surfaceDriftPoint.twcSpeed has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.surfaceDriftPoints[0].twcSpeed = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "twcSpeed");
        }));

        it('Error thrown if surfaceDriftPoint.twcDirection has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.surfaceDriftPoints[0].twcDirection = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "twcDirection");
        }));

        it('Error thrown if surfaceDriftPoint.leewaySpeed has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.surfaceDriftPoints[0].leewaySpeed = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "leewaySpeed");
        }));

        it('Error thrown if surfaceDriftPoint.leewayDirection has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.surfaceDriftPoints[0].leewayDirection = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "leewayDirection");
        }));

        it('Error thrown if xError has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.xError = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "xError");
        }));

        it('Error thrown if yError has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.yError = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "yError");
        }));

        it('Error thrown if safetyFactor has no value ', inject(function (RapidResponseOutput, SarService) {
            var input = createSarInputTestObject(SarService);
            input.safetyFactor = null;

            var err = execWithTryCatch(function(){
                RapidResponseOutput.calculate(input);
            })
            assertErrorContent(err, "safetyFactor");
        }));

    });
*/
    describe('DatumPointOutput integration test', function () {

        /**
         * This unit test has been produced to ensure the same result as when calculating rapid response SAR operations in the EPD project.
         * The unit test was first written in Java in the EPD project, just making assertion values fit what was actually calculated, and then
         * there after ported to JavaScript. This way it is ensured that the JavaScript SAR calculations at least behaves the same as the Java
         * version did at the time of the SAR operations was implemented.
         *
         * Produced SAR unit test: https://github.com/dma-enav/EPD/blob/master/epd-common/src/test/java/dk/dma/epd/common/prototype/model/voct/SarOperationTest.java
         * as testRapidResponseWithTwoSurfarceDriftPoint()
         *//*
        it('create datum point SAR operation with one surface drift point', inject(function (DatumPointOutput, SarService) {
            var searchObjectTypes = SarService.searchObjectTypes();

            var input = {
                sarNo: 1,
                type: embryo.sar.Operation.DatumPoint,
                lastKnownPosition: {
                    ts: Date.now() - 60 * 60 * 1000,
                    lon: "051 00.000W",
                    lat: "61 00.000N"
                },
                startTs: Date.now(),
                surfaceDriftPoints: [{
                    ts: Date.now() - 60 * 60 * 1000,
                    twcSpeed: 5,
                    twcDirection: 45,
                    leewaySpeed: 15,
                    leewayDirection: 30
                }],
                xError: 1.0,
                yError: 0.1,
                safetyFactor: 1.0,
                searchObject: searchObjectTypes[0].id
            }

            //var sarOperation = null;
            var output = DatumPointOutput.calculate(input);

            expect(output).toBeDefined();
            // ASSERT DATUM
            expect(output.downWind.circle.datum.lat).toBe("61 03.328N");
            expect(output.downWind.circle.datum.lon).toBe("050 52.939W");
            expect(output.downWind.circle.radius).toBeCloseTo(2.532633, 4);
            expect(output.downWind.rdv.direction).toBeCloseTo(45.780030, 4);
            expect(output.downWind.rdv.distance).toBeCloseTo(4.7754450, 4);
            expect(output.downWind.rdv.speed).toBeCloseTo(4.775445, 4);

            expect(output.max.circle.datum.lat).toBe("61 03.413N");
            expect(output.max.circle.datum.lon).toBe("050 53.115W");
            expect(output.max.circle.radius).toBeCloseTo(2.5325631, 4);
            expect(output.max.rdv.direction).toBeCloseTo(44.331598, 4);
            expect(output.max.rdv.distance).toBeCloseTo(4.7752103, 4);
            expect(output.max.rdv.speed).toBeCloseTo(4.7752103, 4);

            expect(output.min.circle.datum.lat).toBe("61 03.297N");
            expect(output.min.circle.datum.lon).toBe("050 52.699W");
            expect(output.min.circle.radius).toBeCloseTo(2.5515123, 4);
            expect(output.min.rdv.direction).toBeCloseTo(47.008245, 4);
            expect(output.min.rdv.distance).toBeCloseTo(4.8383743, 4);
            expect(output.min.rdv.speed).toBeCloseTo(4.8383743, 4);*/
            /*
             expect(formatLatitude(sarOperation.searchArea.A.lat)).toBe("60 59.801N");
             expect(formatLongitude(sarOperation.searchArea.A.lon)).toBe("050 50.788W");

             expect(formatLatitude(sarOperation.searchArea.B.lat)).toBe("61 02.460N");
             expect(formatLongitude(sarOperation.searchArea.B.lon)).toBe("051 00.292W");

             expect(formatLatitude(sarOperation.searchArea.C.lat)).toBe("61 06.878N");
             expect(formatLongitude(sarOperation.searchArea.C.lon)).toBe("050 55.017W");

             expect(formatLatitude(sarOperation.searchArea.D.lat)).toBe("61 04.229N");
             expect(formatLongitude(sarOperation.searchArea.D.lon)).toBe("050 45.497W");
             expect(sarOperation.searchArea.size).toBeCloseTo(1.3742403439070814 * 1.3742403439070814 * 4, 4);*/
        //}));
    });


    describe('DatumLineOutput integration test', function () {

        /**
         * Test the calculation succeeds with input values ana that search area is established.
         */
        /*
        it('create datum line SAR operation with two DSPs, each with the surface drift point values', inject(function (DatumLineOutput, SarService) {
            var searchObjectTypes = SarService.searchObjectTypes();

            var input = {
                sarNo: 1,
                type: embryo.sar.Operation.DatumLine,
                startTs: Date.now(),
                dsps : [
                    {
                        ts: Date.now() - 2 * 60 * 60 * 1000,
                        lon: "059 00.000W",
                        lat: "61 00.000N",
                        xError : 1,
                        surfaceDrifts: [{
                            ts: Date.now() - 60 * 60 * 1000,
                            twcSpeed: 5,
                            twcDirection: 45,
                            leewaySpeed: 15,
                            leewayDirection: 30
                        }],
                    },{
                        ts: Date.now() - 60 * 60 * 1000,
                        lon: "058 00.000W",
                        lat: "61 00.000N",
                        xError : 1,
                        reuseSurfaceDrifts : true
                    }
                ],
                yError: 0.1,
                safetyFactor: 1.0,
                searchObject: searchObjectTypes[0].id
            }

            //var sarOperation = null;
            var output = DatumLineOutput.calculate(input);

            expect(output).toBeDefined();
            expect(output.dsps).toBeDefined();
            expect(output.dsps.length).toBe(2);*/
            // ASSERT DATUM
/*            expect(output.downWind.circle.datum.lat).toBe("61 03.328N");
            expect(output.downWind.circle.datum.lon).toBe("050 52.939W");
            expect(output.downWind.circle.radius).toBeCloseTo(2.532633, 4);
            expect(output.downWind.rdv.direction).toBeCloseTo(45.780030, 4);
            expect(output.downWind.rdv.distance).toBeCloseTo(4.7754450, 4);
            expect(output.downWind.rdv.speed).toBeCloseTo(4.775445, 4);

            expect(output.max.circle.datum.lat).toBe("61 03.413N");
            expect(output.max.circle.datum.lon).toBe("050 53.115W");
            expect(output.max.circle.radius).toBeCloseTo(2.5325631, 4);
            expect(output.max.rdv.direction).toBeCloseTo(44.331598, 4);
            expect(output.max.rdv.distance).toBeCloseTo(4.7752103, 4);
            expect(output.max.rdv.speed).toBeCloseTo(4.7752103, 4);

            expect(output.min.circle.datum.lat).toBe("61 03.297N");
            expect(output.min.circle.datum.lon).toBe("050 52.699W");
            expect(output.min.circle.radius).toBeCloseTo(2.5515123, 4);
            expect(output.min.rdv.direction).toBeCloseTo(47.008245, 4);
            expect(output.min.rdv.distance).toBeCloseTo(4.8383743, 4);
            expect(output.min.rdv.speed).toBeCloseTo(4.8383743, 4);

             expect(formatLatitude(sarOperation.searchArea.A.lat)).toBe("60 59.801N");
             expect(formatLongitude(sarOperation.searchArea.A.lon)).toBe("050 50.788W");

             expect(formatLatitude(sarOperation.searchArea.B.lat)).toBe("61 02.460N");
             expect(formatLongitude(sarOperation.searchArea.B.lon)).toBe("051 00.292W");

             expect(formatLatitude(sarOperation.searchArea.C.lat)).toBe("61 06.878N");
             expect(formatLongitude(sarOperation.searchArea.C.lon)).toBe("050 55.017W");

             expect(formatLatitude(sarOperation.searchArea.D.lat)).toBe("61 04.229N");
             expect(formatLongitude(sarOperation.searchArea.D.lon)).toBe("050 45.497W");
             expect(sarOperation.searchArea.size).toBeCloseTo(1.3742403439070814 * 1.3742403439070814 * 4, 4);*/
        //}));
    });

    describe('DatumLineSearchAreaCalculator', function () {

        /**
         * Test the calculation succeeds with input values ana that search area is established.
         */
        /*
        it('create datum line SAR operation with two DSPs, each with the surface drift point values', inject(function (DatumLineSearchAreaCalculator, SearchCircle, Position) {
            var dsps = [{
                downWind : { circle : SearchCircle.create(1.5, Position.create("014 12.124W", "11 12.123N"))},
                min : { circle : SearchCircle.create(3, Position.create("015 12.124W", "12 12.123N"))},
                max : { circle : SearchCircle.create(2, Position.create("013 12.124W", "10 12.123N"))},
            },{
                downWind : { circle : SearchCircle.create(2.1, Position.create("018 12.124W", "11 12.123N"))},
                min : { circle : SearchCircle.create(3.2, Position.create("019 12.124W", "12 12.123N"))},
                max : { circle : SearchCircle.create(2.4, Position.create("017 12.124W", "10 12.123N"))}
            }]

            //var sarOperation = null;
            var area = DatumLineSearchAreaCalculator.calculate(dsps);

            expect(area).toBeDefined();
            //expect(output.dsps).toBeDefined();
            //expect(output.dsps.length).toBe(2);
            // ASSERT DATUM*/
            /*            expect(output.downWind.circle.datum.lat).toBe("61 03.328N");
             expect(output.downWind.circle.datum.lon).toBe("050 52.939W");
             expect(output.downWind.circle.radius).toBeCloseTo(2.532633, 4);
             expect(output.downWind.rdv.direction).toBeCloseTo(45.780030, 4);
             expect(output.downWind.rdv.distance).toBeCloseTo(4.7754450, 4);
             expect(output.downWind.rdv.speed).toBeCloseTo(4.775445, 4);

             expect(output.max.circle.datum.lat).toBe("61 03.413N");
             expect(output.max.circle.datum.lon).toBe("050 53.115W");
             expect(output.max.circle.radius).toBeCloseTo(2.5325631, 4);
             expect(output.max.rdv.direction).toBeCloseTo(44.331598, 4);
             expect(output.max.rdv.distance).toBeCloseTo(4.7752103, 4);
             expect(output.max.rdv.speed).toBeCloseTo(4.7752103, 4);

             expect(output.min.circle.datum.lat).toBe("61 03.297N");
             expect(output.min.circle.datum.lon).toBe("050 52.699W");
             expect(output.min.circle.radius).toBeCloseTo(2.5515123, 4);
             expect(output.min.rdv.direction).toBeCloseTo(47.008245, 4);
             expect(output.min.rdv.distance).toBeCloseTo(4.8383743, 4);
             expect(output.min.rdv.speed).toBeCloseTo(4.8383743, 4);

             expect(formatLatitude(sarOperation.searchArea.A.lat)).toBe("60 59.801N");
             expect(formatLongitude(sarOperation.searchArea.A.lon)).toBe("050 50.788W");

             expect(formatLatitude(sarOperation.searchArea.B.lat)).toBe("61 02.460N");
             expect(formatLongitude(sarOperation.searchArea.B.lon)).toBe("051 00.292W");

             expect(formatLatitude(sarOperation.searchArea.C.lat)).toBe("61 06.878N");
             expect(formatLongitude(sarOperation.searchArea.C.lon)).toBe("050 55.017W");

             expect(formatLatitude(sarOperation.searchArea.D.lat)).toBe("61 04.229N");
             expect(formatLongitude(sarOperation.searchArea.D.lon)).toBe("050 45.497W");
             expect(sarOperation.searchArea.size).toBeCloseTo(1.3742403439070814 * 1.3742403439070814 * 4, 4);*/
        //}));
    });


    /*
        function createTestRdv(increment){
            return {
                direction: 6 + increment,
                distance: 5 + increment,
                speed: 5 + increment
            }
        }
        function createTestDatum(increment){
            return {
                lon: -58 + increment,
                lat: 62 + increment
            }
        }
        function createCoordinator(name){
            return {
                name: name,
                _id: 62
            }
        }

        function createSarOutputTestObject(type) {
            var output = {
                searchArea: {
                    A: {
                        lon: -57,
                        lat: 63
                    },
                    B: {
                        lon: -57,
                        lat: 61
                    },
                    C: {
                        lon: -59,
                        lat: 61
                    },
                    D: {
                        lon: -59,
                        lat: 63
                    }
                }
            }

            if(type === embryo.sar.Operation.RapidResponse){
                output.radius = 2;
                output.datum = createTestDatum(0);
                output.rdv = createTestRdv(0);
            } else if (type === embryo.sar.Operation.DatumPoint){
                output.downWind = {
                    radius: 2,
                    datum: createTestDatum(1),
                    rdv: createTestRdv(1)
                };
                output.max = {
                    radius: 3,
                    datum: createTestDatum(2),
                    rdv: createTestRdv(2)
                };
                output.min = {
                    radius: 1,
                    datum: createTestDatum(0),
                    rdv: createTestRdv(0)
                }
            }
            return output;
        }

        function createSarTestObject(service, user, operationType) {
            var sar = {
                coordinator: createCoordinator(user),
                input: createSarInputTestObject(service),
                output: createSarOutputTestObject(operationType)
            }

            sar['@type'] = embryo.sar.Type.SearchArea;
            return sar;
        }
    */

/*


*/

/*

        it('prepareSearchAreaForDisplayal removes datum and RDV if user is not coordinator', function () {
            var searchArea = createSarTestObject(service, "Coordinator", embryo.sar.Operation.RapidResponse)

            var result = service.prepareSearchAreaForDisplayal(searchArea);

            expect(result).toBeDefined();
            expect(result.output).toBeDefined();
            expect(result.output.searchArea).toBeDefined();
            expect(result.output.datum).toBeUndefined();
            expect(result.output.radius).toBeUndefined();
            expect(result.output.rdv).toBeUndefined();
        });

        it('prepareSearchAreaForDisplayal removes downWind, min and max if user is not coordinator', function () {
            var searchArea = createSarTestObject(service, "Coordinator", embryo.sar.Operation.DatumPoint)

            var result = service.prepareSearchAreaForDisplayal(searchArea);

            expect(result).toBeDefined();
            expect(result.output).toBeDefined();
            expect(result.output.searchArea).toBeDefined();
            expect(result.output.downWind).toBeUndefined();
            expect(result.output.min).toBeUndefined();
            expect(result.output.max).toBeUndefined();
        });

        it('setUserAsCoordinator', function () {
            var sarOperation = createSarTestObject(service, "Coordinator", embryo.sar.Operation.DatumPoint)

            var user = {
                _id: 34,
                _rev: 134567,
                name : "JohnDoe",
                mmsi : 123456789
            }
            user['class'] = 'test.User'

            var result = service.setUserAsCoordinator(sarOperation, user);

            expect(result).toBeDefined();
            expect(result.coordinator).toBeDefined();
            expect(result.coordinator._id).toBe(34);
            expect(result.coordinator.name).toBe("JohnDoe");
            expect(result.coordinator.mmsi).toBe(123456789);
            expect(result.coordinator._rev).toBeUndefined();
            expect(result.coordinator['@class']).toBeUndefined();
        });
    });

    describe('SarService.prepareSearchAreaForDisplayal - failing', function () {
        beforeEach(function () {
            var mockSubject = {
                getDetails: function () {
                    return {
                        userName: "Coordinator"
                    };
                }
            };

            module('embryo.authentication.service', function ($provide) {
                $provide.value('Subject', mockSubject);
            });
            module('embryo.sar.service');
        });

        beforeEach(inject(function (SarService) {
            service = SarService;
        }));

        it('prepareSearchAreaForDisplayal maintains datum and RDV if user is coordinator', function () {
            var searchArea = createSarTestObject(service, "Coordinator", embryo.sar.Operation.RapidResponse)

            var result = service.prepareSearchAreaForDisplayal(searchArea);

            expect(result).toBeDefined();
            expect(result.output).toBeDefined();
            expect(result.output.searchArea).toBeDefined();
            expect(result.output.datum).toBeDefined();
            expect(result.output.radius).toBeDefined();
            expect(result.output.rdv).toBeDefined();
        });

        it('prepareSearchAreaForDisplayal maintains downWind, min and max if user is coordinator', function () {
            var searchArea = createSarTestObject(service, "Coordinator", embryo.sar.Operation.DatumPoint)

            var result = service.prepareSearchAreaForDisplayal(searchArea);

            expect(result).toBeDefined();
            expect(result.output).toBeDefined();
            expect(result.output.searchArea).toBeDefined();
            expect(result.output.downWind).toBeDefined();
            expect(result.output.min).toBeDefined();
            expect(result.output.max).toBeDefined();
        });

    });*/

    describe('EffortAllocationCalculation', function () {

        /**
         * Smaller vessel table is not used by the IAMSAR manual, but is however used in the SAR Danmark manual.
         * This test has been made to test if we get same results as in the EPD application, where search and rescue
         * logic has been coded towards the SAR Danmark II manual.
         */
         it('calculate effort allocation target of type SmallerVessel', inject(function (SarService) {
             var sar = {
                 "_id": "sar-1464776110350",
                 "@type": "SearchArea",
                 "input": {
                     "type": "rr",
                     "no": "AW-201653101445988",
                     "searchObject": 0,
                     "yError": 0.1,
                     "safetyFactor": 1,
                     "startTs": 1464779640000,
                     "lastKnownPosition": {
                         "ts": 1464776040000,
                         "lat": "61 00.000N",
                         "lon": "059 00.000W"
                     },
                     "xError": 1
                 },
                 "output": {
                     "timeElapsed": 1,
                     "hoursElapsed": 1,
                     "minutesElapsed": 0,
                     "rdv": {
                         "positions": [
                             {
                                 "lat": "61 00.000N",
                                 "lon": "059 00.000W"
                             },
                             {
                                 "lat": "61 09.955N",
                                 "lon": "058 57.934W"
                             }
                         ],
                         "distance": 10.011578383140293,
                         "direction": 5.72943244265133,
                         "validFor": 1,
                         "speed": 10.011578383140293
                     },
                     "circle": {
                         "radius": 2.54,
                         "datum": {
                             "lat": "61 04.769N",
                             "lon": "058 59.137W"
                         }
                     },
                     "searchArea": {
                         "size": 25.75,
                         "A": {
                             "lat": "61 07.514N",
                             "lon": "059 03.909W"
                         },
                         "B": {
                             "lat": "61 07.071N",
                             "lon": "058 53.450W"
                         },
                         "C": {
                             "lat": "61 02.020N",
                             "lon": "058 54.379W"
                         },
                         "D": {
                             "lat": "61 02.462N",
                             "lon": "059 04.810W"
                         }
                     }
                 },
             }

             var input = {
                 type : embryo.sar.effort.SruTypes.SmallerVessel,
                 target : embryo.sar.effort.TargetTypes.PersonInWater,
                 visibility : 3,
                 fatigue : 1,
                 wind : 5,
                 waterElevation : 5,
                 pod : 78,
                 time : 5,
                 speed : 5,
             };

             var result = SarService.calculateEffortAllocations(input, sar)

             expect(result).toBeDefined();

             expect(result.status).toBe(embryo.sar.effort.Status.DraftZone)
             expect(result.modified).toBeDefined()
             expect(result.S).toBeCloseTo(0.10)
             expect(result.area).toBeDefined();
             // EPD apparently has an error as the search endurance has not been taken into account
             // The EPD area size was calculated to 2.6, but should thus be 2.6 * 0.85
             expect(result.area.size).toBeCloseTo(2.6 *0.85);
             expect(result.area.A).toBeDefined()
             expect(result.area.B).toBeDefined()
             expect(result.area.C).toBeDefined()
             expect(result.area.D).toBeDefined()
         }));
    });

    describe('ParallelSweepSearchCalculator - SmallerVessel', function () {

        /**
         * Smaller vessel table is not used by the IAMSAR manual, but is however used in the SAR Danmark manual.
         * This test has been made to test if we get same results as in the EPD application, where search and rescue
         * logic has been coded towards the SAR Danmark II manual.
         */
        it('calculate search pattern', inject(function (Position, SarService) {
            var sar = {
                "_id": "sar-1464776110350",
                "@type": "SearchArea",
                "input": {
                    "type": "rr",
                    "no": "AW-201653101445988",
                    "searchObject": 0,
                    "yError": 0.1,
                    "safetyFactor": 1,
                    "startTs": 1464779640000,
                    "lastKnownPosition": {
                        "ts": 1464776040000,
                        "lat": "61 00.000N",
                        "lon": "059 00.000W"
                    },
                    "xError": 1
                },
                "output": {
                    "timeElapsed": 1,
                    "hoursElapsed": 1,
                    "minutesElapsed": 0,
                    "rdv": {
                        "positions": [
                            {
                                "lat": "61 00.000N",
                                "lon": "059 00.000W"
                            },
                            {
                                "lat": "61 09.955N",
                                "lon": "058 57.934W"
                            }
                        ],
                        "distance": 10.011578383140293,
                        "direction": 5.72943244265133,
                        "validFor": 1,
                        "speed": 10.011578383140293
                    },
                    "circle": {
                        "radius": 2.54,
                        "datum": {
                            "lat": "61 04.769N",
                            "lon": "058 59.137W"
                        }
                    },
                    "searchArea": {
                        "size": 25.75,
                        "A": {
                            "lat": "61 07.514N",
                            "lon": "059 03.909W"
                        },
                        "B": {
                            "lat": "61 07.071N",
                            "lon": "058 53.450W"
                        },
                        "C": {
                            "lat": "61 02.020N",
                            "lon": "058 54.379W"
                        },
                        "D": {
                            "lat": "61 02.462N",
                            "lon": "059 04.810W"
                        }
                    }
                },
            }

            var zone = {
                _id: "zoneId",
                sarId : "sarId",
                name : "JohnDoe",
                "type":"SV",
                "target":"PIW",
                "visibility":3,
                "fatigue":1,
                "wind":5,
                "waterElevation":5,
                "pod":78,
                "time":5,
                "speed":5,
                "S":0.10401895288308048,
                "area": {
                    "B":{"lat":"61 05.444N","lon":"058 57.475W"},
                    "A":{"lat":"61 05.573N","lon":"059 00.537W"},
                    "C":{"lat":"61 03.964N","lon":"058 57.739W"},
                    "D":{"lat":"61 04.093N","lon":"059 00.800W"},
                    "size":2.21040274876546
                },
                "status":"DZ",
                "modified":1467125733747
            };

            var sp = {
                type : embryo.sar.effort.SearchPattern.ParallelSweep,
                cornerKey : "A",
                csp : Position.create({
                    lat : 61.09194505332304,
                    lon : -59.007318235926604
                })
            };

            var result = SarService.generateSearchPattern(zone, sp)

            expect(result).toBeDefined();
            // TODO: write better expectation
            expect(result._id).toBeDefined();
            expect(result.sarId).toBe("sarId");
            expect(result.effId).toBe("zoneId");
            expect(result.name).toBe("JohnDoe");

        }));
    });
});