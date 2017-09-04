(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('vrmtVessel', vessel);

    vessel.$inject = ['NotifyService', 'VrmtEvents'];

    function vessel(NotifyService, VrmtEvents) {
        var directive = {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var vesselLayer = createVesselLayer();
            NotifyService.subscribe(scope, VrmtEvents.VesselLoaded, addOrReplaceVessel);

            function createVesselLayer() {
                var layer = new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    style: createVesselStyle()
                });
                layer.set("Feature", "VRMT");
                return layer;
            }

            function createVesselStyle() {
                return new ol.style.Style({
                    image: new ol.style.Icon(({
                        anchor: [0.85, 0.5],
                        opacity: 0.85,
                        src: 'img/vessel_purple.png'
                    }))
                });
            }

            function addOrReplaceVessel(event, vessel) {
                if (vessel && vessel.aisVessel) {
                    addOrReplaceVesselFeature(vessel.aisVessel.lat, vessel.aisVessel.lon);
                    updateStyle(((vessel.aisVessel.cog - 90) * (Math.PI / 180)));
                }
            }

            function addOrReplaceVesselFeature(lat, lon) {
                var source = vesselLayer.getSource();
                source.clear();
                var vesselFeature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'))
                });

                source.addFeature(vesselFeature);
            }

            function updateStyle(radian) {
                vesselLayer.getStyle().getImage().setRotation(radian);
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(vesselLayer);

                var onclickKey = map.on('singleclick', function (e) {
                    var pixel = map.getEventPixel(e.originalEvent);

                    var layerFilter = function (layerCandidate) {
                        return layerCandidate === vesselLayer;
                    };
                    var hitThis = map.hasFeatureAtPixel(pixel, {layerFilter: layerFilter});

                    if (hitThis) {
                        NotifyService.notify(VrmtEvents.VesselClicked, {
                            x: e.originalEvent.clientX,
                            y: e.originalEvent.clientY
                        });
                    }
                    scope.$apply();

                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(vesselLayer)) {
                        map.removeLayer(vesselLayer);
                    }
                    if (onclickKey) {
                        ol.Observable.unByKey(onclickKey);
                    }
                });
            })
        }
    }
})();