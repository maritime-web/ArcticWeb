function SarLayer() {

    var nmToMeters = embryo.geo.Converter.nmToMeters;

    var that = this;

    that.zoomLevels = [8, 10, 12];

    this.init = function () {
        var opacityFactor = {
            true: 1.0,
            false: 0.5
        }

        var context = {

            color: function (feature) {
                if (feature.attributes.type == embryo.sar.Type.Log) {
                    return "black";
                }
                if (feature.attributes.type == "zone") {
                    return feature.attributes.status == embryo.sar.effort.Status.Active ? "#7D877A" : "red"
                }
                if (feature.attributes.type == 'dv' || feature.attributes.type == 'dsp') {
                    return "black";
                }
                if (feature.attributes.type == 'searchPattern') {
                    return "red";
                }
                if (feature.attributes.type) {
                    return feature.attributes.active ? "green" : "#999";
                }

                // extra feature (circle) added by ModifyFeature control
                return "red";
            },
            strokeWidth: function () {
                return that.zoomLevel >= 1 ? 2 : 1;
            },
            strokeOpacity: function (feature) {
                if (feature.attributes.type === 'dv' || feature.attributes.type == 'dsp') {
                    return 0.7 * opacityFactor[that.active];
                }
                return 0.6 * opacityFactor[that.active];
            },
            strokeDashstyle: function (feature){
                return feature.attributes.type == 'dsp' ? "dot" : "solid";
            },
            fillOpacity: function () {
                return 0.2 * opacityFactor[that.active];
            },
            label: function (feature) {
                if (feature.attributes.type == "areaLabel") {
                    return that.zoomLevel >= 1 ? feature.attributes.label : "";
                }
                if (feature.attributes.type == "zone") {
                    return that.zoomLevel >= 2 ? feature.attributes.label : "";
                }
                if (feature.attributes.type == "circleLabel" || feature.attributes.type == "lkpLabel") {
                    return that.zoomLevel >= 3 ? feature.attributes.label : "";
                }
                if (feature.attributes.type == embryo.sar.Type.Log) {
                    return that.zoomLevel >= 2 ? feature.attributes.label : "";
                }

                var value = feature.attributes.label ? feature.attributes.label : "";
                return value;
            },
            fontTransparency: function () {
                return opacityFactor[that.active]
            },
            graphicName: function (feature) {
                if (feature.attributes.type === embryo.sar.Type.Log) {
                    return "x"
                }
                return "";
            },
            pointRadius: function (feature) {
                if (feature.attributes.type === embryo.sar.Type.Log) {
                    if (that.zoomLevel >= 3) {
                        return 15
                    }
                    if (that.zoomLevel >= 2) {
                        return 10
                    }
                    return 5
                }
                return 1;
            },
            orientation: function (feature){
                if(feature.attributes.type == "dsp"){
                    return false;
                }
                return true;
            }
        };

        var defaultStyle = {
            orientation: "${orientation}",
            fontOpacity: "${fontTransparency}",
            fillColor: "${color}",
            fillOpacity: "${fillOpacity}",
            strokeWidth: "${strokeWidth}",
            strokeColor: "${color}",
            strokeOpacity: "${strokeOpacity}",
            strokeDashstyle : "${strokeDashstyle}",
            label: "${label}",
            graphicName: "${graphicName}",
            pointRadius: "${pointRadius}"
        }

        this.layers.sar = new OpenLayers.Layer.Vector("SAR Layer", {
            renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style(defaultStyle, {
                    context: context
                })
            })
        })

        var defaultEditStyle = {
            orientation: "${temp}",
            fontOpacity: "${fontTransparency}",
            fillColor: "${color}",
            fillOpacity: "${fillOpacity}",
            strokeWidth: "${strokeWidth}",
            strokeColor: "${color}",
            strokeOpacity: "${strokeOpacity}",
            pointRadius: 10,
            pointerEvents: "visible",
            label: "${label}"
        }

        this.layers.sarEdit = new OpenLayers.Layer.Vector("SAR Edit Layer", {
            renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style(defaultEditStyle, {context: context}),
                "select": new OpenLayers.Style(defaultEditStyle, {context: context}),
                "temporary": new OpenLayers.Style(defaultEditStyle, {context: context})
            })
        });

        function fireModified(feature) {
            if (that.modified) {
                var zoneUpdate = {
                    _id: feature.attributes.id,
                    area: {
                        // list of points (components) are always created as A, B, C, D in drawEffortAllocationZone
                        // An extra point A is added to the list, because OpenLayers is closing the polygon.
                        // We are however just using the first 4 points (A, B, C and D)
                        A: that.map.transformToPosition(feature.geometry.components[0]),
                        B: that.map.transformToPosition(feature.geometry.components[1]),
                        C: that.map.transformToPosition(feature.geometry.components[2]),
                        D: that.map.transformToPosition(feature.geometry.components[3])
                    }
                }

                zoneUpdate.area.A = embryo.geo.Position.create(zoneUpdate.area.A).toDegreesAndDecimalMinutes();
                zoneUpdate.area.B = embryo.geo.Position.create(zoneUpdate.area.B).toDegreesAndDecimalMinutes();
                zoneUpdate.area.C = embryo.geo.Position.create(zoneUpdate.area.C).toDegreesAndDecimalMinutes();
                zoneUpdate.area.D = embryo.geo.Position.create(zoneUpdate.area.D).toDegreesAndDecimalMinutes();

                that.modified(zoneUpdate)
            }
        }

        this.layers.sarEdit.events.on({
            "featuremodified": function (event) {
                fireModified(event.feature);
            }/*,
            "afterfeaturemodified": function (event) {
             console.log(event)
                fireModified(event.feature);
             }*/
        });

        this.controls.modify = new embryo.Control.ModifyRectangleFeature(this.layers.sarEdit,
            {mode: embryo.Control.ModifyRectangleFeature.DRAG | embryo.Control.ModifyRectangleFeature.RESHAPE});
    };

    /*
     TODO
     Temporary solution
     Should be moved into some general solution in map.js like it is for selectable layers
     */
    embryo.groupChanged(function (e) {
        if (e.groupId == "sar") {
            that.deactivateSelectable();
            that.controls.modify.activate();
            //that.controls.drag.activate();
        } else {
            that.activateSelectable();
            that.controls.modify.deactivate();
            //that.controls.drag.deactivate();
        }

        //this.deactivateSelectable();
        //this.controls.modify.activate();
        //this.activateControls()


        /*
         //Code like below can enable selection of both modifiable features and other features e.g. vessels

         var selectableLayers = this.map.selectLayerByGroup["vessel"];
         selectableLayers = selectableLayers.concat(this.layers.sarEdit);

         this.controls.modify.standalone = true;
         this.controls.modify.activate();
         this.deactivateSelectable();
         this.map.selectControl.setLayer(selectableLayers);

         var that = this;

         this.layers.sarEdit.events.on({
         featureselected: function(evt) { that.controls.modify.selectFeature(evt.feature); },
         featureunselected: function(evt) { that.controls.modify.unselectFeature(evt.feature); }
         });

         this.activateSelectable()
         */
        //this.deactivateControls();
        //this.controls.drag.activate();
        //this.activateControls();
        //this.activateSelectable();

    });

    function createSearchArea(sar, active) {
        var searchArea = sar.output.searchArea;
        var features = [];

        var A = embryo.geo.Position.create(searchArea.A);
        var B = embryo.geo.Position.create(searchArea.B);
        var C = embryo.geo.Position.create(searchArea.C);
        var D = embryo.geo.Position.create(searchArea.D);

        var pointA = embryo.map.createPoint(A.lon, A.lat);
        var pointB = embryo.map.createPoint(B.lon, B.lat);
        var pointC = embryo.map.createPoint(C.lon, C.lat);
        var pointD = embryo.map.createPoint(D.lon, D.lat);
        var square = new OpenLayers.Geometry.LinearRing([pointA, pointB, pointC, pointD]);
        features.push(new OpenLayers.Feature.Vector(square, {
            type: "area",
            active: active,
            sarId: sar._id
        }));
        features.push(new OpenLayers.Feature.Vector(pointA, {
            type: "areaLabel",
            label: "A",
            sarId: sar._id
        }));
        features.push(new OpenLayers.Feature.Vector(pointB, {
            type: "areaLabel",
            label: "B",
            sarId: sar._id
        }));
        features.push(new OpenLayers.Feature.Vector(pointC, {
            type: "areaLabel",
            label: "C",
            sarId: sar._id
        }));
        features.push(new OpenLayers.Feature.Vector(pointD, {
            type: "areaLabel",
            label: "D",
            sarId: sar._id
        }));

        return features;
    }

    function addSarPolygonSearchArea(layer, sar, active) {
        if (!sar || !sar.output || !sar.output.searchArea || !sar.output.searchArea.polygons) {
            return;
        }

        var points = [];
        for (var j in sar.output.searchArea.polygons){
            var polygon = sar.output.searchArea.polygons[j];
            for (var index in polygon) {
                var pos = polygon[index];
                points.push(embryo.map.createPoint(pos.lon, pos.lat));
            }
            layer.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LinearRing(points), {
                type: "area",
                active: active,
                sarId: sar._id
            })])
        }
    }


    function addDriftVector(layer, positions) {
        var points = []
        var length = positions.length;
        for (var i = 0; i < length; i++) {
            var position = embryo.geo.Position.create(positions[i]);
            points.push(embryo.map.createPoint(position.lon, position.lat));
        }
        var features = [new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(points), {
//            renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
            type: "dv"
        })];
        layer.addFeatures(features);
    }

    function addLKP(layer, lkp, sarId) {
        var position = embryo.geo.Position.create(lkp);
        var features = [new OpenLayers.Feature.Vector(embryo.map.createPoint(position.lon, position.lat), {
            label: "LKP",
            type: "lkpLabel",
            sarId: sarId
        })];
        layer.addFeatures(features);
    }

    function prepareDriftVectors(lkp, twcPositions, leewayPositions) {
        var points = []
        if (lkp) {
            var position = embryo.geo.Position.create(lkp);
            points.push(position);
        }
        var length = twcPositions ? twcPositions.length : 0;
        for (var i = 0; i < length; i++) {
            points.push(embryo.geo.Position.create(twcPositions[i]));
            points.push(embryo.geo.Position.create(leewayPositions[i]))
        }
        return points;
    }

    this.containsDistanceCircle = function (vessel) {
        function featureFilter(feature) {
            return feature.attributes.id === vessel.mmsi && feature.attributes.type === 'circle';
        }

        return this.containsFeature(featureFilter, this.layers.sar);
    };

    this.containsNearestVessel = function (vessel) {
        function featureFilter(feature) {
            return feature.attributes.id === vessel.mmsi && feature.attributes.type === 'nearest';
        }

        return this.containsFeature(featureFilter, this.layers.sar);
    };

    function addSearchRing(id, features, circle, label, active) {
        var radiusInKm = nmToMeters(circle.radius) / 1000;
        var attributes = {
            type: 'circle',
            active: active,
            sarId: id
        }
        var datum = embryo.geo.Position.create(circle.datum)
        features.addFeatures(embryo.adt.createRing(datum.lon, datum.lat, radiusInKm, 1, attributes));

        var center = embryo.map.createPoint(datum.lon, datum.lat);
        features.addFeatures(new OpenLayers.Feature.Vector(center, {
            type: 'circleLabel',
            label: label,
            sarId: id
        }));
    }

    function addRdv(layer, lkp, datum) {
        addDriftVector(layer, [lkp, datum]);
    }


    this.draw = function (sarDocuments) {
        this.layers.sar.removeAllFeatures();
        this.layers.sarEdit.removeAllFeatures();
        for (var index in sarDocuments) {
            if (embryo.sar.Type.SearchArea === sarDocuments[index]['@type']) {
                this.drawSar(sarDocuments[index]);
            } else if (embryo.sar.Type.EffortAllocation === sarDocuments[index]['@type']) {
                this.drawEffortAllocationZone(sarDocuments[index]);
            } else if (embryo.sar.Type.SearchPattern === sarDocuments[index]['@type']) {
                this.drawSearchPattern(sarDocuments[index]);
            } else if (embryo.sar.Type.Log === sarDocuments[index]['@type']) {
                this.drawLogPosition(sarDocuments[index]);
            }
        }

        if(this.tempSearchPatternFeature){
            this.layers.sarEdit.addFeatures([this.tempSearchPatternFeature]);
        }
        this.layers.sar.refresh();
        this.layers.sarEdit.refresh();
    }

    this.drawDatumPoint = function(id, startPosition, data, active){
        addSearchRing(id, this.layers.sar, data.downWind.circle, "Datum down wind", active);
        addSearchRing(id, this.layers.sar, data.min.circle, "Datum min", active);
        addSearchRing(id, this.layers.sar, data.max.circle, "Datum max", active);

        addRdv(this.layers.sar, startPosition, data.downWind.circle.datum);
        addRdv(this.layers.sar, startPosition, data.min.circle.datum);
        addRdv(this.layers.sar, startPosition, data.max.circle.datum);
        addDriftVector(this.layers.sar, prepareDriftVectors(startPosition, data.currentPositions, data.downWind.driftPositions))
        addDriftVector(this.layers.sar, prepareDriftVectors(null, data.currentPositions, data.min.driftPositions))
        addDriftVector(this.layers.sar, prepareDriftVectors(null, data.currentPositions, data.max.driftPositions))
    }

    this.addDspLine = function(layer, dsps){
        var points = []
        for (var index in dsps) {
            var dspPos = embryo.geo.Position.create(dsps[index]);
            points.push(embryo.map.createPoint(dspPos.lon, dspPos.lat));
        }
        var features = [new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(points), {
//            renderers: ['SVGExtended', 'VMLExtended', 'CanvasExtended'],
            type: "dsp"
        })];
        layer.addFeatures(features);
    }

    this.drawSar = function (sar) {
        var active = sar.status != embryo.SARStatus.ENDED;

        if(sar.output.searchArea && sar.output.searchArea.A){
            this.layers.sar.addFeatures(createSearchArea(sar, active));
        }

        if (sar.output.circle) {
            addLKP(this.layers.sar, sar.input.lastKnownPosition, sar._id);
            addSearchRing(sar._id, this.layers.sar, sar.output.circle, "Datum", active);
            addRdv(this.layers.sar, sar.input.lastKnownPosition, sar.output.circle.datum);
            addDriftVector(this.layers.sar, prepareDriftVectors(sar.input.lastKnownPosition, sar.output.currentPositions, sar.output.driftPositions))
        } else if (sar.output.downWind) {
            addLKP(this.layers.sar, sar.input.lastKnownPosition, sar._id);
            this.drawDatumPoint(sar._id, sar.input.lastKnownPosition, sar.output, active);
        } else if (sar.output.dsps){
            for(var index in sar.output.dsps){
                var dsp = sar.output.dsps[index];
                this.drawDatumPoint(sar._id, sar.input.dsps[index], dsp, active);
            }
            this.addDspLine(this.layers.sar, sar.input.dsps);
            addSarPolygonSearchArea(this.layers.sar, sar, active);

        }
    }

    this.drawEffortAllocationZone = function (effAll) {
        var area = effAll.area;

        var A = embryo.geo.Position.create(area.A);
        var B = embryo.geo.Position.create(area.B);
        var C = embryo.geo.Position.create(area.C);
        var D = embryo.geo.Position.create(area.D);

        var pointA = embryo.map.createPoint(A.lon, A.lat);
        var pointB = embryo.map.createPoint(B.lon, B.lat);
        var pointC = embryo.map.createPoint(C.lon, C.lat);
        var pointD = embryo.map.createPoint(D.lon, D.lat);
        var square = new OpenLayers.Geometry.LinearRing([pointA, pointB, pointC, pointD]);
        var feature = new OpenLayers.Feature.Vector(square, {
            type: "zone",
            status: effAll.status,
            label: effAll.name,
            id: effAll._id,
            sarId: effAll.sarId
        });

        if (effAll.status === embryo.sar.effort.Status.Active) {
            this.layers.sar.addFeatures([feature])
        } else {
            this.layers.sarEdit.addFeatures([feature]);
        }
    };

    this.drawLogPosition = function (log) {
        var position = embryo.geo.Position.create(log);
        var point = embryo.map.createPoint(position.lon, position.lat);
        var feature = new OpenLayers.Feature.Vector(point, {
            type: log["@type"],
            label: log.value,
            id: log._id,
            sarId: log.sarId
        });

        this.layers.sar.addFeatures([feature])
    };


    this.drawSearchPattern = function (pattern) {
        var points = this.createRoutePoints(pattern)
        var multiLine = new OpenLayers.Geometry.MultiLineString([ new OpenLayers.Geometry.LineString(points) ]);
        var feature = new OpenLayers.Feature.Vector(multiLine, {
            renderers : [ 'SVGExtended', 'VMLExtended', 'CanvasExtended' ],
            type : "searchPattern",
            id: pattern._id,
            sarId: pattern.sarId
        });
        this.layers.sarEdit.addFeatures([feature]);
        return feature;
    };

    this.zoomToSarOperation = function (sar) {
        this.zoomToFeatures(function (feature) {
            return feature.attributes.sarId == sar._id;
        }, this.zoomLevel == 0)
    }

    this.drawTemporarySearchPattern = function(searchPattern){
        this.removeTemporarySearchPattern();
        this.tempSearchPatternFeature = this.drawSearchPattern(searchPattern);
        this.tempSearchPatternFeature.attributes.temp = true;
    }

    this.removeTemporarySearchPattern = function(){
        delete this.tempSearchPatternFeature;
        this.hideFeatures(function(feature){
            return !!feature.attributes.temp;
        })
    }

}

SarLayer.prototype = new RouteLayer();

/*
 * Can be used to create only one distance layer instance and reuse this as
 */
var SarLayerSingleton = {
    instance: null,
    getInstance: function () {
        return this.instance;
    }
}

embryo.postLayerInitialization(function () {
    SarLayerSingleton.instance = new SarLayer();
    addLayerToMap("sar", SarLayerSingleton.instance, embryo.map);
})


