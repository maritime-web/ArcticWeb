(function () {
    'use strict';

    /**
     *
     * Interaction to modify rectangular features. When dragged the feature is moved on the map.
     * When un clicked, either after dragging or after simple click, points
     * are rendered in the center of each rectangle edge. These points can be used to drag
     * each edge in perpendicular direction to the edge itself. While doing this
     * the area of the rectangle is maintained by moving the two perpendicular edges
     * in the rectangle.
     */

    angular
        .module('embryo.components.openlayer')
        .factory('ModifyRectangleInteractionFactory', ModifyRectangleInteractionFactory);

    ModifyRectangleInteractionFactory.$inject = ['NotifyService', 'OpenlayerEvents'];

    function ModifyRectangleInteractionFactory(NotifyService, OpenlayerEvents) {

        var ModifyRectangleInteraction = function (map, layer) {
            var that = this;
            that.listenerKeys = [];
            that.pointTranslateInteractions = [];
            that.pointTranslateInteractionsListenerKeys = [];
            that.supportLayer = new ol.layer.Vector({
                source: new ol.source.Vector()
            });

            that.select = new ol.interaction.Select({
                filter: function (feature, layerToTest) {
                    var geometry = feature.getGeometry();
                    var isRectangle = geometry.getType() === 'Polygon' && geometry.getLinearRingCount() === 1 && geometry.getCoordinates()[0].length === 4;


                    return layer === layerToTest && isRectangle
                },
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({color: [255, 0, 0, 0.6], width: 3}),
                    fill: new ol.style.Fill({color: [255, 0, 0, 0.3]})
                })

            });
            map.addInteraction(that.select);
            var key  = that.select.on('select', function (e) {

                that.pointTranslateInteractionsListenerKeys.forEach(function (key) {
                    if (key) {
                        ol.Observable.unByKey(key);
                    }
                });
                that.pointTranslateInteractionsListenerKeys.length = 0;
                that.pointTranslateInteractions.forEach(function (interaction) {
                    map.removeInteraction(interaction);
                });
                that.pointTranslateInteractions.length = 0;
                that.supportLayer.getSource().clear();

                if (!e.selected || e.selected.length === 0) {
                    that.supportLayer.setMap(null);

                    return;
                }

                var selectedFeature = e.selected[0];
                var geometry = selectedFeature.getGeometry();
                var ex = geometry.getExtent();
                var points = [];
                points.push({direction: 'S', coordFun: function (ex, p) {p.setCoordinates(/** @type ol.Coordinate */[ex[0] + (ex[2] - ex[0]) / 2, ex[1]]); return p}});
                points.push({direction: 'N', coordFun: function (ex, p) {p.setCoordinates(/** @type ol.Coordinate */[ex[0] + (ex[2] - ex[0]) / 2, ex[3]]); return p}});
                points.push({direction: 'W', coordFun: function (ex, p) {p.setCoordinates(/** @type ol.Coordinate */[ex[0], ex[1] + (ex[3] - ex[1]) / 2]); return p}});
                points.push({direction: 'E', coordFun: function (ex, p) {p.setCoordinates(/** @type ol.Coordinate */[ex[2], ex[1] + (ex[3] - ex[1]) / 2]); return p}});

                points.forEach(function (p) {
                    var feature = new ol.Feature({
                        geometry: p.coordFun(ex, new ol.geom.Point([0,0])),
                        direction: p.direction,
                        coordFun: p.coordFun
                    });
                    feature.setStyle(new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 10,
                            stroke: new ol.style.Stroke({
                                width: 2,
                                color: [255, 0, 0, 0.5]
                            }),
                            fill: new ol.style.Fill({
                                color: [255, 0, 0, 0.4]
                            })
                        }),
                        zIndex: 1
                    }));
                    that.supportLayer.getSource().addFeature(feature);

                    var pointTranslate = new ol.interaction.Translate({
                        features: new ol.Collection([feature])
                    });
                    that.pointTranslateInteractions.push(pointTranslate);
                    key = pointTranslate.on("translating", function (e) {
                        var direction = feature.get("direction");
                        geometry.applyTransform(function (coords, out, dimension) {
                            if (dimension !== 2) {
                                console.error("Can't handle polygons of dimension " + dimension);
                                return;
                            }

                            var extent = (/** @type ol.Extent */geometry.getExtent());
                            var minY = extent[1];
                            var maxY = extent[3];
                            var minX = extent[0];
                            var maxX = extent[2];
                            var W = Math.abs(maxX - minX);
                            var H = Math.abs(maxY - minY);
                            var A = W * H;
                            var newH, newW, index;

                            if (direction === "S") {
                                newH = Math.abs(maxY - e.coordinate[1]);
                                newW = A / newH;

                                for (index = 0; index < coords.length; index += dimension) {
                                    if (coords[index + 1] === minY) {
                                        out[index + 1] = e.coordinate[1];
                                    } else {
                                        out[index + 1] = coords[index + 1]
                                    }

                                    if (coords[index] === minX) {
                                        out[index] = (minX + maxX) / 2 - newW / 2;
                                    } else {
                                        out[index] = (minX + maxX) / 2 + newW / 2;
                                    }
                                }
                            }

                            if (direction === "N") {
                                newH = Math.abs(minY - e.coordinate[1]);
                                newW = A / newH;

                                for (index = 0; index < coords.length; index += dimension) {
                                    if (coords[index + 1] === maxY) {
                                        out[index + 1] = e.coordinate[1];
                                    } else {
                                        out[index + 1] = coords[index + 1]
                                    }

                                    if (coords[index] === minX) {
                                        out[index] = (minX + maxX) / 2 - newW / 2;
                                    } else {
                                        out[index] = (minX + maxX) / 2 + newW / 2;
                                    }
                                }
                            }

                            if (direction === "W") {
                                newW = Math.abs(maxX - e.coordinate[0]);
                                newH = A / newW;

                                for (index = 0; index < coords.length; index += dimension) {
                                    if (coords[index] === minX) {
                                        out[index] = e.coordinate[0];
                                    } else {
                                        out[index] = coords[index]
                                    }

                                    if (coords[index+1] === minY) {
                                        out[index+1] = (minY + maxY) / 2 - newH / 2;
                                    } else {
                                        out[index+1] = (minY + maxY) / 2 + newH / 2;
                                    }
                                }
                            }
                            if (direction === "E") {
                                newW = Math.abs(minX - e.coordinate[0]);
                                newH = A / newW;

                                for (index = 0; index < coords.length; index += dimension) {
                                    if (coords[index] === maxX) {
                                        out[index] = e.coordinate[0];
                                    } else {
                                        out[index] = coords[index]
                                    }

                                    if (coords[index+1] === minY) {
                                        out[index+1] = (minY + maxY) / 2 - newH / 2;
                                    } else {
                                        out[index+1] = (minY + maxY) / 2 + newH / 2;
                                    }
                                }
                            }

                        });

                        that.supportLayer.getSource().getFeatures().forEach(function (f) {
                            var ex = geometry.getExtent();
                            var coordUpdater = f.get('coordFun');
                            coordUpdater(ex, f.getGeometry());

                        })
                    });
                    that.listenerKeys.push(key);

                    key = pointTranslate.on('translateend', function () {
                        NotifyService.notify(OpenlayerEvents.BoxChanged, selectedFeature);
                    });

                    that.listenerKeys.push(key);

                    map.addInteraction(pointTranslate);
                });
                that.supportLayer.setMap(map);
            });
            that.listenerKeys.push(key);

            that.translate = new ol.interaction.Translate({
                features: that.select.getFeatures()
            });
            map.addInteraction(that.translate);

            key = that.translate.on('translatestart', function () {
                that.supportLayer.setVisible(false);
            });
            that.listenerKeys.push(key);


            key = that.translate.on('translateend', function (e) {
                var feature = e.features.item(0);
                var ex = feature.getGeometry().getExtent();
                that.supportLayer.getSource().getFeatures().forEach(function (f) {
                    var coordUpdater = f.get('coordFun');
                    coordUpdater(ex, f.getGeometry());
                });
                NotifyService.notify(OpenlayerEvents.BoxChanged, feature);
                that.supportLayer.setVisible(true);
                that.supportLayer.changed();
            });
            that.listenerKeys.push(key);

            key = map.on('pointermove', function(evt) {
                var x = evt.coordinate[0];
                var y = evt.coordinate[1];
                var resolution = evt.map.getView().getResolution();
                var extentSize = 10 * resolution;
                var extent = [x - extentSize, y-extentSize, x+extentSize, y+extentSize];
                var features = that.supportLayer.getSource().getFeaturesInExtent(/** @type ol.Extent*/extent);
                var hasFeatures = features.length > 0;

                if (hasFeatures) {
                    var dir = features[0].get("direction");
                    var value = 'ew-resize';
                    if (dir === 'N' || dir === 'S') {
                        value = 'ns-resize';
                    }
                    map.getTargetElement().style.cursor = value;
                    evt.stopPropagation();
                    return false;
                } else {
                    map.getTargetElement().style.cursor = 'auto';
                    return true;
                }
            });
            that.listenerKeys.push(key);
        };

        /**
         * Removes all listeners and interactions from the given map
         * @param {ol.Map} map
         */
        ModifyRectangleInteraction.prototype.destroy = function (map) {
            var removeEventListener = function (key) {
                if (key) {
                    ol.Observable.unByKey(key);
                }
            };

            this.listenerKeys.forEach(removeEventListener);
            this.pointTranslateInteractionsListenerKeys.forEach(removeEventListener);

            if (this.supportLayer) {
                this.supportLayer.setMap(null);
            }

            if (map) {
                if (this.translate) {
                    map.removeInteraction(/** @type ol.interaction.Interaction */this.translate);
                }
                if (this.select) {
                    map.removeInteraction(/** @type ol.interaction.Interaction */this.select);
                }

                this.pointTranslateInteractions.forEach(function (interaction) {
                    map.removeInteraction(interaction);
                })
            }
        };

        /**
         * Returns the currently selected feature if any.
         */
        ModifyRectangleInteraction.prototype.getSelectedFeature = function () {
            return this.select.getFeatures().item(0);
        };

        /**
         * Replaces the current selection with the given feature.
         */
        ModifyRectangleInteraction.prototype.replaceSelection = function (feature) {
            this.select.getFeatures().clear();
            this.select.getFeatures().insertAt(0, feature);
            this.select.dispatchEvent({type: 'select', selected: [feature]});
            //
        };

        /**
         * Returns the currently selected feature if any.
         */
        ModifyRectangleInteraction.prototype.clearSelection = function () {
            this.select.getFeatures().clear();
            this.select.dispatchEvent('select');
        };

        return {
            create: function (map, layer, events) {
                return new ModifyRectangleInteraction(map, layer, events);
            }
        }
    }
})();

