(function () {
    "use strict";

    var module = angular.module('embryo.sar.SearchCircle', ['embryo.geo.services']);

    module.factory('SearchCircle', ["Position", "Circle", function (Position, Circle) {
        function SearchCircle(data) {
            angular.extend(this, data);
        }

        SearchCircle.prototype.toPolygonOfPositions = function(numberOfVertices){
            return Circle.create(Position.create(this.datum), this.radius).toPolygon(numberOfVertices)
        }

        SearchCircle.prototype.toGeoCircle = function(){
            return Circle.create(Position.create(this.datum), this.radius);
        }

        SearchCircle.validate = function(xError, yError, safetyFactor, rdvDistance, datum) {
            assertValue(xError, "xError");
            assertValue(yError, "yError");
            assertValue(safetyFactor, "safetyFactor");
            assertValue(datum, "datum");
            assertValue(rdvDistance, "rdvDistance");
        }
        SearchCircle.calculateRadius = function(xError, yError, rdvDistance, safetyFactor) {
            return ((xError + yError) + 0.3 * rdvDistance) * safetyFactor;
        }
        SearchCircle.build = function(xError, yError, safetyFactor, rdvDistance, datum){
            SearchCircle.validate(xError, yError, safetyFactor, rdvDistance, datum);
            var radius = SearchCircle.calculateRadius(xError, yError, rdvDistance, safetyFactor);
            return new SearchCircle({
                radius : radius,
                datum : datum.toDegreesAndDecimalMinutes()
            });
        }
        SearchCircle.create = function(radius, datum){
            return new SearchCircle({
                radius : radius,
                datum : datum.toDegreesAndDecimalMinutes()
            });
        }

        return SearchCircle;
    }]);
})();
