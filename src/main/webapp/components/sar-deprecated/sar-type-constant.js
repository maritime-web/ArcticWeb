(function () {
    "use strict";

    var module = angular.module('embryo.sar.type', []);

    if(!embryo.sar){
        embryo.sar = {}
    }

    // A way to create an enumeration like construction in JavaScript
    embryo.sar.Type = Object.freeze({
        "SearchArea": "SearchArea",
        "EffortAllocation": "Allocation",
        "SearchPattern": "Pattern",
        "Log": "SarLog"
    });

    module.constant('SarType', embryo.sar.Type);
})();
