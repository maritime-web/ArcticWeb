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

            var projMercator = 'EPSG:3857';
            var proj4326 = 'EPSG:4326';

            var mapDefaultLongitude = -44;
            var mapDefaultLatitude = 60;
            var mapDefaultZoomLevel = 7;

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

            /** Converts xy extent array in mercator to a lon-lat extent array */
            this.toLonLatExtent = function (xyExtent) {
                if (xyExtent && xyExtent.length == 4) {
                    var minPos = this.toLonLat([xyExtent[0], xyExtent[1]]);
                    var maxPos = this.toLonLat([xyExtent[2], xyExtent[3]]);
                    return [minPos[0], minPos[1], maxPos[0], maxPos[1]];
                }
                return null;
            };

            /** ************************ **/
            /** Standard map layers      **/
            /** ************************ **/

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


