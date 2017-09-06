(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .directive('layerSwitcher', layerSwitcher);

    layerSwitcher.$inject = [];

    function layerSwitcher() {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: linkFn
        };

        function linkFn(scope, element, attrs, ctrl) {

        }
    }
})();