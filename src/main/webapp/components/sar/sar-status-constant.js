(function () {
    "use strict";

    var module = angular.module('embryo.sar.status', []);

    if(!embryo.sar){
        embryo.sar = {}
    }

    embryo.SARStatus = Object.freeze({
        STARTED: "S",
        DRAFT: "D",
        ENDED: "E",
        ARCHIVED: "A"
    });

    module.constant('SarStatus', embryo.SARStatus);
})();
