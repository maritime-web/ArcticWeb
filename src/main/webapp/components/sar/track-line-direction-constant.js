(function () {
    "use strict";

    var module = angular.module('embryo.sar.TrackLineDirection', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {}
    }

    // A way to create an enumeration like construction in JavaScript
    embryo.sar.effort.TrackLineDirection = Object.freeze({
        AsRoute: "R",
        OppositeRoute: "O"
    });

    module.constant('TrackLineDirection', embryo.sar.effort.TrackLineDirection);
})();
