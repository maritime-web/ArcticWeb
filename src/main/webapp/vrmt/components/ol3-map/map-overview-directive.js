(function () {
    'use strict';

    angular.module('vrmt.map')
    /**
     * The map-overview adds an overview map to the map.
     */
        .directive('mapOverview', mapOverview);

    function mapOverview() {
            return {
                restrict: 'E',
                require: '^openlayerParent',
                scope: {
                    collapsed: '='
                },
                link: function(scope, element, attrs, ctrl) {
                    var olScope         = ctrl.getOpenlayersScope();
                    var overviewMap = new ol.control.OverviewMap({
                        className: 'ol-overviewmap ol-custom-overviewmap',
                        collapsed: scope.collapsed || false,
                        layers: [
                            new ol.layer.Tile({
                                source: new ol.source.OSM({ layer: 'sat' })
                            })
                        ],
                        collapseLabel: '-',
                        label: '+'
                    });

                    olScope.getMap().then(function(map) {
                        map.addControl(overviewMap);

                        // When destroyed, clean up
                        scope.$on('$destroy', function() {
                            map.removeControl(overviewMap);
                        });

                    });
                }
            };
        }

})();