(function () {
    "use strict";

    var module = angular.module('embryo.sar.operation.filter', ['embryo.sar.operation']);

    module.filter('Operation', ['Operation', function(Operation) {
        var OperationTexts = {};
        OperationTexts[Operation.RapidResponse] = "Rapid response";
        OperationTexts[Operation.DatumPoint] = "Datum point";
        OperationTexts[Operation.DatumLine] = "Datum line";
        OperationTexts[Operation.BackTrack] = "Back track";
        OperationTexts[Operation.TrackLine] = "Track line";

        return function(input) {
            if(!input){
                return input;
            }
            return OperationTexts[input];
        };
    }]);
})();
