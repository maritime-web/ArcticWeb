(function () {
    'use strict';

    angular
        .module('vrmt.map')

        /**
         * A latitude directive that may be used with an input field
         */
        .directive('latitude', latitude);

    function latitude() {
        return positionDirective('latitude', formatLatitude, parseLatitude);
    }

})();