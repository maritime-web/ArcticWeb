(function () {
    "use strict";

    var module = angular.module('embryo.sar.sruType', []);

    if(!embryo.sar){
        embryo.sar = {}
    }
    if(!embryo.sar.effort){
        embryo.sar.effort = {};
    }
    // A way to create an enumeration like construction in JavaScript
    embryo.sar.effort.SruTypes = Object.freeze({
        MerchantVessel: "MV",
        Helicopter150 : "HC150",
        Helicopter300 : "HC300",
        Helicopter600 : "HC600",
        FixedWingAircraft150 : "FWA150",
        FixedWingAircraft300 : "FWA300",
        FixedWingAircraft600 : "FWA600",
        SmallerVessel: "SV",
        Ship: "S"
    });

    module.constant('SruType', embryo.sar.effort.SruTypes);
})();
