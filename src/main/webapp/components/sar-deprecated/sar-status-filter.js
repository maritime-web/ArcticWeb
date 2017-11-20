(function () {
    "use strict";

    var module = angular.module('embryo.sar.status.filter', ['embryo.sar.status']);

    module.filter('SarStatus', ['SarStatus', function(SarStatus) {
        var texts = {};
        texts[SarStatus.STARTED] = "Active";
        texts[SarStatus.ENDED] = "Ended";
        texts[SarStatus.DRAFT] = "Draft";
        return function(input) {
            if(!input){
                return input;
            }
            return texts[input];
        };
    }]);
})();


