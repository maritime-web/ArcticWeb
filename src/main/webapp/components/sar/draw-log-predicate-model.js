(function () {
    "use strict";

    var module = angular.module('embryo.sar.DrawLogPredicate', []);

    module.factory('DrawLogPredicate', [function () {

        function DrawLogPredicate(idsOfOperationsToDraw) {
            this.idsOfOperationsToDraw = idsOfOperationsToDraw;
        }

        DrawLogPredicate.prototype.draw = function(doc){
            return doc['@type'] == embryo.sar.Type.Log && (typeof doc.lat) === "string" && typeof doc.lon === "string"
                && this.idsOfOperationsToDraw.indexOf(doc.sarId) >= 0;
        }

        DrawLogPredicate.build = function(idsOfOperationsToDraw){
            return new DrawLogPredicate(idsOfOperationsToDraw);
        }

        return DrawLogPredicate;
    }]);
})();
