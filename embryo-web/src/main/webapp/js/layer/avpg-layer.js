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
                return [4, 6, 12][that.zoomLevel];
            },
            description: function(feature) {
                return feature.data.description;
            },
            display: function(feature) {
                return feature.cluster ? "none" : "";
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
                    strokeOpacity: "${polygonTransparency}",
                    display: "${display}"

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
                    strokeOpacity: 0.8,
                    display: "${display}"
                }, { context: context} )

            }),
            strategies: [
                new OpenLayers.Strategy.Cluster({
                    distance: 35,
                    threshold: 2
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
                description: data[i].AFM_navn,
                type : "avpg",
                avpg : data[i]
            };
            features.push(new OpenLayers.Feature.Vector(this.map.createPoint(data[i].LONGITUDE, data[i].LATITUDE), attr));
        }

        this.layers.avpg.addFeatures(features);
        this.layers.avpg.refresh();
    };
}

AvpgLayer.prototype = new EmbryoLayer();
