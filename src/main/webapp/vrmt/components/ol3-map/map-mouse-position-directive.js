(function () {
    'use strict';

    angular.module('vrmt.map')

    /**
     * The map-mouse-position directive will add a current-mouse position panel the map.
     */
        .directive('mapMousePosition', mapMousePosition);

    mapMousePosition.$inject = ['MapService'];

    function mapMousePosition(MapService) {
        return {
            restrict: 'E',
            replace: true,
            require: '^olMap',
            template: "<div class='map-mouse-position'>{{currentPos | lonlat:{ decimals : 2, pp: true }  }}</div>",
            scope: {},
            link: function (scope, element, attrs, ctrl) {
                var olScope = ctrl.getOpenlayersScope();
                scope.currentPos = undefined;

                olScope.getMap().then(function (map) {

                    // Update the tooltip whenever the mouse is moved
                    map.on('pointermove', function (evt) {
                        var lonlat = MapService.toLonLat(evt.coordinate);
                        scope.currentPos = {lon: lonlat[0], lat: lonlat[1]};
                        scope.$$phase || scope.$apply();
                    });

                    $(map.getViewport()).on('mouseout', function () {
                        scope.currentPos = undefined;
                        scope.$$phase || scope.$apply();
                    });

                });
            }
        };
    }
})();