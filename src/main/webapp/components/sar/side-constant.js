(function () {
    "use strict";

    var module = angular.module('embryo.sar.Side', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {}
    }

    // A way to create an enumeration like construction in JavaScript
    embryo.sar.effort.Side = Object.freeze({
        Starboard: "S",
        Port: "P"
    });


    module.constant('Side', embryo.sar.effort.Side);
})();
