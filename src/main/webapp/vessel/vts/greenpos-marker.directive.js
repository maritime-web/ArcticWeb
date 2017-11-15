(function () {
    'use strict';

    angular
        .module('embryo.vessel.vts')
        .directive('greenposMarker', greenposMarker);

    greenposMarker.$inject = ['OpenlayerService', 'NotifyService', 'VTSEvents'];

    function greenposMarker(OpenlayerService, NotifyService, VTSEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var greenposMarkerLayer = new ol.layer.Vector({
                title: 'Report position mark',
                source: new ol.source.Vector(),
                context: {
                    feature: 'VTS',
                    name: 'Report position mark'
                }
            });

            NotifyService.subscribe(scope, VTSEvents.Mark, function (e, lonLat) {
                drawMark(lonLat);
                updateContext();
            });

            function drawMark(lonLat) {
                greenposMarkerLayer.getSource().clear();
                var feature = new ol.Feature(OpenlayerService.createPoint(lonLat));
                feature.setStyle(new ol.style.Style(
                    {
                        image: new ol.style.RegularShape(
                            {
                                fill: new ol.style.Fill({color: 'yellow'}),
                                stroke: new ol.style.Stroke({color: 'black', width: 3}),
                                points: 4,
                                radius: 10,
                                radius2: 0,
                                angle: Math.PI / 4
                            }
                        )
                    })
                );
                greenposMarkerLayer.getSource().addFeature(feature);
            }

            NotifyService.subscribe(scope, VTSEvents.ClearMarks, clearMarks);
            function clearMarks() {
                greenposMarkerLayer.getSource().clear();
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(greenposMarkerLayer);
                greenposMarkerLayer.setVisible(true);
                updateContextToInActive();

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(greenposMarkerLayer)) {
                        map.removeLayer(greenposMarkerLayer);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, greenposMarkerLayer.get('context'));
                greenposMarkerLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, greenposMarkerLayer.get('context'));
                newContext.active = false;
                greenposMarkerLayer.set('context', newContext);
            }
        }
    }
})();