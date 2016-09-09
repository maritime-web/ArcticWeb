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
                var wps1 = Position.create(this.waypoints[i].longitude, this.waypoints[i].latitude)
                var wps2 = Position.create(this.waypoints[i+1].longitude, this.waypoints[i+1].latitude)
                length += wps1.distanceTo(wps2, this.waypoints[i].heading)
            }
            return length;
        }

        Route.build = function (json) {
            return new Route(json);
        }
        return Route;
    }]);
})();
