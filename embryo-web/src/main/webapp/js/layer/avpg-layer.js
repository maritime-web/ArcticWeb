function AvpgLayer() {
    this.init = function() {
        this.zoomLevels = [4, 6];

        var that = this;

        var noTransparency = browser.isChrome() && parseFloat(browser.chromeVersion())== 34;
        var context = {
            transparency: function() {
                if(noTransparency){
                    return 1.0;
                }
                return that.active ? 0.8 : 0.4;
            },
            labelTransparency: function() {
                return (that.zoomLevel > 1) && that.active ? 0.8 : 0.01;
            },
            polygonTransparency: function() {
                return that.active ? 0.3 : 0.15;
            },
            offset: function() {
                return -context.size() / 2;
            },
            size: function() {
                return [16, 20, 24][that.zoomLevel];
            },
            description: function(feature) {
                return feature.data.description;
            }
        };

        this.layers.avpg = new OpenLayers.Layer.Vector("avpg", {
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    graphicOpacity: "${transparency}",
                    externalGraphic : "img/green_marker.png",
                    graphicWidth : "${size}",
                    graphicHeight : "${size}",
                    graphicYOffset : "${offset}",
                    graphicXOffset : "${offset}",
                    fontColor: "#000",
                    fontSize: "10px",
                    fontOpacity: "${labelTransparency}",
                    fontFamily: "Courier New, monospace",
                    label : "${description}",
                    fontWeight: "bold",
                    labelOutlineWidth : 0,
                    labelYOffset: -20,
                    fillColor: "#ad57a1",
                    fillOpacity: "${polygonTransparency}",
                    strokeWidth: 3,
                    strokeColor: "#8f2f7b",
                    strokeOpacity: "${polygonTransparency}"

                }, { context: context }),
                "select": new OpenLayers.Style({
                    graphicOpacity: 1,
                    externalGraphic : "img/green_marker.png",
                    graphicWidth : 24,
                    graphicHeight : 24,
                    graphicYOffset : -12,
                    graphicXOffset : -12,
                    backgroundGraphic: "img/ring.png",
                    backgroundXOffset: -16,
                    backgroundYOffset: -16,
                    backgroundHeight: 32,
                    backgroundWidth: 32,

                    fontColor: "#000",
                    fontOpacity: 1,
                    fontSize: "10px",
                    fontFamily: "Courier New, monospace",
                    label : "${description}",
                    fill: true,
                    fillOpacity: 0.6,
                    strokeOpacity: 0.8
                }, { context: context} )

            }),
            strategies: [
                new OpenLayers.Strategy.Cluster({
                    distance: 25,
                    threshold: 3
                })
            ]
        });

        this.selectableLayers = [this.layers.avpg];
        this.selectableAttribute = "avpg";
    };

    this.draw = function(data) {
        this.layers.avpg.removeAllFeatures();

        var features = [];

        for (var i in data) {
            var attr = {
                id : i,
                description: data[i].description,
                type : "avpg",
                avpg : data[i]
            };
            var p = data[i].point;
            features.push(new OpenLayers.Feature.Vector(this.map.createPoint(p.longitude, p.latitude), attr));
        }

        this.layers.avpg.addFeatures(features);
    };
}

AvpgLayer.prototype = new EmbryoLayer();
