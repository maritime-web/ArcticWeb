(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .service('OpenlayerService', OpenlayerService);

    function OpenlayerService() {
        this.minResolution = 5;
        this.maxResolution = 18500;

        var projMercator = 'EPSG:3857';
        var proj4326 = 'EPSG:4326';
        var geoJsonFormat = new ol.format.GeoJSON({
            defaultDataProjection: proj4326,
            featureProjection: projMercator
        });

        /** Rounds each value of the array to the given number of decimals */
        this.round = function (values, decimals) {
            for (var x = 0; values && x < values.length; x++) {
                // NB: Prepending a '+' will convert from string to float
                values[x] = +values[x].toFixed(decimals);
            }
            return values;
        };

        /** Converts lon-lat array to xy array in mercator */
        this.fromLonLat = function (lonLat) {
            return lonLat ? ol.proj.fromLonLat(lonLat) : null;
        };


        /** Converts xy array in mercator to a lon-lat array */
        this.toLonLat = function (xy) {
            return xy ? ol.proj.transform(xy, projMercator, proj4326) : null;
        };

        this.getArcticCenter = function () {
            return ol.proj.fromLonLat([-65, 70], undefined);
        };

        /**
         * Creates a ol.geom.LineString from a lon lat array.
         * @param lonLats
         */
        this.createLineString = function(lonLats) {
            /** @type {ol.geom.GeometryLayout|string} */
            var xy = "XY";
            var line = new ol.geom.LineString([], xy);
            lonLats.forEach(function (coord) {
                var mercatorCoord = ol.proj.fromLonLat(coord, undefined);
                line.appendCoordinate(mercatorCoord);
            });

            return line;
        };

        /** Converts a GeoJSON feature to an OL feature **/
        this.geoJsonCollectionToOlFeatures = function (featureCollection) {
            return geoJsonFormat.readFeatures(featureCollection);
        };

        /** Computes the extent for the list of features **/
        this.getFeaturesExtent = function (features) {
            var extent = ol.extent.createEmpty();
            for (var i = 0; features && i < features.length; i++) {
                var geometry = features[i].getGeometry();
                if (geometry) {
                    ol.extent.extend(extent, geometry.getExtent());
                }
            }
            return extent;
        };

        /** Computes the center for the list of features **/
        this.getFeaturesCenter = function (features) {
            var extent = this.getFeaturesExtent(features);
            return ol.extent.isEmpty(extent) ? null : ol.extent.getCenter(extent);
        };
    }
})();