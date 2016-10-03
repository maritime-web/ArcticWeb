(function () {
    "use strict";

    var module = angular.module('embryo.sar.DrawSearchPatternPredicate', []);

    module.factory('DrawSearchPatternPredicate', [function () {
        function DrawSearchPatternPredicate(idsOfOperationsToDraw) {
            this.idsOfOperationsToDraw = idsOfOperationsToDraw;
        }

        DrawSearchPatternPredicate.prototype.draw = function(doc){
            return doc['@type'] == embryo.sar.Type.SearchPattern && this.idsOfOperationsToDraw.indexOf(doc.sarId) >= 0
        }

        DrawSearchPatternPredicate.build = function(idsOfOperationsToDraw){
            return new DrawSearchPatternPredicate(idsOfOperationsToDraw)
        }

        return DrawSearchPatternPredicate;
    }]);
})();
