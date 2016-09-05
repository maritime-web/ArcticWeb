(function () {
    "use strict";

    var module = angular.module('embryo.sar.operation', []);

    if(!embryo.sar){
        embryo.sar = {}
    }

    // A way to create an enumeration like construction in JavaScript
    embryo.sar.Operation = Object.freeze({
        "RapidResponse": "rr",
        "DatumPoint": "dp",
        "DatumLine": "dl",
        "BackTrack": "bt",
        "TrackLine" : "tl"
    })
    module.constant('Operation', embryo.sar.Operation);
})();
