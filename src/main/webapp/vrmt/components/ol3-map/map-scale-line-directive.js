(function () {
    'use strict';

    angular.module('vrmt.map')
    /**
     * The map-scale-line directive will add a scale line to the map.
     */
        .directive('mapScaleLine', mapScaleLine);

    function mapScaleLine() {
            return {
                restrict: 'E',
                replace: true,
                require: '^openlayerParent',
                template:
                    "<span class='map-scale-line'></span>",
                scope: {
                    units    : '@',
                    minWidth : '='
                },
                link: function(scope, element, attrs, ctrl) {
                    var olScope     = ctrl.getOpenlayersScope();
                    var scaleLine   = new ol.control.ScaleLine({
                        className: 'ol-scale-line',
                        units: scope.units || 'nautical',
                        minWidth: scope.minWidth || 80,
                        target: angular.element(element)[0]
                    });

                    olScope.getMap().then(function(map) {

                        map.addControl(scaleLine);

                        // When destroyed, clean up
                        scope.$on('$destroy', function() {
                            map.removeControl(scaleLine);
                        });
                    });
                }
            };
        }

})();