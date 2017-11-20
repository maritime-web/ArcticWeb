(function () {
    "use strict";

    var module = angular.module('embryo.sar.DrawSubAreaPredicate', []);

    module.factory('DrawSubAreaPredicate', [function () {
        function DrawSubAreaPredicate(idsOfOperationsToDraw) {
            this.idsOfOperationsToDraw = idsOfOperationsToDraw;
        }

        DrawSubAreaPredicate.prototype.draw = function(doc){
            return doc['@type'] == embryo.sar.Type.EffortAllocation && (
                doc.status == embryo.sar.effort.Status.Active ||
                doc.status == embryo.sar.effort.Status.DraftZone ||
                doc.status == embryo.sar.effort.Status.DraftModifiedOnMap) && this.idsOfOperationsToDraw.indexOf(doc.sarId) >= 0;
        }

        DrawSubAreaPredicate.build = function(idsOfOperationsToDraw){
            return new DrawSubAreaPredicate(idsOfOperationsToDraw)
        }

        return DrawSubAreaPredicate;
    }]);
})();
