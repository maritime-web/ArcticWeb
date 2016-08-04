/**
 * Map services.
 */
angular.module('vrmt.map')

    /**
     * The language service is used for changing language, etc.
     */
    .service('MapService', [
        function () {
            'use strict';

            var that = this;
            var projMercator = 'EPSG:3857';
            var proj4326 = 'EPSG:4326';
            var geoJsonFormat = new ol.format.GeoJSON();
            var wktFormat = new ol.format.WKT();

            var mapDefaultLongitude = -44;
            var mapDefaultLatitude = 60;
            var mapDefaultZoomLevel = 7;
            var mapMaxZoomLevel = 9;


            /** Returns the data projection */
            this.dataProjection = function () {
                return proj4326;
            };


            /** Returns the feature projection */
            this.featureProjection = function () {
                return projMercator;
            };


            /** Rounds each value of the array to the given number of decimals */
            this.round = function (values, decimals) {
                for (var x = 0; values && x < values.length; x++) {
                    // NB: Prepending a '+' will convert from string to float
                    values[x] = +values[x].toFixed(decimals);
                }
                return values;
            };


            /** Returns the default center position of a map */
            this.defaultCenterLonLat = function () {
                return [mapDefaultLongitude, mapDefaultLatitude];
            };


            /** Returns the default zoom level of a map */
            this.defaultZoomLevel = function () {
                return mapDefaultZoomLevel;
            };


            /** Converts lon-lat array to xy array in mercator */
            this.fromLonLat = function (lonLat) {
                return lonLat ? ol.proj.fromLonLat(lonLat) : null;
            };


            /** Converts xy array in mercator to a lon-lat array */
            this.toLonLat = function (xy) {
                return xy ? ol.proj.transform(xy, projMercator, proj4326) : null;
            };


            /** Converts lon-lat extent array to xy extent array in mercator */
            this.fromLonLatExtent = function (lonLatExtent) {
                if (lonLatExtent && lonLatExtent.length == 4) {
                    var minPos = this.fromLonLat([lonLatExtent[0], lonLatExtent[1]]);
                    var maxPos = this.fromLonLat([lonLatExtent[2], lonLatExtent[3]]);
                    return [minPos[0], minPos[1], maxPos[0], maxPos[1]];
                }
                return null;
            };


            /** Converts xy extent array in mercator to a lon-lat extent array */
            this.toLonLatExtent = function (xyExtent) {
                if (xyExtent && xyExtent.length == 4) {
                    var minPos = this.toLonLat([xyExtent[0], xyExtent[1]]);
                    var maxPos = this.toLonLat([xyExtent[2], xyExtent[3]]);
                    return [minPos[0], minPos[1], maxPos[0], maxPos[1]];
                }
                return null;
            };


            /** Returns the center of the extent */
            this.getExtentCenter = function (extent) {
                var x = extent[0] + (extent[2] - extent[0]) / 2.0;
                var y = extent[1] + (extent[3] - extent[1]) / 2.0;
                return [x, y];
            };


            /** Return a lon-lat center from the xy geometry */
            this.toCenterLonLat = function (geometry) {
                return this.toLonLat(this.getExtentCenter(geometry.getExtent()));
            };


            /** ************************ **/
            /** WKT Functionality    **/
            /** ************************ **/

            /** Converts the given OL geometry to a WKT */
            this.olGeometryToWkt = function (g) {
                return wktFormat.writeGeometry(g, {
                    dataProjection: proj4326,
                    featureProjection: projMercator
                });
            };


            /** Converts the given extent to a WKT */
            this.extentToWkt = function (extent) {
                var polygon =  ol.geom.Polygon.fromExtent(extent);
                return this.olGeometryToWkt(polygon);
            };
            
            
            /** ************************ **/
            /** GeoJSON Functionality    **/
            /** ************************ **/

            /** Serializes the coordinates of a geometry */
            this.serializeCoordinates = function (g, coords, props, index, includeCoord) {
                var that = this;
                props = props || {};
                index = index || 0;
                var bufferFeature = props['parentFeatureId'];
                if (g) {
                    if (g instanceof Array) {
                        if (g.length >= 2 && $.isNumeric(g[0])) {
                            if (includeCoord && !bufferFeature) {
                                coords.push({
                                    lon: g[0],
                                    lat: g[1],
                                    name: props['name:' + index + ':en']
                                });
                            }
                            index++;
                        } else {
                            for (var x = 0; x < g.length; x++) {
                                index = that.serializeCoordinates(g[x], coords, props, index, includeCoord);
                            }
                        }
                    } else if (g.type == 'FeatureCollection') {
                        for (var x = 0; g.features && x < g.features.length; x++) {
                            index = that.serializeCoordinates(g.features[x], coords, props, index, includeCoord);
                        }
                    } else if (g.type == 'Feature') {
                        index = that.serializeCoordinates(g.geometry, coords, g.properties, index, includeCoord);
                    } else if (g.type == 'GeometryCollection') {
                        for (var x = 0; g.geometries && x < g.geometries.length; x++) {
                            index = that.serializeCoordinates(g.geometries[x], coords, props, index, includeCoord);
                        }
                    } else if (g.type == 'MultiPolygon') {
                        for (var p = 0; p < g.coordinates.length; p++) {
                            // For polygons, do not include coordinates for interior rings
                            for (var x = 0; x < g.coordinates[p].length; x++) {
                                index = that.serializeCoordinates(g.coordinates[p][x], coords, props, index, x == 0);
                            }
                        }
                    } else if (g.type == 'Polygon') {
                        // For polygons, do not include coordinates for interior rings
                        for (var x = 0; x < g.coordinates.length; x++) {
                            index = that.serializeCoordinates(g.coordinates[x], coords, props, index, x == 0);
                        }
                    } else if (g.type) {
                        index = that.serializeCoordinates(g.coordinates, coords, props, index, includeCoord);
                    }
                }
                return index;
            };

            /** Converts a GeoJSON geometry to an OL geometry **/
            this.gjToOlGeometry = function (g) {
                return geoJsonFormat.readGeometry(g, {
                    dataProjection: proj4326,
                    featureProjection: projMercator
                });
            };


            /** Converts a GeoJSON feature to an OL feature **/
            this.gjToOlFeature = function (feature) {
                return geoJsonFormat.readFeature(feature, {
                    dataProjection: proj4326,
                    featureProjection: projMercator
                });
            };


            /** ************************ **/
            /** Standard map layers      **/
            /** ************************ **/

            /** Checks if the given layer is visible in the given layer group **/
            this.isLayerVisible = function (nameOfLayer, layerGroup) {
                var layersInGroup = layerGroup.getLayers().getArray();
                for (var i = 0, l; i < layersInGroup.length; i++) {
                    l = layersInGroup[i];
                    if ((l.get('name') === nameOfLayer) && l.get('visible')) {
                        return true;
                    }
                }
                return false;
            };


            /** Creates a group of standard background layers **/
            this.createStdBgLayerGroup = function () {

                return new ol.layer.Group({
                    'title': 'Base maps',
                    layers: [
                        new ol.layer.Tile({
                            title: 'OpenStreetMap',
                            type: 'base',
                            visible: true,
                            source: new ol.source.OSM()
                        })
                    ]
                });
            };

        }]);


