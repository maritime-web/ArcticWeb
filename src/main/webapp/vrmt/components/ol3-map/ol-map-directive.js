(function () {
    'use strict';

    angular
        .module('vrmt.map')
        /**
         * Defines the parent ol-map directive.
         */
        .directive('olMap', olMap);

    olMap.$inject = ['$q', 'MapService'];

    function olMap($q, MapService) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            template: '<div class="map {{class}}" ng-transclude></div>',
            scope: {},

            controller: function ($scope) {
                var _map = $q.defer();

                $scope.getMap = function () {
                    return _map.promise;
                };

                $scope.setMap = function (map) {
                    _map.resolve(map);
                };

                this.getOpenlayersScope = function () {
                    return $scope;
                };
            },

            link: function (scope, element, attrs) {
                // Disable rotation on mobile devices
                var controls = ol.control.defaults({rotate: false});
                var interactions = ol.interaction.defaults({
                    altShiftDragRotate: true,
                    pinchRotate: true
                });
                var arcticExtent = ol.proj.transformExtent([-90, 33, 51, 90], 'EPSG:4326', 'EPSG:3857');
                var layers = [new ol.layer.Group({
                    'title': 'Base maps',
                    layers: [
                        new ol.layer.Tile({
                            title: 'OpenStreetMap',
                            type: 'base',
                            visible: true,
                            source: new ol.source.OSM()
                        })
                    ]
                })];
                var view = new ol.View({
                    zoom: 6,
                    minZoom: 4,
                    center: ol.proj.fromLonLat([-48, 64]),
                    extent: arcticExtent
                });
                var map = new ol.Map({
                    target: angular.element(element)[0],
                    layers: layers,
                    view: view,
                    controls: controls,
                    interactions: interactions
                });

                // Resolve the map object to the promises
                scope.setMap(map);
            }
        };
    }

})();