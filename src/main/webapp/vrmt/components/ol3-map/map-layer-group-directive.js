(function () {
    'use strict';

    angular
        .module('vrmt.map')
        /**
         * The map-layer-group adds an entire layer group to the map
         */
        .directive('mapLayerGroup', mapLayerGroup);

    function mapLayerGroup() {
        return {
            restrict: 'E',
            replace: false,
            require: '^olMap',
            scope: {
                layerGroup: '='
            },
            link: function (scope, element, attrs, ctrl) {
                var olScope = ctrl.getOpenlayersScope();

                olScope.getMap().then(function (map) {

                    if (angular.isDefined(scope.layerGroup)) {
                        map.addLayer(scope.layerGroup);
                    }

                    scope.$on('$destroy', function () {
                        if (angular.isDefined(scope.layerGroup)) {
                            map.removeLayer(scope.layerGroup);
                        }
                    });
                });
            }
        };
    }

})();