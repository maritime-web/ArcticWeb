(function () {
    'use strict';

    angular
        .module('vrmt.map')
        .directive('vrmtVessel', vessel);

    vessel.$inject = ['NotifyService', 'VrmtEvents', 'OpenLayerStyleFactory'];

    function vessel(NotifyService, VrmtEvents, OpenLayerStyleFactory) {
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
                    source: new ol.source.Vector()
                });
                layer.set("Feature", "VRMT");
                return layer;
            }

            function addOrReplaceVessel(event, vessel) {
                if (vessel && vessel.aisVessel) {
                    addOrReplaceVesselFeature(vessel);
                }
            }

            function addOrReplaceVesselFeature(vesselDetails) {
                var lat = vesselDetails.aisVessel.lat;
                var lon = vesselDetails.aisVessel.lon;

                var source = vesselLayer.getSource();
                source.clear();
                var vesselFeature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'))
                });
                vesselFeature.set("vessel", vesselDetails.overview, true);
                vesselFeature.setStyle(OpenLayerStyleFactory.createVesselStyleFunction(vesselDetails.mmsi, vesselDetails.mmsi));
                source.addFeature(vesselFeature);
            }

            var onclickKey = null;
            function createClickListener(map) {
                onclickKey = map.on('singleclick', function (e) {
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
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(vesselLayer);

                if (NotifyService.hasOccurred(VrmtEvents.VRMTFeatureActive)) {
                    createClickListener(map);
                }

                NotifyService.subscribe(scope, VrmtEvents.VRMTFeatureActive, function () {
                    if (!onclickKey) {
                        createClickListener(map);
                    }
                    vesselLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, VrmtEvents.VRMTFeatureInActive, function () {
                    if (onclickKey) {
                        ol.Observable.unByKey(onclickKey);
                        onclickKey = null;
                    }
                    vesselLayer.setVisible(false);
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