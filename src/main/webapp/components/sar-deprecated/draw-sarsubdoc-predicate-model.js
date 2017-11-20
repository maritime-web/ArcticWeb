(function () {
    "use strict";

    var module = angular.module('embryo.sar.DrawSarSubDocPredicate', ['embryo.sar.DrawSubAreaPredicate', 'embryo.sar.DrawSearchPatternPredicate','embryo.sar.DrawLogPredicate']);

    module.factory('DrawSarSubDocPredicate', ['DrawSubAreaPredicate', 'DrawSearchPatternPredicate', 'DrawLogPredicate',
        function (DrawSubAreaPredicate, DrawSearchPatternPredicate, DrawLogPredicate) {

            function DrawSarSubDocPredicate(idsOfOperationsToDraw) {
            this.DrawSubAreaPredicate = DrawSubAreaPredicate.build(idsOfOperationsToDraw);
            this.DrawSearchPatternPredicate = DrawSearchPatternPredicate.build(idsOfOperationsToDraw);
            this.DrawLogPredicate = DrawLogPredicate.build(idsOfOperationsToDraw);
        }

        DrawSarSubDocPredicate.prototype.draw = function(doc) {
            return this.DrawSubAreaPredicate.draw(doc) || this.DrawSearchPatternPredicate.draw(doc)
                || this.DrawLogPredicate.draw(doc);
        }

        DrawSarSubDocPredicate.build = function(idsOfOperationsToDraw) {
            return new DrawSarSubDocPredicate(idsOfOperationsToDraw);
        }

        return DrawSarSubDocPredicate;
    }]);
})();
