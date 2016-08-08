(function () {
    'use strict';

    angular
        .module('vrmt.map')
        /**
         * Defines the parent ol-map directive.
         */
        .directive('olMap', olMap);

    olMap.$inject = ['$rootScope', '$q', '$timeout', 'MapService'];

    function olMap($rootScope, $q, $timeout, MapService) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            template: '<div class="map {{class}}" ng-transclude></div>',
            scope: {
                mapState: '=',
                readonly: '='
            },

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
                var isDefined = angular.isDefined;
                var updateSizeTimer;


                // Clean-up
                element.on('$destroy', function () {
                    if (isDefined(updateSizeTimer)) {
                        $timeout.cancel(updateSizeTimer);
                        updateSizeTimer = null;
                    }
                });


                // Set width and height if they are defined
                if (isDefined(attrs.width)) {
                    if (isNaN(attrs.width)) {
                        element.css('width', attrs.width);
                    } else {
                        element.css('width', attrs.width + 'px');
                    }
                }


                if (isDefined(attrs.height)) {
                    if (isNaN(attrs.height)) {
                        element.css('height', attrs.height);
                    } else {
                        element.css('height', attrs.height + 'px');
                    }
                }


                // Disable rotation on mobile devices
                var controls = scope.readonly ? [] : ol.control.defaults({rotate: false});
                var interactions = scope.readonly ? [] : ol.interaction.defaults({
                    altShiftDragRotate: true,
                    pinchRotate: true
                });
                var arcticExtent = ol.proj.transformExtent([-90, 33, 51, 90], 'EPSG:4326', 'EPSG:3857');
                var layers = [];
                var view = new ol.View({
                    zoom: 5,
                    minZoom: 4,
                    extent: arcticExtent
                });
                var map = new ol.Map({
                    target: angular.element(element)[0],
                    layers: layers,
                    view: view,
                    controls: controls,
                    interactions: interactions
                });


                // Set extent (center and zoom) of the map.
                scope.updateMapExtent = function (initial) {
                    // Default values
                    var center = MapService.defaultCenterLonLat();
                    var zoom = MapService.defaultZoomLevel();

                    // Check if the center is defined in the directive attributes or in the mapState
                    if (initial && isDefined(attrs.lat) && isDefined(attrs.lon)) {
                        center = [parseFloat(attrs.lon), parseFloat(attrs.lat)];
                    } else if (isDefined(scope.mapState) && isDefined(scope.mapState.center)) {
                        center = scope.mapState.center;
                    }

                    // Check if the zoom is defined in the directive attributes or in the mapState
                    if (initial && isDefined(attrs.zoom)) {
                        zoom = parseFloat(attrs.zoom);
                    } else if (isDefined(scope.mapState) && isDefined(scope.mapState.zoom)) {
                        zoom = scope.mapState.zoom;
                    }

                    // Update the map
                    view.setCenter(MapService.fromLonLat(center));
                    view.setZoom(zoom);

                };
                scope.updateMapExtent(true);


                // Check for the map reload flag
                if (isDefined(scope.mapState) && isDefined(scope.mapState.reloadMap)) {
                    scope.$watch("mapState.reloadMap", function (reload) {
                        if (reload) {
                            scope.mapState['reloadMap'] = false;
                            scope.updateMapExtent(false);
                        }
                    }, true);
                }


                // Whenever the map extent is changed, record the new extent in the mapState
                if (isDefined(scope.mapState)) {
                    scope.mapChanged = function () {
                        var extent = view.calculateExtent(map.getSize());
                        scope.mapState['zoom'] = view.getZoom();
                        scope.mapState['center'] = MapService.round(MapService.toLonLat(view.getCenter()), 4);
                        scope.mapState['extent'] = MapService.round(MapService.toLonLatExtent(extent), 4);
                        scope.$$phase || scope.$apply();
                    };
                    map.on('moveend', scope.mapChanged);
                }

                // Update the map size if the element size changes.
                // In theory, this should not be necessary, but it seems to fix a problem
                // where maps are sometimes distorted
                scope.updateSize = function () {
                    updateSizeTimer = null;
                    map.updateSize();
                };

                var updateSizeEventHandler = function () {
                    if (isDefined(updateSizeTimer)) {
                        $timeout.cancel(updateSizeTimer);
                    }
                    updateSizeTimer = $timeout(scope.updateSize, 100);
                };

                scope.$watch(function () {
                    return element[0].clientWidth;
                }, updateSizeEventHandler);
                scope.$watch(function () {
                    return element[0].clientHeight;
                }, updateSizeEventHandler);

                // Resolve the map object to the promises
                scope.setMap(map);
            }
        };
    }

})();