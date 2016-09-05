(function () {
    "use strict";

    var module = angular.module('embryo.sar.SearchPattern.filter', ['embryo.sar.SearchPattern']);

    module.filter('SearchPattern', ['SearchPattern', function(SearchPattern) {
        var texts = {};
        texts[SearchPattern.CreepingLine] = "Creeping line search";
        texts[SearchPattern.ParallelSweep] = "Parallel sweep search";
        texts[SearchPattern.SectorSearch] = "Sector search";
        texts[SearchPattern.ExpandingSquare] = "Expanding square search";
        texts[SearchPattern.TrackLineNonReturn] = "Track line search, non-return";
        texts[SearchPattern.TrackLineReturn] = "Track line search, return";

        return function(input) {
            if(!input){
                return input;
            }
            return texts[input];
        };
    }]);
})();
