(function () {
    'use strict';

    angular
        .module('vrmt.map')

        /**
         * The map-tile-layer directive will add a simple tile layer to the map
         */
        .directive('mapTileLayer', mapTileLayer);

    function mapTileLayer() {
        return {
            restrict: 'E',
            replace: false,
            require: '^olMap',
            scope: {
                name: '@',
                visible: '=',
                source: '@',
                sourceProperties: '='
            },
            link: function (scope, element, attrs, ctrl) {
                var olScope = ctrl.getOpenlayersScope();
                var olLayer;

                olScope.getMap().then(function (map) {

                    scope.$on('$destroy', function () {
                        if (angular.isDefined(olLayer)) {
                            map.removeLayer(olLayer);
                        }
                    });

                    switch (scope.source) {
                        case 'MapQuest':
                            olLayer = new ol.layer.Tile({
                                title: scope.name,
                                source: new ol.source.MapQuest(scope.sourceProperties)
                            });
                            break;

                        case 'OSM':
                            olLayer = new ol.layer.Tile({
                                title: scope.name,
                                source: new ol.source.OSM()
                            });
                            break;

                        case 'WMS':
                            olLayer = new ol.layer.Tile({
                                title: scope.name,
                                source: new ol.source.TileWMS(scope.sourceProperties)
                            });
                            break;
                    }

                    // If the layer got created, add it
                    if (olLayer) {
                        olLayer.setVisible(scope.visible);
                        map.addLayer(olLayer);
                    }

                });

            }
        };
    }

})();