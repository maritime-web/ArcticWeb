(function () {
    "use strict";

    var module = angular.module('embryo.sar.SearchPattern.filter', ['embryo.sar.SearchPattern']);

    module.filter('SearchPattern', ['SearchPattern', function(SearchPattern) {
        var texts = {};
        texts[SearchPattern.CreepingLine] = "Creeping line";
        texts[SearchPattern.ParallelSweep] = "Parallel sweep";
        texts[SearchPattern.SectorSearch] = "Sector";
        texts[SearchPattern.ExpandingSquare] = "Expanding square";
        texts[SearchPattern.TrackLineNonReturn] = "Track line, non-return";
        texts[SearchPattern.TrackLineReturn] = "Track line, return";

        return function(input) {
            if(!input){
                return input;
            }
            return texts[input];
        };
    }]);
})();
