(function () {
    'use strict';

    angular.module('embryo.components.vessel')
        .factory('OpenLayerStyleFactory', OpenLayerStyleFactory);

    OpenLayerStyleFactory.$inject = [];

    function OpenLayerStyleFactory() {
        var vesselScales = [
            {resolution: 200, scale: 1.0},
            {resolution: 500, scale: 0.95},
            {resolution: 800, scale: 0.9},
            {resolution: 1200, scale: 0.85},
            {resolution: 1900, scale: 0.75},
            {resolution: 4000, scale: 0.7},
            {resolution: 6000, scale: 0.65},
            {resolution: 8000, scale: 0.6},
            {resolution: 14000, scale: 0.55},
            {resolution: 16000, scale: 0.5},
            {resolution: 18500, scale: 0.45}
        ];

        /** Returns the image and type text for the given vessel **/
        function imageAndTypeTextForVessel(vo) {
            var colorName;
            var vesselType;
            switch (vo.type) {
                case "0" :
                    colorName = "blue";
                    vesselType = "Passenger";
                    break;
                case "1" :
                    colorName = "gray";
                    vesselType = "Undefined / unknown";
                    break;
                case "2" :
                    colorName = "green";
                    vesselType = "Cargo";
                    break;
                case "3" :
                    colorName = "orange";
                    vesselType = "Fishing";
                    break;
                case "4" :
                    colorName = "purple";
                    vesselType = "Sailing and pleasure";
                    break;
                case "5" :
                    colorName = "red";
                    vesselType = "Tanker";
                    break;
                case "6" :
                    colorName = "turquoise";
                    vesselType = "Pilot, tug and others";
                    break;
                case "7" :
                    colorName = "yellow";
                    vesselType = "High speed craft and WIG";
                    break;
                default :
                    colorName = "gray";
                    vesselType = "Undefined / unknown";
            }

            if (vo.moored) {
                return {
                    name: "vessel_" + colorName + "_moored.png",
                    type: vesselType,
                    width: 12,
                    height: 12,
                    xOffset: -6,
                    yOffset: -6
                };
            } else {
                return {
                    name: "vessel_" + colorName + ".png",
                    type: vesselType,
                    width: 20,
                    height: 10,
                    xOffset: -10,
                    yOffset: -5
                };
            }
        }

        return {
            createVesselStyleFunction : function (myMmsi, clickedMmsi) {
                return function (feature, resolution) {

                    var vesselScale = getVesselScale();
                    var vessel = feature.get('vessel');
                    var styles = [];

                    function getVesselScale() {
                        for (var index in vesselScales) {
                            if (vesselScales[index].resolution >= resolution) {
                                return vesselScales[index].scale;
                            }
                        }

                        return vesselScales[vesselScales.length - 1].scale;
                    }

                    var props = imageAndTypeTextForVessel(vessel);
                    styles.push(new ol.style.Style({
                        image: new ol.style.Icon(({
                            anchor: [0.5, 0.5],
                            opacity: 0.85,
                            src: 'img/' + props.name,
                            rotation: (vessel.angle - 90) * (Math.PI / 180),
                            scale: vesselScale
                        }))
                    }));

                    if (vessel.inAW) {
                        styles.push(new ol.style.Style({
                            image: new ol.style.Icon(({
                                anchor: [0.5, 1.25],
                                anchorOrigin: 'bottom-left',
                                opacity: 0.85,
                                src: 'img/aw-logo.png',
                                rotation: 0,
                                scale: vesselScale * 0.4
                            }))
                        }));
                    }

                    if (Number(vessel.mmsi) === Number(clickedMmsi)) {
                        styles.push(new ol.style.Style({
                            image: new ol.style.Icon(({
                                anchor: [0.5, 0.5],
                                opacity: 1.0,
                                src: 'img/selection.png',
                                rotation: (vessel.angle - 90) * (Math.PI / 180),
                                scale: vesselScale
                            }))
                        }))
                    }

                    if (Number(vessel.mmsi) === Number(myMmsi)) {
                        styles.push(new ol.style.Style({
                            image: new ol.style.Icon(({
                                anchor: [0.5, 0.5],
                                opacity: 0.85,
                                src: 'img/green_marker.png',
                                rotation: 0,
                                scale: vesselScale * 1.0
                            }))
                        }));
                    }

                    return styles;
                };
            },
            createRouteStyleFunction : function () {
                return function (feature, resolution) {
                    var routeColor = feature.get('routeColor');
                    var arrowImg = feature.get('arrowImg');
                    var geometry = feature.getGeometry();
                    var styles = [
                        new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: routeColor,
                                width: 2,
                                lineDash: [5, 5, 0, 5]
                            })
                        })
                    ];

                    geometry.forEachSegment(function (start, end) {
                        var dx = end[0] - start[0];
                        var dy = end[1] - start[1];
                        var rotation = Math.atan2(dy, dx);

                        var a = dy / dx;
                        var b = start[1] - a * start[0];
                        var middle = [start[0] + dx / 2.0];
                        middle[1] = a * middle[0] + b;

                        // arrows
                        styles.push(new ol.style.Style({
                            geometry: new ol.geom.Point(middle),
                            image: new ol.style.Icon({
                                src: arrowImg,
                                anchor: [0.75, 0.5],
                                rotateWithView: true,
                                rotation: -rotation,
                                imgSize: [10, 10]
                            })
                        }));
                    });

                    geometry.getCoordinates().forEach(function (coord) {
                        styles.push(new ol.style.Style({
                            geometry: new ol.geom.Point(coord),
                            image: new ol.style.Circle({
                                radius: 4,
                                stroke: new ol.style.Stroke({
                                    color: routeColor,
                                    width: 1
                                })
                            })
                        }));
                    });

                    return styles;
                }
            }
        };
    }
})();