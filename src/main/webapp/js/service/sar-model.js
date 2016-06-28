(function () {
    "use strict";

    var module = angular.module('embryo.sar.model', []);

    embryo.sar = {}
    // A way to create an enumeration like construction in JavaScript
    embryo.sar.Operation = Object.freeze({
        "RapidResponse": "rr",
        "DatumPoint": "dp",
        "DatumLine": "dl",
        "BackTrack": "bt"
    })

    embryo.sar.Type = Object.freeze({
        "SearchArea": "SearchArea",
        "EffortAllocation": "Allocation",
        "SearchPattern": "Pattern",
        "Log": "SarLog"
    })

    embryo.SARStatus = Object.freeze({
        STARTED: "S",
        ENDED: "E"
    });

    embryo.sar.effort = {};
    embryo.sar.effort.SruTypes = Object.freeze({
        MerchantVessel: "MV",
        Helicopter : "HC",
        FixedWingAircraft : "FWA",
        SmallerVessel: "SV",
        Ship: "S"
    });

    embryo.sar.effort.TargetTypes = Object.freeze({
        PersonInWater: "PIW",
        Raft1Person: "R1",
        Raft4Persons: "R4",
        Raft6Persons: "R6",
        Raft8Persons: "R8",
        Raft10Persons: "R10",
        Raft15Persons: "R15",
        Raft20Persons: "R20",
        Raft25Persons: "R25",
        Motorboat15: "M15",
        Motorboat20: "M20",
        Motorboat33: "M33",
        Motorboat53: "M53",
        Motorboat78: "M78",
        Sailboat15: "SB15",
        Sailboat20: "SB20",
        Sailboat25: "SB25",
        Sailboat30: "SB30",
        Sailboat40: "SB40",
        Sailboat50: "SB50",
        Sailboat70: "SB70",
        Sailboat83: "SB83",
        Ship120: "SH120",
        Ship225: "SH225",
        Ship330: "SH330",
        Boat17: "B17",
        Boat23: "B23",
        Boat40: "B40",
        Boat79: "B79"
    });

    embryo.sar.effort.Status = Object.freeze({
        DraftSRU: "DS",
        DraftZone: "DZ",
        DraftPattern: "DP",
        DraftModifiedOnMap: "DM",
        Active: "A"
    });

    embryo.sar.effort.SearchPattern = Object.freeze({
        ParallelSweep: "PS",
        CreepingLine: "CL",
        TrackLineReturn: "TLR",
        TrackLine: "TL",
        ExpandingSquare: "ES",
        SectorPattern: "SP"
    });


    function SearchObject(id, x, y, divergence, text) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.divergence = divergence;
        this.text = text;
    }

    SearchObject.prototype.leewaySpeed = function (leewaySpeed) {
        var result = this.x * leewaySpeed;
        if (this.y) {
            result += this.y;
        }
        return result;
    }

    var searchObjectTypes = [];
    searchObjectTypes.push(Object.freeze(new SearchObject(0, 0.011, 0.068, 30, "Person in water (PIW)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(1, 0.029, 0.039, 20, "Raft (4-6 person), unknown drift anker status")));
    searchObjectTypes.push(Object.freeze(new SearchObject(2, 0.018, 0.027, 16, "Raft (4-6 person) with drift anker")));
    searchObjectTypes.push(Object.freeze(new SearchObject(3, 0.038, -0.041, 20, "Raft (4-6 person) without drift anker")));
    searchObjectTypes.push(Object.freeze(new SearchObject(4, 0.036, -0.086, 14, "Raft (15-25 person), unknown drift anker status")));
    searchObjectTypes.push(Object.freeze(new SearchObject(5, 0.031, -0.070, 12, "Raft (15-25 person) with drift anker")));
    searchObjectTypes.push(Object.freeze(new SearchObject(6, 0.039, -0.060, 12, "Raft (15-25 person) without drift anker")));
    searchObjectTypes.push(Object.freeze(new SearchObject(7, 0.034, 0.040, 22, "Dinghy (Flat buttom)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(8, 0.030, 0.080, 15, "Dinghy (Keel)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(9, 0.017, undefined, 15, "Dinghy (Capsized)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(10, 0.011, 0.240, 15, "Kayak with Person")));
    searchObjectTypes.push(Object.freeze(new SearchObject(11, 0.020, undefined, 15, "Surfboard with Person")));
    searchObjectTypes.push(Object.freeze(new SearchObject(12, 0.023, 0.100, 12, "Windsurfer with Person. Mast and sail in water")));
    searchObjectTypes.push(Object.freeze(new SearchObject(13, 0.030, undefined, 48, "Sailboat (Long keel)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(14, 0.040, undefined, 48, "Sailboat (Fin keel)")));
    searchObjectTypes.push(Object.freeze(new SearchObject(15, 0.069, -0.080, 19, "Motorboat")));
    searchObjectTypes.push(Object.freeze(new SearchObject(16, 0.042, undefined, 48, "Fishing Vessel")));
    searchObjectTypes.push(Object.freeze(new SearchObject(17, 0.040, undefined, 33, "Trawler")));
    searchObjectTypes.push(Object.freeze(new SearchObject(18, 0.028, undefined, 48, "Coaster")));
    searchObjectTypes.push(Object.freeze(new SearchObject(19, 0.020, undefined, 10, "Wreckage")));
    embryo.sar.searchObjectTypes = searchObjectTypes;

    function Direction(name, degrees) {
        this.name = name;
        this.degrees = degrees;
    }

    var directions = [];
    directions.push(new Direction("N", 0));
    directions.push(new Direction("NNE", 22.5));
    directions.push(new Direction("NE", 45));
    directions.push(new Direction("ENE", 67.5));
    directions.push(new Direction("E", 90));
    directions.push(new Direction("ESE", 112.50));
    directions.push(new Direction("SE", 135.00));
    directions.push(new Direction("SSE", 157.50));
    directions.push(new Direction("S", 180.00));
    directions.push(new Direction("SSW", 202.50));
    directions.push(new Direction("SW", 225.00));
    directions.push(new Direction("WSW", 247.50));
    directions.push(new Direction("W", 270.00));
    directions.push(new Direction("WNW", 292.50));
    directions.push(new Direction("NW", 315.00));
    directions.push(new Direction("NNW", 337.50));
    embryo.sar.directions = Object.freeze(directions);


    embryo.sar.effort.createIamsarMerchantSweepWidths = function() {
        var sweepWidths = {};
        // Sweep values for visibilities 3, 5, 10, 15 and 20 are supplied in arrays indexed 0-4
        sweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = [0.4, 0.5, 0.6, 0.7, 0.7];
        sweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = [2.3, 3.2, 4.2, 4.9, 5.5];
        sweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = [2.5, 3.6, 5.0, 6.2, 6.9];
        sweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = [2.6, 4.0, 5.1, 6.4, 7.3];
        sweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = [2.7, 4.2, 5.2, 6.5, 7.5];
        sweepWidths[embryo.sar.effort.TargetTypes.Boat17] = [1.1, 1.4, 1.9, 2.1, 2.3];
        sweepWidths[embryo.sar.effort.TargetTypes.Boat23] = [2.0, 2.9, 4.3, 5.2, 5.8];
        sweepWidths[embryo.sar.effort.TargetTypes.Boat40] = [2.8, 4.5, 7.6, 9.4, 11.6];
        sweepWidths[embryo.sar.effort.TargetTypes.Boat79] = [3.2, 5.6, 10.7, 14.7, 18.1];
        return sweepWidths;
    }



    // TODO sweep widths values should be in own object?
    embryo.sar.effort.createSweepWidths = function() {
        var smallShipSweepWidths = {};
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = {
            1: 0.2,
            3: 0.2,
            5: 0.3,
            10: 0.3,
            15: 0.3,
            20: 0.3
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft1Person] = {
            1: 0.7,
            3: 1.3,
            5: 1.7,
            10: 2.3,
            15: 2.6,
            20: 2.7
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = {
            1: 0.7,
            3: 1.7,
            5: 2.2,
            10: 3.1,
            15: 3.5,
            20: 3.9
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = {
            1: 0.8,
            3: 1.9,
            5: 2.6,
            10: 3.6,
            15: 4.3,
            20: 4.7
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft8Persons] = {
            1: 0.8,
            3: 2.0,
            5: 2.7,
            10: 3.8,
            15: 4.4,
            20: 4.9
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft10Persons] = {
            1: 0.8,
            3: 2.0,
            5: 2.8,
            10: 4.0,
            15: 4.8,
            20: 5.3
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = {
            1: 0.9,
            3: 2.2,
            5: 3.0,
            10: 4.3,
            15: 5.1,
            20: 5.7
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft20Persons] = {
            1: 0.9,
            3: 2.3,
            5: 3.3,
            10: 4.9,
            15: 5.8,
            20: 6.5
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = {
            1: 0.9,
            3: 2.4,
            5: 3.9,
            10: 5.2,
            15: 6.3,
            20: 7.0
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat15] = {
            1: 0.4,
            3: 0.8,
            5: 1.1,
            10: 1.5,
            15: 1.6,
            20: 1.8
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat20] = {
            1: 0.8,
            3: 1.5,
            5: 2.2,
            10: 3.3,
            15: 4.0,
            20: 4.5
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat33] = {
            1: 0.8,
            3: 1.9,
            5: 2.9,
            10: 4.7,
            15: 5.9,
            20: 6.8
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat53] = {
            1: 0.9,
            3: 2.4,
            5: 3.9,
            10: 7.0,
            15: 9.3,
            20: 11.1
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat78] = {
            1: 0.9,
            3: 2.5,
            5: 4.3,
            10: 8.3,
            15: 11.4,
            20: 14.0
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat15] = {
            1: 0.8,
            3: 1.5,
            5: 2.1,
            10: 3.0,
            15: 3.6,
            20: 4.0
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat20] = {
            1: 0.8,
            3: 1.7,
            5: 2.5,
            10: 3.7,
            15: 4.6,
            20: 5.1
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat25] = {
            1: 0.9,
            3: 1.9,
            5: 2.8,
            10: 4.4,
            15: 5.4,
            20: 6.3
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat30] = {
            1: 0.9,
            3: 2.1,
            5: 3.2,
            10: 5.3,
            15: 6.6,
            20: 7.7
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat40] = {
            1: 0.9,
            3: 2.3,
            5: 3.8,
            10: 6.6,
            15: 8.6,
            20: 10.3
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat50] = {
            1: 0.9,
            3: 2.4,
            5: 4.0,
            10: 7.3,
            15: 9.7,
            20: 11.6
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat70] = {
            1: 0.9,
            3: 2.5,
            5: 4.2,
            10: 7.9,
            15: 10.7,
            20: 13.1
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat83] = {
            1: 0.9,
            3: 2.5,
            5: 4.4,
            10: 8.3,
            15: 11.6,
            20: 14.2
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship120] = {
            1: 1.4,
            3: 2.5,
            5: 4.6,
            10: 9.3,
            15: 13.2,
            20: 16.6
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship225] = {
            1: 1.4,
            3: 2.6,
            5: 4.9,
            10: 10.3,
            15: 15.5,
            20: 20.2
        };
        smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship330] = {
            1: 1.4,
            3: 2.6,
            5: 4.9,
            10: 10.9,
            15: 16.8,
            20: 22.5
        };

        var largeShipSweepWidths = {};
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = {
            1: 0.3,
            3: 0.4,
            5: 0.5,
            10: 0.5,
            15: 0.5,
            20: 0.5
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft1Person] = {
            1: 0.9,
            3: 1.8,
            5: 2.3,
            10: 3.1,
            15: 3.4,
            20: 3.7
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = {
            1: 1.0,
            3: 2.2,
            5: 3.0,
            10: 4.0,
            15: 4.6,
            20: 5.0
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = {
            1: 1.1,
            3: 2.5,
            5: 3.4,
            10: 4.7,
            15: 5.5,
            20: 6.0
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft8Persons] = {
            1: 1.1,
            3: 2.5,
            5: 3.5,
            10: 4.8,
            15: 5.7,
            20: 6.2
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft10Persons] = {
            1: 1.1,
            3: 2.6,
            5: 3.6,
            10: 5.1,
            15: 6.1,
            20: 6.7
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = {
            1: 1.1,
            3: 2.8,
            5: 3.8,
            10: 5.5,
            15: 6.5,
            20: 7.2
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft20Persons] = {
            1: 1.2,
            3: 3.0,
            5: 4.1,
            10: 6.1,
            15: 7.3,
            20: 8.1
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = {
            1: 1.2,
            3: 3.1,
            5: 4.3,
            10: 6.4,
            15: 7.8,
            20: 8.7
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat15] = {
            1: 0.5,
            3: 1.1,
            5: 1.4,
            10: 1.9,
            15: 2.1,
            20: 2.3
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat20] = {
            1: 1.0,
            3: 2.0,
            5: 2.9,
            10: 4.3,
            15: 5.2,
            20: 5.8
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat33] = {
            1: 1.1,
            3: 2.5,
            5: 3.8,
            10: 6.1,
            15: 7.7,
            20: 8.8
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat53] = {
            1: 1.2,
            3: 3.1,
            5: 5.1,
            10: 9.1,
            15: 12.1,
            20: 14.4
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat78] = {
            1: 1.2,
            3: 3.2,
            5: 5.6,
            10: 10.7,
            15: 14.7,
            20: 18.1
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat15] = {
            1: 1.0,
            3: 1.9,
            5: 2.7,
            10: 3.9,
            15: 4.7,
            20: 5.2
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat20] = {
            1: 1.0,
            3: 2.2,
            5: 3.2,
            10: 4.8,
            15: 5.9,
            20: 6.6
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat25] = {
            1: 1.1,
            3: 2.4,
            5: 3.6,
            10: 5.7,
            15: 7.0,
            20: 8.1
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat30] = {
            1: 1.1,
            3: 2.7,
            5: 4.1,
            10: 6.8,
            15: 8.6,
            20: 10.0
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat40] = {
            1: 1.2,
            3: 3.0,
            5: 4.9,
            10: 8.5,
            15: 11.2,
            20: 13.3
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat50] = {
            1: 1.2,
            3: 3.1,
            5: 5.2,
            10: 9.4,
            15: 12.5,
            20: 15.0
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat70] = {
            1: 1.2,
            3: 3.2,
            5: 5.5,
            10: 10.2,
            15: 13.9,
            20: 16.9
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat83] = {
            1: 1.2,
            3: 3.3,
            5: 5.7,
            10: 10.8,
            15: 15.0,
            20: 18.4
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship120] = {
            1: 1.8,
            3: 3.3,
            5: 6.0,
            10: 12.0,
            15: 17.1,
            20: 21.5
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship225] = {
            1: 1.8,
            3: 3.4,
            5: 6.3,
            10: 13.4,
            15: 20.1,
            20: 26.0
        };
        largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship330] = {
            1: 1.8,
            3: 3.4,
            5: 6.4,
            10: 14.1,
            15: 21.8,
            20: 29.2
        };

        var sweepWidths = {};
        sweepWidths[embryo.sar.effort.SruTypes.SmallerVessel] = smallShipSweepWidths;
        sweepWidths[embryo.sar.effort.SruTypes.Ship] = largeShipSweepWidths;
        return sweepWidths
    }

    module.service('SmallerVesselSweepWidths', [function () {
        function createSweepWidths() {
            var smallShipSweepWidths = {};
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = {
                1: 0.2,
                3: 0.2,
                5: 0.3,
                10: 0.3,
                15: 0.3,
                20: 0.3
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft1Person] = {
                1: 0.7,
                3: 1.3,
                5: 1.7,
                10: 2.3,
                15: 2.6,
                20: 2.7
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = {
                1: 0.7,
                3: 1.7,
                5: 2.2,
                10: 3.1,
                15: 3.5,
                20: 3.9
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = {
                1: 0.8,
                3: 1.9,
                5: 2.6,
                10: 3.6,
                15: 4.3,
                20: 4.7
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft8Persons] = {
                1: 0.8,
                3: 2.0,
                5: 2.7,
                10: 3.8,
                15: 4.4,
                20: 4.9
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft10Persons] = {
                1: 0.8,
                3: 2.0,
                5: 2.8,
                10: 4.0,
                15: 4.8,
                20: 5.3
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = {
                1: 0.9,
                3: 2.2,
                5: 3.0,
                10: 4.3,
                15: 5.1,
                20: 5.7
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft20Persons] = {
                1: 0.9,
                3: 2.3,
                5: 3.3,
                10: 4.9,
                15: 5.8,
                20: 6.5
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = {
                1: 0.9,
                3: 2.4,
                5: 3.9,
                10: 5.2,
                15: 6.3,
                20: 7.0
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat15] = {
                1: 0.4,
                3: 0.8,
                5: 1.1,
                10: 1.5,
                15: 1.6,
                20: 1.8
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat20] = {
                1: 0.8,
                3: 1.5,
                5: 2.2,
                10: 3.3,
                15: 4.0,
                20: 4.5
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat33] = {
                1: 0.8,
                3: 1.9,
                5: 2.9,
                10: 4.7,
                15: 5.9,
                20: 6.8
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat53] = {
                1: 0.9,
                3: 2.4,
                5: 3.9,
                10: 7.0,
                15: 9.3,
                20: 11.1
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat78] = {
                1: 0.9,
                3: 2.5,
                5: 4.3,
                10: 8.3,
                15: 11.4,
                20: 14.0
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat15] = {
                1: 0.8,
                3: 1.5,
                5: 2.1,
                10: 3.0,
                15: 3.6,
                20: 4.0
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat20] = {
                1: 0.8,
                3: 1.7,
                5: 2.5,
                10: 3.7,
                15: 4.6,
                20: 5.1
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat25] = {
                1: 0.9,
                3: 1.9,
                5: 2.8,
                10: 4.4,
                15: 5.4,
                20: 6.3
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat30] = {
                1: 0.9,
                3: 2.1,
                5: 3.2,
                10: 5.3,
                15: 6.6,
                20: 7.7
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat40] = {
                1: 0.9,
                3: 2.3,
                5: 3.8,
                10: 6.6,
                15: 8.6,
                20: 10.3
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat50] = {
                1: 0.9,
                3: 2.4,
                5: 4.0,
                10: 7.3,
                15: 9.7,
                20: 11.6
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat70] = {
                1: 0.9,
                3: 2.5,
                5: 4.2,
                10: 7.9,
                15: 10.7,
                20: 13.1
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat83] = {
                1: 0.9,
                3: 2.5,
                5: 4.4,
                10: 8.3,
                15: 11.6,
                20: 14.2
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship120] = {
                1: 1.4,
                3: 2.5,
                5: 4.6,
                10: 9.3,
                15: 13.2,
                20: 16.6
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship225] = {
                1: 1.4,
                3: 2.6,
                5: 4.9,
                10: 10.3,
                15: 15.5,
                20: 20.2
            };
            smallShipSweepWidths[embryo.sar.effort.TargetTypes.Ship330] = {
                1: 1.4,
                3: 2.6,
                5: 4.9,
                10: 10.9,
                15: 16.8,
                20: 22.5
            };
            return smallShipSweepWidths;
        }


        var service = {
            lookup : function(targetType, visibility){
                    return createSweepWidths()[targetType][visibility];
            },
            /**
             * returns possible sweep width values in nautical miles for a SRU type
             */
            visibilityOptions : function(){
                return [1, 3, 5, 10, 15, 20]
            },
            /**
             * returns search object types for a SRU type
             */
            searchObjectOptions : function(){
                Object.keys(createIamsarMerchantSweepWidths())
            }
        };

        return service;
    }]);


    module.service('SmallerVesselSweepWidths', [function () {
        function createSweepWidths() {
            var largeShipSweepWidths = {};
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = {
                1: 0.3,
                3: 0.4,
                5: 0.5,
                10: 0.5,
                15: 0.5,
                20: 0.5
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft1Person] = {
                1: 0.9,
                3: 1.8,
                5: 2.3,
                10: 3.1,
                15: 3.4,
                20: 3.7
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = {
                1: 1.0,
                3: 2.2,
                5: 3.0,
                10: 4.0,
                15: 4.6,
                20: 5.0
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = {
                1: 1.1,
                3: 2.5,
                5: 3.4,
                10: 4.7,
                15: 5.5,
                20: 6.0
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft8Persons] = {
                1: 1.1,
                3: 2.5,
                5: 3.5,
                10: 4.8,
                15: 5.7,
                20: 6.2
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft10Persons] = {
                1: 1.1,
                3: 2.6,
                5: 3.6,
                10: 5.1,
                15: 6.1,
                20: 6.7
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = {
                1: 1.1,
                3: 2.8,
                5: 3.8,
                10: 5.5,
                15: 6.5,
                20: 7.2
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft20Persons] = {
                1: 1.2,
                3: 3.0,
                5: 4.1,
                10: 6.1,
                15: 7.3,
                20: 8.1
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = {
                1: 1.2,
                3: 3.1,
                5: 4.3,
                10: 6.4,
                15: 7.8,
                20: 8.7
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat15] = {
                1: 0.5,
                3: 1.1,
                5: 1.4,
                10: 1.9,
                15: 2.1,
                20: 2.3
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat20] = {
                1: 1.0,
                3: 2.0,
                5: 2.9,
                10: 4.3,
                15: 5.2,
                20: 5.8
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat33] = {
                1: 1.1,
                3: 2.5,
                5: 3.8,
                10: 6.1,
                15: 7.7,
                20: 8.8
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat53] = {
                1: 1.2,
                3: 3.1,
                5: 5.1,
                10: 9.1,
                15: 12.1,
                20: 14.4
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Motorboat78] = {
                1: 1.2,
                3: 3.2,
                5: 5.6,
                10: 10.7,
                15: 14.7,
                20: 18.1
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat15] = {
                1: 1.0,
                3: 1.9,
                5: 2.7,
                10: 3.9,
                15: 4.7,
                20: 5.2
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat20] = {
                1: 1.0,
                3: 2.2,
                5: 3.2,
                10: 4.8,
                15: 5.9,
                20: 6.6
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat25] = {
                1: 1.1,
                3: 2.4,
                5: 3.6,
                10: 5.7,
                15: 7.0,
                20: 8.1
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat30] = {
                1: 1.1,
                3: 2.7,
                5: 4.1,
                10: 6.8,
                15: 8.6,
                20: 10.0
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat40] = {
                1: 1.2,
                3: 3.0,
                5: 4.9,
                10: 8.5,
                15: 11.2,
                20: 13.3
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat50] = {
                1: 1.2,
                3: 3.1,
                5: 5.2,
                10: 9.4,
                15: 12.5,
                20: 15.0
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat70] = {
                1: 1.2,
                3: 3.2,
                5: 5.5,
                10: 10.2,
                15: 13.9,
                20: 16.9
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Sailboat83] = {
                1: 1.2,
                3: 3.3,
                5: 5.7,
                10: 10.8,
                15: 15.0,
                20: 18.4
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship120] = {
                1: 1.8,
                3: 3.3,
                5: 6.0,
                10: 12.0,
                15: 17.1,
                20: 21.5
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship225] = {
                1: 1.8,
                3: 3.4,
                5: 6.3,
                10: 13.4,
                15: 20.1,
                20: 26.0
            };
            largeShipSweepWidths[embryo.sar.effort.TargetTypes.Ship330] = {
                1: 1.8,
                3: 3.4,
                5: 6.4,
                10: 14.1,
                15: 21.8,
                20: 29.2
            };
            return largeShipSweepWidths;
        }

        var service = {
            lookup : function(targetType, visibility){
                return createSweepWidths()[targetType][visibility];
            },
            /**
             * returns possible sweep width values in nautical miles for a SRU type
             */
            visibilityOptions : function(){
                return [1, 3, 5, 10, 15, 20]
            },
            /**
             * returns search object types for a SRU type
             */
            searchObjectOptions : function(){
                Object.keys(createSweepWidths())
            }
        };

        return service;
    }]);

    module.service('MerchantSweepWidths', [function () {
        function createIamsarMerchantSweepWidths () {
            var sweepWidths = {};
            // Sweep values for visibilities 3, 5, 10, 15 and 20 are supplied in arrays indexed 0-4
            sweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = [0.4, 0.5, 0.6, 0.7, 0.7];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = [2.3, 3.2, 4.2, 4.9, 5.5];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = [2.5, 3.6, 5.0, 6.2, 6.9];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = [2.6, 4.0, 5.1, 6.4, 7.3];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = [2.7, 4.2, 5.2, 6.5, 7.5];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat17] = [1.1, 1.4, 1.9, 2.1, 2.3];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat23] = [2.0, 2.9, 4.3, 5.2, 5.8];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat40] = [2.8, 4.5, 7.6, 9.4, 11.6];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat79] = [3.2, 5.6, 10.7, 14.7, 18.1];
            return sweepWidths;
        }

        var service = {
            lookup : function(targetType, visibility){
                return createIamsarMerchantSweepWidths()[targetType][Math.floor(visibility / 5)];
            },
            /**
             * returns possible sweep width values in nautical miles for a SRU type
             */
            visibilityOptions : function(){
                return [3, 5, 10, 15, 20]
            },
            /**
             * returns search object types for a SRU type
             */
            searchObjectOptions : function(){
                Object.keys(createIamsarMerchantSweepWidths())
            }
        };

        return service;
    }]);

    module.service('MerchantSweepWidths', [function () {
        function createIamsarMerchantSweepWidths () {
            var sweepWidths = {};
            // Sweep values for visibilities 3, 5, 10, 15 and 20 are supplied in arrays indexed 0-4
            sweepWidths[embryo.sar.effort.TargetTypes.PersonInWater] = [0.4, 0.5, 0.6, 0.7, 0.7];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft4Persons] = [2.3, 3.2, 4.2, 4.9, 5.5];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft6Persons] = [2.5, 3.6, 5.0, 6.2, 6.9];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft15Persons] = [2.6, 4.0, 5.1, 6.4, 7.3];
            sweepWidths[embryo.sar.effort.TargetTypes.Raft25Persons] = [2.7, 4.2, 5.2, 6.5, 7.5];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat17] = [1.1, 1.4, 1.9, 2.1, 2.3];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat23] = [2.0, 2.9, 4.3, 5.2, 5.8];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat40] = [2.8, 4.5, 7.6, 9.4, 11.6];
            sweepWidths[embryo.sar.effort.TargetTypes.Boat79] = [3.2, 5.6, 10.7, 14.7, 18.1];
            return sweepWidths;
        }

        var service = {
            lookup : function(targetType, visibility){
                return createIamsarMerchantSweepWidths()[targetType][Math.floor(visibility / 5)];
            },
            /**
             * returns possible sweep width values in nautical miles for a SRU type
             */
            visibilityOptions : function(){
                return [3, 5, 10, 15, 20]
            },
            /**
             * returns search object types for a SRU type
             */
            searchObjectOptions : function(){
                Object.keys(createIamsarMerchantSweepWidths())
            }
        };

        return service;
    }]);

    module.service('SweepWidthsFactory', ['MerchantSweepWidths', function (MerchantSweepWidths) {
        var service = {
            lookupSweepWidth : function(sruType){
                if (sruType === embryo.sar.effort.SruTypes.MerchantVessel) {
                    return embryo.sar.effort.createIamsarMerchantSweepWidths()[targetType][Math.floor(visibility / 5)];
                }


                if (sruType === embryo.sar.effort.SruTypes.SmallerVessel || sruType === embryo.sar.effort.SruTypes.Ship) {
                    return embryo.sar.effort.createSweepWidths()[sruType][targetType][visibility];
                }
            },

            /**
             * returns possible sweep width values in nautical miles for a SRU type
             */
            visibilityOptions : function(sruType){
                if (sruType === embryo.sar.effort.SruTypes.MerchantVessel) {
                    return [3, 5, 10, 15, 20]
                }

                //sruType === embryo.sar.effort.SruTypes.FixedWingAircraft || sruType === embryo.sar.effort.SruTypes.Helicopter
                return [1, 3, 5, 10, 15, 20]
            },
            /**
             * returns search object types for a SRU type
             */
            searchObjectOptions : function(sruType){
                var TargetTypes = embryo.sar.effort.TargetTypes;

                //sruType === embryo.sar.effort.SruTypes.FixedWingAircraft || sruType === embryo.sar.effort.SruTypes.Helicopter
                return [1, 3, 5, 10, 15, 20]
            }

        };

        return service;
    }]);

})();
