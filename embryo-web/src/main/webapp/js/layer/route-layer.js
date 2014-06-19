function RouteLayer() {
    this.init = function() {
        var colors = {
            "active" : "#FF0000",
            "planned" : "#D5672D",
            "otheractive" : "#3E7D1D",
            "otherplanned" : "#2AAC0C",
            "ownschedule" : "#000000",
            "otherschedule" : "#999999"
        // Another green : "#2AAC0C"
        // orig green 2a6237
        };
        var that = this;

        this.layers = [];
        // Create vector layer for routes
        var yourDefault = OpenLayers.Util.applyDefaults({
            orientation : true,
            strokeWidth : "${getStrokeWidth}",
            strokeDashstyle : "${getStrokeStyle}",
            strokeColor : "${getColor}",
            strokeOpacity : "${getOpacity}"
        }, OpenLayers.Feature.Vector.style["default"]);

        var context = {
            getOpacity : function() {
                return that.active ? 1 : 0.3;
            },
            getStrokeWidth : function(feature) {
                return feature.attributes.featureType === 'route' ? 2 : 1;
            },
            getStrokeStyle : function(feature) {
                return feature.attributes.featureType === 'route' ? 'dashdot' : 'solid';
            },
            getColor : function(feature) {
                if (feature.attributes.featureType === 'schedule') {
                    return feature.attributes.data.own ? colors['ownschedule'] : colors['otherschedule'];
                }
                if (feature.attributes.data.active) {
                    return feature.attributes.data.own ? colors['active'] : colors['otheractive'];
                }
                return feature.attributes.data.own ? colors['planned'] : colors['otherplanned'];
            }
        };

        var defaultStyle = new OpenLayers.Style(yourDefault, {
            context : context
        });

        var select = OpenLayers.Util.applyDefaults({}, OpenLayers.Feature.Vector.style.select);
        var selectStyle = new OpenLayers.Style(select);

        var temporary = OpenLayers.Util.applyDefaults({}, OpenLayers.Feature.Vector.style.temporary);
        var temporaryStyle = new OpenLayers.Style(temporary);

        this.layers.route = new OpenLayers.Layer.Vector("routeLayer", {
            renderers : [ 'SVGExtended', 'VMLExtended', 'CanvasExtended' ],
            styleMap : new OpenLayers.StyleMap({
                'default' : defaultStyle,
                'select' : selectStyle,
                'temporary' : temporaryStyle
            })
        });
    };

    this.createRoutePoints = function(route) {
        var firstPoint = true;
        var previousWps = null;
        var points = [];

        for ( var index in route.wps) {
            if (!firstPoint && previousWps.heading === 'GC') {
                var linePoints = this.createGeoDesicLineAsGeometryPoints({
                    y : previousWps.latitude,
                    x : previousWps.longitude
                }, {
                    y : route.wps[index].latitude,
                    x : route.wps[index].longitude
                });
                linePoints.shift();
                points = points.concat(linePoints);
            }

            points = points.concat(this.toGeometryPoints([ {
                y : route.wps[index].latitude,
                x : route.wps[index].longitude
            } ]));
            firstPoint = false;
            previousWps = route.wps[index];
        }
        return points;
    };

    this.createVoyagePoints = function(voyages) {
        var points = [];
        for (var index = 0; index < (voyages.length - 1); index++){
            var linePoints = this.createGeoDesicLineAsGeometryPoints({
                y : voyages[index].latitude,
                x : voyages[index].longitude
            }, {
                y : voyages[index+1].latitude,
                x : voyages[index+1].longitude
            });
            points = points.concat(linePoints);
        }
        return points;
    };

    this.createVectorFeature = function(data, colorKey) {
        var feature = null;
        var points = [];
        var type = '';
        var id = '';

        if (data && data.wps) {
            type = 'route';
            points = this.createRoutePoints(data);
            id = data.id;
        } else if (data && data.voyages instanceof Array) {
            type = 'schedule';
            if (data.voyages.length > 0) {
                id = data.voyages[0].maritimeId;
                points = this.createVoyagePoints(data.voyages);
            }
        }

        if (points.length > 0) {
            var multiLine = new OpenLayers.Geometry.MultiLineString([ new OpenLayers.Geometry.LineString(points) ]);
            feature = new OpenLayers.Feature.Vector(multiLine, {
                renderers : [ 'SVGExtended', 'VMLExtended', 'CanvasExtended' ],
                featureType : type,
                data : data,
                colorKey : colorKey,
                id : id
            });
        }

        return feature;
    };

    this.containsVoyageRoute = function(voyage) {
        function featureFilter(feature) {
            if(voyage.route){
                return feature.attributes.featureType === 'route' && feature.attributes.id === voyage.route.id;
            }
            return feature.attributes.featureType === 'schedule' && feature.attributes.id === voyage.maritimeId;
        }
        return this.containsFeature(featureFilter, this.layers.route);
    };
    
    this.removeVoyageRoute = function(voyage) {
        function featureFilter(feature) {
            if(voyage.route){
                return feature.attributes.featureType === 'route' && feature.attributes.id === voyage.route.id;
            }
            return feature.attributes.featureType === 'schedule' && feature.attributes.id === voyage.maritimeId;
        }
        return this.hideFeatures(featureFilter);
    };

    this.clear = function() {
        this.layers.route.removeAllFeatures();
    };

    this.draw = function(routes) {
        var features = [];
        for ( var index in routes) {
            var feature = this.createVectorFeature(routes[index]);
            if (feature != null) {
                features.push(feature);
            }
        }
        this.layers.route.addFeatures(features);
        this.layers.route.refresh();
    };
}

RouteLayer.prototype = new EmbryoLayer();

/*
 * Can be used to create only one route layer instance and reuse this as
 */
var RouteLayerSingleton = {
    instance : null,
    getInstance : function() {
        if (this.instance == null) {
            this.instance = new RouteLayer();
            addLayerToMap("vessel", this.instance, embryo.map);
        }
        return this.instance;
    }
};
