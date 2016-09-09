(function () {
    "use strict";

    var module = angular.module('embryo.sar.TargetTypes', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {};
    }
    // A way to create an enumeration like construction in JavaScript
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
        Sailboat26: "SB26",
        Sailboat30: "SB30",
        Sailboat39: "SB39",
        Sailboat40: "SB40",
        Sailboat49: "SB49",
        Sailboat50: "SB50",
        Sailboat69: "SB69",
        Sailboat70: "SB70",
        Sailboat83: "SB83",
        Ship120: "SH120",
        Ship225: "SH225",
        Ship330: "SH330",
        Ship90to150: "SH90",
        Ship150to300: "SH150",
        Ship300: "SH300",
        Boat17: "B17",
        Boat23: "B23",
        Boat40: "B40",
        Boat79: "B79"
    });

    module.constant('TargetTypes', embryo.sar.effort.TargetTypes);
})();
