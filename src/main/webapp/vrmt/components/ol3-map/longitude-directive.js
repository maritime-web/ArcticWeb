(function () {
    'use strict';

    angular
        .module('vrmt.map')
        /**
         * A longitude directive that may be used with an input field
         */
        .directive('longitude', longitude);
    function longitude() {
        return positionDirective('longitude', formatLongitude, parseLongitude);
    }

})();