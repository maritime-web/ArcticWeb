function NWNMLayer() {
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
                // return [16, 20, 24][that.zoomLevel];
                return [14, 17, 20][that.zoomLevel];
            },
            description: function(feature) {
                return feature.cluster ? feature.cluster.length + ' warnings' : feature.attributes.description;
            },
            extGraphic: function(feature) {
                return feature.attributes.mainType === 'NW' ? 'img/nwnm/nw.png' : 'img/nwnm/nm.png';
            }
        };

        this.layers.nwnm = new OpenLayers.Layer.Vector("NWNM", {
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    graphicOpacity: "${transparency}",
                    externalGraphic : "${extGraphic}",
                    graphicWidth : "${size}",
                    graphicHeight : "${size}",
                    graphicYOffset : "${offset}",
                    graphicXOffset : "${offset}",
                    fontColor: "#000",
                    fontSize: "10px",
                    fontOpacity: "${labelTransparency}",
                    fontFamily: "Courier New, monospace",
                    // label : "${description}",
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
                    externalGraphic : "${extGraphic}",
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
                    // label : "${description}",
                    fill: true,
                    fillOpacity: 0.6,
                    strokeOpacity: 0.8
                }, { context: context} )

            })
        });

        this.selectableLayers = [this.layers.nwnm];
        this.selectableAttribute = "nwnm";
    };

    this.draw = function(messages) {
        this.layers.nwnm.removeAllFeatures();

        var features = [];
        var geoJSONFormat = new OpenLayers.Format.GeoJSON();

        for (var i in messages) {
            var attr = {
                id : i,
                description: messages[i].enctext,
                type : "nwnm",
                mainType : messages[i].mainType,
                nwnm : messages[i]
            };

            angular.forEach(messages[i].jsonFeatures, function (geoJsonFeatureCollection) {
                var featureCollection = geoJSONFormat.read(geoJsonFeatureCollection);
                angular.forEach(featureCollection, function (featureVector) {
                    featureVector.attributes = attr;
                    featureVector.geometry.transform(new OpenLayers.Projection("EPSG:4326"), embryo.projection);
                    features.push(featureVector);
                });
            });
        }

        this.layers.nwnm.addFeatures(features);
    };
}

NWNMLayer.prototype = new EmbryoLayer();
