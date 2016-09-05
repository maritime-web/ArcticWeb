(function () {
    "use strict";

    var module = angular.module('embryo.sar.EffortStatus', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {};
    }
    // A way to create an enumeration like construction in JavaScript
    embryo.sar.effort.Status = Object.freeze({
        DraftSRU: "DS",
        DraftZone: "DZ",
        DraftPattern: "DP",
        DraftModifiedOnMap: "DM",
        Active: "A"
    });

    module.constant('EffortStatus', embryo.sar.effort.Status);
})();
