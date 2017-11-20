(function(){

    var module = angular.module('embryo.route.model',['embryo.geo.services']);

    module.factory('Route', ['Position', function (Position) {
        function Route(data) {
            angular.extend(this, data);
        }

        Route.prototype.length = function(){
            if(!this.waypoints || this.waypoints.length <= 1){
                return 0
            }
            var length = 0;
            for(var i = 0; i < this.waypoints.length - 1; i++){
                var wps1 = Position.create(this.waypoints[i].longitude, this.waypoints[i].latitude);
                var wps2 = Position.create(this.waypoints[i+1].longitude, this.waypoints[i+1].latitude);
                length += wps1.distanceTo(wps2, this.waypoints[i].heading)
            }
            return length;
        };

        Route.prototype.createRoutePoints = function () {
            var firstPoint = true;
            var previousWps = null;
            var points = [];

            for (var index in this.wps) {
                if (!firstPoint && previousWps.heading === 'GC') {
                    var linePoints = createGeoDesicLineAsGeometryPoints({
                        y: previousWps.latitude,
                        x: previousWps.longitude
                    }, {
                        y: this.wps[index].latitude,
                        x: this.wps[index].longitude
                    });

                    linePoints.shift();
                    points = points.concat(linePoints);
                }

                points = points.concat(toGeometryPoints([{
                    y: this.wps[index].latitude,
                    x: this.wps[index].longitude
                }]));
                firstPoint = false;
                previousWps = this.wps[index];
            }

            return points;

            function createGeoDesicLineAsGeometryPoints(p1, p2) {
                var generator = new arc.GreatCircle(p1, p2, {
                    'foo': 'bar'
                });
                var line = generator.Arc(100, {
                    offset: 10
                });

                var points = [];
                for (var i in line.geometries) {
                    for (var j in line.geometries[i].coords) {
                        points.push([line.geometries[i].coords[j][0], line.geometries[i].coords[j][1]]);
                    }
                }

                return points;
            }

            function toGeometryPoints(points) {
                var geometryPoints = [];
                for (var index in points) {
                    geometryPoints.push([points[index].x, points[index].y]);
                }
                return geometryPoints;
            }
        };

        Route.build = function (json) {
            return new Route(json);
        };
        return Route;
    }]);
})();