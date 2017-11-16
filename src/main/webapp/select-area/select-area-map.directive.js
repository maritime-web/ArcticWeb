(function () {
    'use strict';

    angular
        .module('embryo.areaselect')
        .directive('selectAreaMap', selectAreaMap);

    selectAreaMap.$inject = ['OpenlayerService', 'NotifyService', 'OpenlayerEvents', 'SelectAreaEvents'];

    function selectAreaMap(OpenlayerService, NotifyService, OpenlayerEvents, SelectAreaEvents) {
        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var selectAreaLayer = new ol.layer.Vector({
                title: 'Select area Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Select area',
                    name: 'Select area'
                }

            });

            var dragBox = new ol.interaction.DragBox({
                condition: ol.events.condition.platformModifierKeyOnly
            });

            var boxEndListenerKey;

            NotifyService.subscribe(scope, SelectAreaEvents.ShowArea, function (e, area) {
                update(area);
            });

            function update(area) {
                selectAreaLayer.getSource().clear();

                area.squares.forEach(function (square) {
                    drawSquare(square);
                });

                updateContext();
            }

            function drawSquare(square) {
                var points = [
                    [square.left, square.bottom],
                    [square.left, square.top],
                    [square.right, square.top],
                    [square.right, square.bottom],
                    [square.left, square.bottom]
                ];

                var feature = new ol.Feature({
                    geometry: OpenlayerService.createPolygon(points)
                });

                feature.setStyle(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: "rgba(175, 152, 19, 0.4)"
                    }),
                    stroke: new ol.style.Stroke({
                        color: "rgba(175, 152, 19, 1.0)",
                        width: 1
                    })

                }));
                selectAreaLayer.getSource().addFeature(feature);
            }

            NotifyService.subscribe(scope, SelectAreaEvents.StartEdit, function () {
                dragBox.setActive(true);
            });

            NotifyService.subscribe(scope, SelectAreaEvents.DoneEdit, function () {
                dragBox.setActive(false);
                selectAreaLayer.getSource().clear();
            });

            /** Clear Layer **/
            NotifyService.subscribe(scope, SelectAreaEvents.ClearAreas, function () {
                selectAreaLayer.getSource().clear();

            });

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(selectAreaLayer);
                boxEndListenerKey = dragBox.on("boxend", function (e) {
                    var extent = dragBox.getGeometry().getExtent();
                    var bottomLeft = OpenlayerService.toLonLat(ol.extent.getBottomLeft(extent));
                    var topRight = OpenlayerService.toLonLat(ol.extent.getTopRight(extent));
                    var square = {
                        left: bottomLeft[0],
                        right: topRight[0],
                        top: topRight[1],
                        bottom: bottomLeft[1]
                    };
                    drawSquare(square);
                    NotifyService.notify(SelectAreaEvents.AreaCreated, square)
                });

                dragBox.setActive(false);
                map.addInteraction(dragBox);

                if (NotifyService.hasOccurred(SelectAreaEvents.SelectAreaActive)) {
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, SelectAreaEvents.SelectAreaActive, function () {
                    updateContextToActive();
                    selectAreaLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, SelectAreaEvents.SelectAreaInActive, function () {
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(selectAreaLayer)) {
                        map.removeLayer(selectAreaLayer);
                    }
                    if (angular.isDefined(dragBox)) {
                        map.removeInteraction(dragBox);
                    }
                    if (angular.isDefined(boxEndListenerKey)) {
                        ol.Observable.unByKey(boxEndListenerKey)
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, selectAreaLayer.get('context'));
                selectAreaLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, selectAreaLayer.get('context'));
                newContext.active = true;
                selectAreaLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, selectAreaLayer.get('context'));
                newContext.active = false;
                selectAreaLayer.set('context', newContext);
            }
        }
    }
})();