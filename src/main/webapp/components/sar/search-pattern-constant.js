(function () {
    "use strict";

    var module = angular.module('embryo.sar.SearchPattern', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {};
    }

    // A way to create an enumeration like construction in JavaScript

    embryo.sar.effort.SearchPattern = Object.freeze({
        ParallelSweep: "PS",
        CreepingLine: "CL",
        TrackLineReturn: "TLR",
        TrackLineNonReturn: "TLNR",
        ExpandingSquare: "ES",
        SectorSearch: "SS"
    });

    module.constant('SearchPattern', embryo.sar.effort.SearchPattern);
})();
