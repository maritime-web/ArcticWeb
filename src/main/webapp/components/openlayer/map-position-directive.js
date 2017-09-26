(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .directive('mapPosition', mapPosition);

    mapPosition.$inject = ['NotifyService', 'OpenlayerEvents'];

    function mapPosition(NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {

            NotifyService.subscribe(scope, OpenlayerEvents.ZoomAndCenter, centerAndZoom);
            function centerAndZoom(e, data) {
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    var view = map.getView();
                    view.setResolution(data.resolution);
                    view.setCenter(data.center);
                })
            }

            NotifyService.subscribe(scope, OpenlayerEvents.ZoomToExtent, zoomToExtent);
            function zoomToExtent(e, data) {
                fitExtent(data);
            }

            NotifyService.subscribe(scope, OpenlayerEvents.ZoomToLayer, zoomToLayer);
            function zoomToLayer(e, layer) {
                fitExtent({extent: layer.getSource().getExtent()});
            }

            NotifyService.subscribe(scope, OpenlayerEvents.ZoomToFeature, zoomToFeature);
            function zoomToFeature(e, data) {
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    var feature = findFeature(map, data.id);
                    var view = map.getView();
                    view.setResolution(data.resolution);
                    view.setCenter(feature.getGeometry().getFirstCoordinate());
                })
            }

            NotifyService.subscribe(scope, OpenlayerEvents.PanToFeature, panToFeature);
            function panToFeature(e, featureId) {
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {

                    var feature = findFeature(featureId);
                    if (feature) {
                        var view = map.getView();
                        var featureExtent = feature.getGeometry().getExtent();
                        var mapExtent = view.calculateExtent(map.getSize());
                        if (!ol.extent.containsExtent(mapExtent, featureExtent)) {
                            view.fit(feature.getGeometry(), {size: map.getSize(), maxZoom: 8});
                        }
                    }

                    function findFeature(featureId) {
                        var res = null;
                        map.getLayers().forEach(function (layer) {
                            if (layer instanceof ol.layer.Vector) {
                                var candidate = layer.getSource().getFeatureById(featureId);
                                if (candidate) {
                                    res = candidate;
                                }
                            }
                        });
                        return res;
                    }
                })
            }

            function findFeature(map, featureId) {
                var res = null;
                map.getLayers().forEach(function (layer) {
                    if (layer instanceof ol.layer.Vector) {
                        var candidate = layer.getSource().getFeatureById(featureId);
                        if (candidate) {
                            res = candidate;
                        }
                    }
                });
                return res;
            }

            function fitExtent(data) {
                var minResolution = data.minResolution ? data.minResolution : 100;
                var extent = data.extent;
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    var view = map.getView();
                    view.fit(extent, {size: map.getSize(), minResolution: minResolution, padding: [5,5,5,5]});
                })
            }
        }
    }
})();