(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .directive('mapPosition', mapPosition);

    mapPosition.$inject = ['NotifyService', 'OpenlayerEvents', 'OpenlayerService', 'CookieService'];

    function mapPosition(NotifyService, OpenlayerEvents, OpenlayerService, CookieService) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var viewListenerKey;

            /**
             * Saves the maps position and resolution in cookies with the given names whenever it changes.
             */
            NotifyService.subscribe(scope, OpenlayerEvents.SaveMapState, function (e, data) {
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    var view = map.getView();
                    viewListenerKey = view.on(["change:center", "change:resolution"], function () {
                        CookieService.set(data.centerCookie, view.getCenter(), 10);
                        CookieService.set(data.resolutionCookie, view.getResolution(), 10);
                    });
                })
            });

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
                var feature = data.feature;

                if (feature) {
                    fitExtent({extent: OpenlayerService.getFeaturesExtent([feature]), padding: data.padding, minResolution: data.minResolution});

                } else if (data.id) {
                    ctrl.getOpenlayersScope().getMap().then(function (map) {
                        feature = findFeature(map, data.id);
                        if (feature) {
                            fitExtent({extent: OpenlayerService.getFeaturesExtent([feature]), padding: data.padding, minResolution: data.minResolution});
                        }
                    });
                }
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
                var padding = data.padding ? data.padding : [5, 5, 5, 5];
                var extent = data.extent;
                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    var view = map.getView();
                    view.fit(extent, {size: map.getSize(), minResolution: minResolution, padding: padding});
                })
            }


            scope.$on("destroy", function () {
                if (viewListenerKey) {
                    ol.Observable.unByKey(viewListenerKey);
                }
            })
        }
    }
})();