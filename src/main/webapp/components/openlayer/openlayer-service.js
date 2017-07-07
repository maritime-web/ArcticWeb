(function () {
    'use strict';

    angular
        .module('embryo.components.openlayer')
        .service('OpenlayerService', OpenlayerService);

    function OpenlayerService() {

        var projMercator = 'EPSG:3857';
        var proj4326 = 'EPSG:4326';

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
    }
})();