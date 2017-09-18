/**
 * Displays trusted content
 */
(function () {
    angular.module('embryo.nwnm')
        .filter('toTrusted', ['$sce', function ($sce) {
        return function (value) {
            return $sce.trustAsHtml(value);
        };
    }]);
})();