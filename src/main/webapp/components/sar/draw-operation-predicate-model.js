(function () {
    "use strict";

    var module = angular.module('embryo.sar.DrawOperationPredicate', []);

    module.factory('DrawOperationPredicate', ['Subject', function (Subject) {
        function DrawOperationPredicate(mmsi, name) {
            this.name = name;
            this.mmsi = mmsi;
        }

        DrawOperationPredicate.prototype.draw = function(doc){
            return doc['@type'] === embryo.sar.Type.SearchArea && doc.status !== embryo.SARStatus.ARCHIVED
                && (doc.input.type != embryo.sar.Operation.BackTrack
                    || this.mmsi && doc.coordinator.mmsi == this.mmsi || doc.coordinator.name === this.name);
        }

        DrawOperationPredicate.build = function(){
            var mmsi = Subject.getDetails().shipMmsi;
            var name = Subject.getDetails().userName;
            return new DrawOperationPredicate(mmsi, name);
        }

        return DrawOperationPredicate;
    }]);
})();
