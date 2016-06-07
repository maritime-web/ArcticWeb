angular.module('vrmt.map')

    .directive('route', [function () {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: function (scope, element, attrs, ctrl) {

                var routeLayer;

                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {

                    // Clean up when the layer is destroyed
                    scope.$on('$destroy', function () {
                        if (angular.isDefined(routeLayer)) {
                            map.removeLayer(routeLayer);
                        }
                    });

                    var source = new ol.source.Vector();

                    routeLayer = new ol.layer.Vector({
                        source: source,
                        style: new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(94, 68, 64, 1)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#6c1507',
                                width: 2
                            }),
                            image: new ol.style.Circle({
                                radius: 7,
                                fill: new ol.style.Fill({
                                    color: '#6c1507'
                                })
                            })
                        })
                    });

                    var markers = [];
                    markers[0] = ol.proj.transform([-40.03, 61.07], 'EPSG:4326', 'EPSG:3857');
                    markers[1] = ol.proj.transform([-37.21, 64.04], 'EPSG:4326', 'EPSG:3857');
                    markers[2] = ol.proj.transform([-33.02, 65.02], 'EPSG:4326', 'EPSG:3857');
                    markers[3] = ol.proj.transform([-31.43, 67.51], 'EPSG:4326', 'EPSG:3857');

                    markers.forEach(function (m) {
                        var pointFeature = new ol.Feature({
                            geometry: new ol.geom.Point(m)
                        });

                        source.addFeature(pointFeature);
                    });

                    // Create feature with linestring
                    var line = new ol.geom.LineString(markers, 'XY');
                    var feature = new ol.Feature({
                        geometry: line
                    });
                    source.addFeature(feature);

                    routeLayer.setVisible(true);
                    map.addLayer(routeLayer);
                })
            }
        };
    }])
    .directive('vessel', [function () {
        return {
            restrict: 'E',
            require: '^olMap',
            scope: {},
            link: function (scope, element, attrs, ctrl) {

                var vesselLayer;

                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {

                    // Clean up when the layer is destroyed
                    scope.$on('$destroy', function () {
                        if (angular.isDefined(vesselLayer)) {
                            map.removeLayer(vesselLayer);
                        }
                    });

                    var source = new ol.source.Vector();

                    var vesselStyle = new ol.style.Style({
                        image: new ol.style.Icon( ({
                            anchor: [0.85, 0.5],
                            opacity: 0.85,
                            // rotation: vessel.radian,
                            src: 'img/vessel_purple.png'
                        }))
                    });


                    vesselLayer = new ol.layer.Vector({
                        source: source,
                        style: vesselStyle
                    });

                    var vesselFeature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.transform([-40.03, 61.07], 'EPSG:4326', 'EPSG:3857'))
                    });

                    source.addFeature(vesselFeature);

                    vesselLayer.setVisible(true);
                    map.addLayer(vesselLayer);
                })
            }
        };
    }])

;