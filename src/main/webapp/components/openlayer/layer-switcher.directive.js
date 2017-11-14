(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .directive('layerSwitcher', layerSwitcher);

    layerSwitcher.$inject = [];

    function layerSwitcher() {
        return {
            restrict: 'E',
            replace: true,
            require: '^openlayerParent',
            templateUrl: 'components/openlayer/layer-switcher.template.html',
            scope: {},
            link: linkFn
        };

        function linkFn(scope, element, attrs, ctrl) {
            var olScope = ctrl.getOpenlayersScope();
            scope.hidden = true;
            scope.hide = function () {
                scope.hidden = true;
            };
            scope.toggle = function (e) {
                e.preventDefault();
                e.stopPropagation();
                scope.hidden = !scope.hidden;
            };
            scope.isActive = function (feature) {
                return scope.activeFeature === feature;
            };
            scope.activeFeature = undefined;
            scope.features = [];
            scope.featuresLayers = new Map();
            olScope.getMap().then(function (map) {
                var layerGroupHandle = map.on('change:layerGroup', function () {
                    updateLayers();
                });

                var layersInGroupHandle = map.getLayerGroup().on('change:layers', function () {
                    updateLayers();
                });

                var layerHandle = map.getLayers().on('change:length', function () {
                    updateLayers();
                });

                updateLayers();

                function updateLayers() {
                    if (scope.featuresLayers) {
                        scope.featuresLayers.forEach(function (layerView) {
                            ol.Observable.unByKey(layerView.listener);
                        });
                    }

                    scope.featuresLayers.clear();
                    scope.features.length = 0;
                    map.getLayerGroup().getLayers().forEach(function (layer) {
                        if (layer.getKeys().includes('context')) {
                            var context = layer.get('context');
                            if (context.active) {
                                scope.activeFeature = context.feature;
                            }
                            if (!scope.featuresLayers.has(context.feature)) {
                                scope.featuresLayers.set(context.feature, []);
                                scope.features.push(context.feature)
                            }
                            var layerView = {
                                layer: layer,
                                feature: context.feature,
                                name: context.name,
                                show: layer.getVisible(),
                                change: function () {
                                    this.layer.setVisible(this.show);
                                },
                                hasData: function () {
                                    return this.layer.getSource().getFeatures().length > 0
                                }
                            };
                            layerView.listener = layer.on('propertychange', function (event) {
                                if (event.key === 'visible') {
                                    layerView.show = layerView.layer.getVisible();
                                } else if (event.key === 'context') {
                                    var newContext = event.target.get(event.key);
                                    if (newContext.active) {
                                        scope.activeFeature = newContext.feature;
                                    }
                                } else {
                                    console.log('Event: ' + event.key);
                                }
                            });
                            scope.featuresLayers.get(context.feature).push(layerView);
                        }
                    });
                }

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (layerGroupHandle) {
                        ol.Observable.unByKey(layerGroupHandle);
                    }
                    if (layersInGroupHandle) {
                        ol.Observable.unByKey(layersInGroupHandle);
                    }
                    if (layerHandle) {
                        ol.Observable.unByKey(layerHandle);
                    }
                    if (scope.featuresLayers) {
                        scope.featuresLayers.forEach(function (layerView) {
                            ol.Observable.unByKey(layerView.listener);
                        });

                    }
                });
            });
        }
    }
})();