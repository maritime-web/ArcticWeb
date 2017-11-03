(function () {
    'use strict';

    angular
        .module('embryo.sar')
        .directive('sarMap', sarMap);

    sarMap.$inject = [
        'SarEvents',
        'OpenlayerService',
        'NotifyService',
        'OpenlayerEvents',
        'SarType',
        'SarStatus',
        'Operation',
        'SearchPattern',
        'EffortStatus',
        'ModifyRectangleInteractionFactory',
        'Position',
        'Route'
    ];

    function sarMap(SarEvents,
                    OpenlayerService,
                    NotifyService,
                    OpenlayerEvents,
                    SarType,
                    SarStatus,
                    Operation,
                    SearchPattern,
                    EffortStatus,
                    ModifyRectangleInteractionFactory,
                    Position,
                    Route) {

        return {
            restrict: 'E',
            require: '^openlayerParent',
            scope: {},
            link: link
        };

        function link(scope, element, attrs, ctrl) {
            var nmToMeters = embryo.geo.Converter.nmToMeters;

            var sarLayer = new ol.layer.Vector({
                title: 'Sar Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Sar',
                    name: 'Sar'
                }
            });

            var sarEditLayer = new ol.layer.Vector({
                title: 'Sar Edit Layer',
                source: new ol.source.Vector(),
                context: {
                    feature: 'Sar',
                    name: 'Sar Edit'
                }
            });

            var modifyRectangleInteraction;


            /***
             * Style functions
             ***/
            var sarLayerStyleFunction = function (feature, resolution) {
                var color = feature.get("color");
                var type = feature.get("type");
                var label = feature.get("label");
                var status = feature.get("status");
                var temp = feature.get("temp");
                var active = sarLayer.get('context').active;
                var sarActive = feature.get("active");
                var isEdit = feature.get("edit");

                var styles = [];


                var baseStroke = new ol.style.Stroke({color: getColor(getStrokeOpacity()), width: getStrokeWidth()});
                if (useDottedStyle()) {
                    baseStroke.setLineDash([1, 5]);
                }
                styles.push(new ol.style.Style({
                    stroke: baseStroke,
                    fill: new ol.style.Fill({
                        color: getColor(getFillOpacity())
                    })
                }));

                if (resolution < 500 && label && active) {
                    var offset = type === 'position' ? 10 : -10;
                    styles.push(new ol.style.Style({
                        text: new ol.style.Text(/** @type {olx.style.TextOptions}*/{
                            textAlign: 'start',
                            font: 'bold 14px Courier New, monospace',
                            text: label,
                            offsetX: offset,
                            offsetY: offset,
                            rotation: 0
                        })
                    }));
                }

                if (shouldAddOrientationArrows()) {
                    var geometry = feature.getGeometry();
                    geometry.forEachSegment(function (start, end) {
                        var dx = end[0] - start[0];
                        var dy = end[1] - start[1];
                        var rotation = Math.atan2(dy, dx);

                        var a = dy / dx;
                        var b = start[1] - a * start[0];
                        var middle = [start[0] + dx / 2.0];
                        middle[1] = a * middle[0] + b;

                        // arrows icon
                        var svgArrow = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
                            '<polyline fill="none" stroke="' + getColor(1) + '" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.8" points="0,0 100,50 0,100" transform="scale(0.1)"/>' +
                            '</svg>';
                        var arrowImage = new Image();
                        arrowImage.src = 'data:image/svg+xml,' + encodeURI(svgArrow);

                        // arrows
                        styles.push(new ol.style.Style({
                            geometry: new ol.geom.Point(middle),
                            image: new ol.style.Icon({
                                img: arrowImage,
                                anchor: [0.75, 0.5],
                                rotateWithView: true,
                                rotation: -rotation,
                                imgSize: [10, 10]
                            })
                        }));
                    });
                }

                if (shouldDrawPointAsCircle()) {
                    styles.push(new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: getCircleRadius(),
                            stroke: new ol.style.Stroke({color: getColor(getStrokeOpacity()), width: getStrokeWidth()}),
                            fill: new ol.style.Fill({
                                color: getColor(getFillOpacity())
                            })
                        })
                    }));
                }

                return styles;

                function getStrokeWidth() {
                    return resolution > 6000 ? 1 : 2;
                }

                function getColor(opacity) {
                    var red = 'rgba(255,0,0,' + opacity + ')';
                    var grey = 'rgba(125,135,122,' + opacity + ')';
                    var black = 'rgba(0,0,0,' + opacity + ')';
                    var green = 'rgba(0,128,0,' + opacity + ')';
                    var lightgray = 'rgba(153,153,153,' + opacity + ')';

                    if (type === SarType.Log || type === "position") {
                        return black;
                    }
                    if (type === "zone") {
                        return status === EffortStatus.Active ? grey : red
                    }
                    if (type === 'dv' || type === 'dsp') {
                        return black;
                    }
                    if (type === 'searchPattern' || type === 'dragPoint') {
                        return red;
                    }
                    if (type) {
                        if (color) {
                            return color;
                        }
                        return sarActive ? green : lightgray;
                    }

                    return red;

                }

                function getStrokeOpacity() {
                    if (type === 'dv' || type === 'dsp') {
                        return active ? 0.7 : 0.35;
                    }
                    return active ? 0.6 : 0.3;
                }

                function getFillOpacity() {
                    return active ? 0.2 : 0.1;
                }

                function shouldAddOrientationArrows() {
                    var isLineString = feature.getGeometry().getType() === "LineString";
                    return (isLineString && type !== 'dsp') || (isLineString && temp);
                }

                function shouldDrawPointAsCircle() {
                    var isPoint = feature.getGeometry().getType() === "Point";
                    return isPoint && (isEdit || type === SarType.Log || type === "position")
                }

                function getCircleRadius() {
                    var r = 1;
                    if (isEdit) {
                        return 10
                    }
                    if (type === SarType.Log || type === "position") {
                        r = 5;
                        if (resolution < 600) {
                            r = 10
                        }
                        if (resolution < 100) {
                            r = 15
                        }
                        return r;
                    }
                    return r;
                }

                function useDottedStyle() {
                    return type === "dsp" && !isEdit;
                }
            };

            sarLayer.setStyle(sarLayerStyleFunction);
            sarEditLayer.setStyle(sarLayerStyleFunction);


            NotifyService.subscribe(scope, OpenlayerEvents.BoxChanged, function (e, boxFeature) {
                var extent = boxFeature.getGeometry().getExtent();
                var zoneUpdate = {
                    _id: boxFeature.get("id"),
                    area: {
                        // list of points (components) are always created as A, B, C, D in drawEffortAllocationZone
                        A: Position.create(OpenlayerService.toLonLat([extent[0], extent[1]])),
                        B: Position.create(OpenlayerService.toLonLat([extent[2], extent[1]])),
                        C: Position.create(OpenlayerService.toLonLat([extent[2], extent[3]])),
                        D: Position.create(OpenlayerService.toLonLat([extent[0], extent[3]]))
                    }
                };
                NotifyService.notify(SarEvents.EffortAllocationZoneModified, zoneUpdate);
            });

            var positionSelectionContext = {};
            NotifyService.subscribe(scope, SarEvents.ActivatePositionSelection, function () {
                var draftStyle = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        stroke: new ol.style.Stroke({color: 'rgba(255,0,0,0.8)', width: 3}),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0,0.4)'
                        })
                    })
                });

                positionSelectionContext.tempLayer = new ol.layer.Vector({
                    title: 'Temporary Layer',
                    source: new ol.source.Vector()
                });

                positionSelectionContext.tempLayer.setStyle(draftStyle);

                var draw = new ol.interaction.Draw({
                    type: "Point",
                    source: positionSelectionContext.tempLayer.getSource(),
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            stroke: new ol.style.Stroke({color: 'rgba(255,0,0,0.6)', width: 2}),
                            fill: new ol.style.Fill({
                                color: 'rgba(255,0,0,0.3)'
                            })
                        })
                    })
                });
                positionSelectionContext.draw = draw;

                var olScope = ctrl.getOpenlayersScope();
                olScope.getMap().then(function (map) {
                    positionSelectionContext.tempLayer.setMap(map);
                    map.addInteraction(draw);
                });

                positionSelectionContext.drawEndKey = draw.on("drawend", function (e) {
                    var pos = Position.create(OpenlayerService.toLonLat(e.feature.getGeometry().getCoordinates()));
                    NotifyService.notify(SarEvents.PositionSelected, pos);
                });

            });

            NotifyService.subscribe(scope, SarEvents.DeactivatePositionSelection, function () {
                if (positionSelectionContext) {
                    var olScope = ctrl.getOpenlayersScope();

                    olScope.getMap().then(function (map) {
                        if (positionSelectionContext.draw) {
                            map.removeInteraction(positionSelectionContext.draw);
                        }

                        if (positionSelectionContext.tempLayer) {
                            positionSelectionContext.tempLayer.setMap(null);
                        }
                    });

                    if (positionSelectionContext.drawEndKey) {
                        ol.Observable.unByKey(positionSelectionContext.drawEndKey);
                    }
                }
            });

            var tracklinePositionContext = {};
            NotifyService.subscribe(scope, SarEvents.ActivateTrackLinePositioning, function () {
                activateTracklinePositioning();
            });

            function activateTracklinePositioning() {
                var dragPoint = sarEditLayer.getSource().getFeatures().find(function (f) {
                    var type = f.get("type");
                    return type === "dragPoint"
                });

                if (dragPoint) {
                    tracklinePositionContext.active = true;
                    var sarId = dragPoint.get("sarId");
                    var routeFeature = sarLayer.getSource().getFeatures().find(function (f) {
                        var type = f.get("type");
                        return type === "dv" && f.get("sarId") === sarId;
                    });

                    var pointTranslate = new ol.interaction.Translate({
                        features: new ol.Collection([dragPoint])
                    });
                    tracklinePositionContext.translate = pointTranslate;

                    tracklinePositionContext.translatingKey = pointTranslate.on("translating", function (e) {
                        var point = routeFeature.getGeometry().getClosestPoint(e.coordinate);
                        dragPoint.getGeometry().setCoordinates(point);
                    });

                    tracklinePositionContext.translateendKey = pointTranslate.on("translateend", function (e) {
                        var pos = Position.create(OpenlayerService.toLonLat(dragPoint.getGeometry().getCoordinates()));
                        NotifyService.notify(SarEvents.TrackLinePositionModified, pos);
                    });

                    var olScope = ctrl.getOpenlayersScope();
                    olScope.getMap().then(function (map) {
                        map.addInteraction(pointTranslate);
                    })
                }
            }

            NotifyService.subscribe(scope, SarEvents.DeactivateTrackLinePositioning, function () {
                if (tracklinePositionContext) {
                    if (tracklinePositionContext.translate) {
                        var olScope = ctrl.getOpenlayersScope();
                        olScope.getMap().then(function (map) {
                            map.removeInteraction(tracklinePositionContext.translate);
                        })
                    }

                    if (tracklinePositionContext.translatingKey) {
                        ol.Observable.unByKey(tracklinePositionContext.translatingKey);
                    }

                    if (tracklinePositionContext.translateendKey) {
                        ol.Observable.unByKey(tracklinePositionContext.translateendKey);
                    }
                }
                tracklinePositionContext = {};
            });

            NotifyService.subscribe(scope, SarEvents.CreateTemporarySearchPattern, function (e, pattern) {
                drawTemporarySearchPattern(pattern);
                if (!tracklinePositionContext.active) {
                    activateTracklinePositioning();
                }
            });

            NotifyService.subscribe(scope, SarEvents.RemoveTemporarySearchPattern, function () {
                removeTemporarySearchPattern();
            });

            NotifyService.subscribe(scope, SarEvents.ZoomToOperation, function (e, sar) {
                var featuresInSar = [];
                sarLayer.getSource().getFeatures().forEach(function (f) {
                    if (sar._id === f.get("sarId")) {
                        featuresInSar.push(f);
                    }
                });

                NotifyService.notify(OpenlayerEvents.ZoomToExtent, {
                    extent: OpenlayerService.getFeaturesExtent(featuresInSar),
                    minResolution: OpenlayerService.minResolution
                });
            });

            NotifyService.subscribe(scope, SarEvents.DrawSarDocuments, function (e, sarDocuments) {
                update(sarDocuments);
            });

            function update(sarDocuments) {
                sarLayer.getSource().clear();
                sarEditLayer.getSource().clear();

                for (var index in sarDocuments) {
                    if (SarType.SearchArea === sarDocuments[index]['@type']) {
                        drawSar(sarDocuments[index]);
                    } else if (SarType.EffortAllocation === sarDocuments[index]['@type'] && sarDocuments[index].area) {
                        drawEffortAllocationZone(sarDocuments[index]);
                    } else if (SarType.SearchPattern === sarDocuments[index]['@type']) {
                        drawSearchPattern(sarDocuments[index]);
                    } else if (SarType.Log === sarDocuments[index]['@type']) {
                        drawLogPosition(sarDocuments[index]);
                    }
                }

                if (tempSearchPatternFeature) {
                    sarEditLayer.getSource().addFeatures(tempSearchPatternFeature);
                }

                updateSelection();
                updateContext();
            }

            var drawSar = function (sar) {
                var active = sar.status !== SarStatus.ENDED;

                if (sar.output.searchArea && sar.output.searchArea.A) {
                    createSearchArea(sar, active);
                }

                if (sar.input.type === Operation.BackTrack || sar.input.type === Operation.TrackLine) {
                    var pos;
                    if (sar.input.objectPosition) {
                        pos = embryo.geo.Position.create(sar.input.objectPosition);
                        sarLayer.getSource().addFeature(new ol.Feature({
                            geometry: OpenlayerService.createPoint([pos.lon, pos.lat]),
                            type: 'position',
                            label: "Found object ",
                            sarId: sar._id
                        }));
                    }

                    if (sar.output.rdv) {
                        addDriftVector([sar.output.rdv.positions[0], pos], sar._id);
                        addDriftVector(prepareDriftVectors(sar.output.rdv.positions), sar._id)
                    }
                    if (sar.output.circle) {
                        addSearchRing(sar._id, sar.output.circle, active);
                    }
                    if (sar.input && sar.input.planedRoute && sar.input.planedRoute.points) {
                        addDriftVector(sar.input.planedRoute.points, sar._id);
                    }
                    if (sar.input && sar.input.selectedPositions) {
                        for (var i in sar.input.selectedPositions) {
                            var label = sar.input.selectedPositions.length === 1 ? 'LKP' : ('DSP ' + (1 + i));
                            pos = embryo.geo.Position.create(sar.input.selectedPositions[i]);
                            sarLayer.getSource().addFeature(new ol.Feature({
                                geometry: OpenlayerService.createPoint([pos.lon, pos.lat]),
                                type: 'position',
                                label: label,
                                sarId: sar._id
                            }));
                        }
                    }
                    return;
                }
                if (sar.output.circle) {
                    addLabelPoint(sar.input.lastKnownPosition, "LKP", sar._id);
                    addRdv(sar.input.lastKnownPosition, sar.output.circle.datum, "Datum", sar._id);
                    if (sar.output.rdv.positions) {
                        addSearchRing(sar._id, sar.output.circle, active);
                        addDriftVector(prepareDriftVectors(sar.output.rdv.positions), sar._id)
                    }
                } else if (sar.output.downWind) {
                    addLabelPoint(sar.input.lastKnownPosition, "LKP", sar._id);
                    drawDatumPoint(sar._id, sar.input.lastKnownPosition, sar.output, active);
                } else if (sar.output.dsps) {
                    for (var index in sar.output.dsps) {
                        var dsp = sar.output.dsps[index];
                        drawDatumPoint(sar._id, sar.input.dsps[index], dsp, active);
                    }
                    addDspLine(sar.input.dsps, sar._id);
                    addSarPolygonSearchArea(sar, active);
                }

                function createSearchArea(sar, active) {
                    var searchArea = sar.output.searchArea;

                    var A = embryo.geo.Position.create(searchArea.A);
                    var B = embryo.geo.Position.create(searchArea.B);
                    var C = embryo.geo.Position.create(searchArea.C);
                    var D = embryo.geo.Position.create(searchArea.D);

                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPolygon([[A.lon, A.lat], [B.lon, B.lat], [C.lon, C.lat], [D.lon, D.lat]]),
                        type: "area",
                        active: active,
                        sarId: sar._id
                    }));
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPoint([A.lon, A.lat]),
                        type: "areaLabel",
                        label: "A",
                        sarId: sar._id
                    }));
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPoint([B.lon, B.lat]),
                        type: "areaLabel",
                        label: "B",
                        sarId: sar._id
                    }));
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPoint([C.lon, C.lat]),
                        type: "areaLabel",
                        label: "C",
                        sarId: sar._id
                    }));
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPoint([D.lon, D.lat]),
                        type: "areaLabel",
                        label: "D",
                        sarId: sar._id
                    }));
                }

                function drawDatumPoint(id, startPosition, data, active) {
                    if (data.downWind.rdv.positions) {
                        addSearchRing(id, data.downWind.circle, active);
                        addDriftVector(prepareDriftVectors(data.downWind.rdv.positions), id)
                    }
                    if (data.min.rdv.positions) {
                        addSearchRing(id, data.min.circle, active);
                        addDriftVector(prepareDriftVectors(data.min.rdv.positions.slice(1)), id);
                        addRdv(startPosition, data.min.circle.datum, "Datum min", id);
                    }
                    if (data.max.rdv.positions) {
                        addSearchRing(id, data.max.circle, active);
                        addDriftVector(prepareDriftVectors(data.max.rdv.positions.slice(0)), id);
                        addRdv(startPosition, data.max.circle.datum, "Datum max", id);
                    }
                    addRdv(startPosition, data.downWind.circle.datum, "Datum down wind", id);
                }

                function addDspLine(dsps, sarId) {
                    var lonLats = [];
                    for (var index in dsps) {
                        var dsp = dsps[index];
                        addLabelPoint(dsp, "DSP " + (1 + parseInt(index)), sarId);

                        var dspPos = embryo.geo.Position.create(dsp);
                        lonLats.push([dspPos.lon, dspPos.lat]);
                    }

                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createLineString(lonLats),
                        type: "dsp"
                    }));
                }

                function addSarPolygonSearchArea(sar, active) {
                    if (!sar || !sar.output || !sar.output.searchArea || !sar.output.searchArea.polygons) {
                        return;
                    }

                    for (var j in sar.output.searchArea.polygons) {
                        var polygon = sar.output.searchArea.polygons[j];
                        var lonLats = [];
                        for (var index in polygon) {
                            var pos = polygon[index];
                            lonLats.push([pos.lon, pos.lat]);
                        }

                        sarLayer.getSource().addFeature(new ol.Feature({
                            geometry: OpenlayerService.createPolygon(lonLats),
                            type: "area",
                            active: active,
                            sarId: sar._id
                        }));
                    }
                }
            };

            var drawEffortAllocationZone = function (effAll) {
                var area = effAll.area;

                var A = embryo.geo.Position.create(area.A);
                var B = embryo.geo.Position.create(area.B);
                var C = embryo.geo.Position.create(area.C);
                var D = embryo.geo.Position.create(area.D);

                var f = new ol.Feature({
                    geometry: OpenlayerService.createPolygon([[A.lon, A.lat], [B.lon, B.lat], [C.lon, C.lat], [D.lon, D.lat]]),
                    type: "zone",
                    status: effAll.status,
                    label: effAll.name,
                    id: effAll._id,
                    sarId: effAll.sarId
                });

                if (effAll.status === embryo.sar.effort.Status.Active) {
                    sarLayer.getSource().addFeature(f);
                } else {
                    f.set("edit", true, true);
                    sarEditLayer.getSource().addFeature(f);
                }
            };

            var drawSearchPattern = function (pattern, temporary) {
                var points = Route.build(pattern).createRoutePoints();

                if (pattern.type === SearchPattern.SectorSearch) {
                    var radiusInMeters = nmToMeters(pattern.radius);
                    var center = pattern.wps[1];
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createCircularPolygon([center.longitude, center.latitude], radiusInMeters),
                        type: 'circle',
                        sarId: pattern.sarId,
                        id: pattern._id,
                        temp: !!temporary
                    }));
                } else if (pattern.type === SearchPattern.TrackLineNonReturn || pattern.type === SearchPattern.TrackLineReturn) {
                    if (temporary) {
                        var point = null;
                        if (pattern.dragPoint.lon) {
                            point = OpenlayerService.createPoint([pattern.dragPoint.lon, pattern.dragPoint.lat]);
                        } else {
                            point = OpenlayerService.createPoint([pattern.dragPoint.longitude, pattern.dragPoint.latitude]);
                        }

                        sarEditLayer.getSource().addFeature(new ol.Feature({
                            geometry: point,
                            type: "dragPoint",
                            sarId: pattern.sarId,
                            id: pattern._id + "drag",
                            temp: !!temporary,
                            edit: true
                        }));
                    }
                }

                var csp = points[0];
                if (csp) {
                    sarLayer.getSource().addFeature(new ol.Feature({
                        geometry: OpenlayerService.createPoint(csp),
                        type: 'circleLabel',
                        label: 'CSP',
                        id: pattern._id,
                        sarId: pattern.sarId,
                        temp: !!temporary
                    }));
                }

                var searchPatternFeature = undefined;
                if (points && points.length > 0) {
                    searchPatternFeature = new ol.Feature({
                        geometry: OpenlayerService.createLineString(points),
                        type: "searchPattern",
                        id: pattern._id,
                        sarId: pattern.sarId,
                        temp: !!temporary,
                        edit: true
                    });
                    sarEditLayer.getSource().addFeature(searchPatternFeature);
                }

                return searchPatternFeature;
            };

            var drawLogPosition = function (log) {
                var position = embryo.geo.Position.create(log);

                sarLayer.getSource().addFeature(new ol.Feature({
                    geometry: OpenlayerService.createPoint([position.lon, position.lat]),
                    type: log["@type"],
                    label: log.value,
                    id: log._id,
                    sarId: log.sarId
                }));
            };

            function addDriftVector(positions, sarId) {
                if (!positions || positions.length === 0) {
                    return
                }

                var lonLats = [];
                var length = positions.length;
                for (var i = 0; i < length; i++) {
                    var position = embryo.geo.Position.create(positions[i]);
                    lonLats.push([position.lon, position.lat]);
                }
                sarLayer.getSource().addFeature(new ol.Feature({
                    geometry: OpenlayerService.createLineString(lonLats),
                    type: "dv",
                    sarId: sarId
                }));

            }

            function prepareDriftVectors(positions) {
                if (!positions) {
                    return null;
                }

                var points = [];
                var length = positions ? positions.length : 0;
                for (var i = 0; i < length; i++) {
                    points.push(embryo.geo.Position.create(positions[i]));
                }
                return points;
            }

            function addSearchRing(id, circle, active) {
                if (!circle) {
                    return
                }

                var radiusInMeters = nmToMeters(circle.radius);
                var datum = embryo.geo.Position.create(circle.datum);
                var olCircle = OpenlayerService.createCircularPolygon([datum.lon, datum.lat], radiusInMeters);
                sarLayer.getSource().addFeature(new ol.Feature({
                    geometry: olCircle,
                    type: 'circle',
                    active: active,
                    sarId: id
                }));
            }

            function addLabelPoint(lkp, label, sarId) {
                var position = embryo.geo.Position.create(lkp);
                sarLayer.getSource().addFeature(new ol.Feature({
                    geometry: OpenlayerService.createPoint([position.lon, position.lat]),
                    label: label,
                    type: "lkpLabel",
                    sarId: sarId
                }));
            }

            function addRdv(lkp, datum, label, id) {
                addDriftVector([lkp, datum], id);

                var datumd = embryo.geo.Position.create(datum)

                sarLayer.getSource().addFeature(new ol.Feature({
                    geometry: OpenlayerService.createPoint([datumd.lon, datumd.lat]),
                    type: 'circleLabel',
                    label: label,
                    sarId: id
                }));
            }

            var tempSearchPatternFeature;

            function drawTemporarySearchPattern(searchPattern) {
                removeTemporarySearchPattern();
                tempSearchPatternFeature = drawSearchPattern(searchPattern, true);
            }

            function removeTemporarySearchPattern() {
                tempSearchPatternFeature = undefined;

                removeTempFeatures(sarLayer);
                removeTempFeatures(sarEditLayer);

                function removeTempFeatures(layer) {
                    layer.getSource().getFeatures().forEach(function (f) {
                        var temp = f.get('temp');
                        if (temp) {
                            layer.getSource().removeFeature(f);
                        }
                    });
                }
            }

            function updateSelection() {
                var selectedFeature = modifyRectangleInteraction.getSelectedFeature();
                modifyRectangleInteraction.clearSelection();
                if (selectedFeature) {
                    var id = selectedFeature.get("id");
                    var newSelectedFeature = sarEditLayer.getSource().getFeatures().find(function (feature) {
                        var candidateId = feature.get("id");
                        return id === candidateId;
                    });

                    if (newSelectedFeature) {
                        modifyRectangleInteraction.replaceSelection(newSelectedFeature);
                    }
                }
            }

            var olScope = ctrl.getOpenlayersScope();
            olScope.getMap().then(function (map) {
                map.addLayer(sarLayer);
                map.addLayer(sarEditLayer);

                function createModifyRectangleInteraction() {
                    modifyRectangleInteraction = ModifyRectangleInteractionFactory.create(map, sarEditLayer);
                }

                if (NotifyService.hasOccurred(SarEvents.SarFeatureActive)) {
                    createModifyRectangleInteraction();
                    updateContextToActive();
                }

                NotifyService.subscribe(scope, SarEvents.SarFeatureActive, function () {
                    if (!modifyRectangleInteraction) {
                        createModifyRectangleInteraction();
                    }
                    updateContextToActive();
                    sarLayer.setVisible(true);
                    sarEditLayer.setVisible(true);
                });

                NotifyService.subscribe(scope, SarEvents.SarFeatureInActive, function () {
                    if (modifyRectangleInteraction) {
                        modifyRectangleInteraction.destroy(map);
                        modifyRectangleInteraction = null;
                    }
                    updateContextToInActive();
                });

                // Clean up when the scope is destroyed
                scope.$on('$destroy', function () {
                    if (angular.isDefined(sarLayer)) {
                        map.removeLayer(sarLayer);
                    }
                    if (angular.isDefined(sarEditLayer)) {
                        map.removeLayer(sarEditLayer);
                    }
                    if (modifyRectangleInteraction) {
                        modifyRectangleInteraction.destroy(map);
                    }
                });
            });

            function updateContext() {
                var newContext = Object.assign({}, sarLayer.get('context'));
                sarLayer.set('context', newContext);
                newContext = Object.assign({}, sarEditLayer.get('context'));
                sarEditLayer.set('context', newContext);
            }

            function updateContextToActive() {
                var newContext = Object.assign({}, sarLayer.get('context'));
                newContext.active = true;
                sarLayer.set('context', newContext);
                newContext = Object.assign({}, sarEditLayer.get('context'));
                newContext.active = true;
                sarEditLayer.set('context', newContext);
            }

            function updateContextToInActive() {
                var newContext = Object.assign({}, sarLayer.get('context'));
                newContext.active = false;
                sarLayer.set('context', newContext);
                newContext = Object.assign({}, sarLayer.get('context'));
                newContext.active = false;
                sarEditLayer.set('context', newContext);
            }
        }
    }
})();