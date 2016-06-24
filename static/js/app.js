(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'ol'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery', 'ol'));
    } else {
        factory(jQuery, ol); //依赖jQuery和openlayers3
    }
}(this, function() {
    var that; //载体
    var AMAP = function Amap() {
        //measure need
        this.helpMsg = '点击开始绘制';
        this.continuePolygonMsg = '继续绘制多边形';
        this.continueLineMsg = '继续绘制折线';
        that = this;
    };

    AMAP.prototype = {
        constructor: AMAP,
        init: function(set) {
            if (set.map)
                this.map = set.map;
            if (set.source)
                this.source = set.source;
            if (set.wgs84Sphere)
                this.wgs84Sphere = set.wgs84Sphere;
        },
        /**
         * 绘制部分
         */
        draw: {
            /**
             *  drawBeforeClear: false, 绘制之前先清空图层
             *  drawMore: false,  绘制多次
             */
            init: function(sets) {
                if (sets.drawBeforeClear)
                    that.drawBeforeClear = true;
                if (sets.drawMore)
                    that.drawMore = true;
            },
            /**
             * 绘制图形,包括Point, LineString, Polygon, Circle, Box, Square
             */
            run: function(type, callback) {
                that.map.removeInteraction(that.drawtool);
                if (that.drawBeforeClear !== undefined && that.drawBeforeClear)
                    that.clear(that.source);
                if (type !== 'None') {
                    var geometryFunction, maxPoints;
                    if (type === 'Square') {
                        type = 'Circle';
                        geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
                    } else if (type === 'Box') {
                        type = 'LineString';
                        maxPoints = 2;
                        geometryFunction = function(coordinates, geometry) {
                            if (!geometry) {
                                geometry = new ol.geom.Polygon(null);
                            }
                            var start = coordinates[0];
                            var end = coordinates[1];
                            geometry.setCoordinates([
                                [start, [start[0], end[1]], end, [end[0], start[1]], start]
                            ]);
                            return geometry;
                        };
                    }
                    that.drawtool = new ol.interaction.Draw({
                        source: that.source,
                        type: (type),
                        geometryFunction: geometryFunction,
                        maxPoints: maxPoints
                    });
                    that.drawtool.on("drawstart", function(evt) {
                        that.event.controlActive(ol.interaction.DoubleClickZoom, false);
                    });
                    that.drawtool.on("drawend", function(evt) {
                        if (that.drawMore === undefined || !that.drawMore)
                            map.removeInteraction(that.drawtool);
                        setTimeout(function() {
                            that.event.controlActive(ol.interaction.DoubleClickZoom, true);
                        }, 250);
                        if(typeof callback != "undefined"){
                            callback(evt.feature.getGeometry());
                        }
                    });
                    that.map.addInteraction(that.drawtool);
                }
            }
        },
        /**
         * 测量部分
         */
        measure: {
            /**
             *  measureBeforeClear: false, 测量之前先清空图层
             *  measureMore: false,  测量多次
             */
            init: function(sets) {
                if (sets.measureBeforeClear)
                    that.measureBeforeClear = true;
                if (sets.measureMore)
                    that.measureMore = true;
            },
            /**
             * 测量面积和距离,参数包括LineString和Polygon
             */
            run: function(type) {
                _this = that;
                that.map.removeInteraction(that.drawtool);
                if (that.measureBeforeClear !== undefined && that.measureBeforeClear)
                    that.clear(that.source);
                var sketch, listener;
                var state = 0;
                var measures = that.measure.createMeasureTooltip(that.map, that.measureTooltipElement);
                var helps = that.measure.createHelpTooltip(that.map, that.helpTooltipElement);
                var pointerMoveHandler = function(evt) {
                    if (evt.dragging) {
                        return;
                    }
                    if (sketch && state != '1') {
                        state = 1;
                        var geom = (sketch.getGeometry());
                        if (geom instanceof ol.geom.Polygon) {
                            that.helpMsg = that.continuePolygonMsg;
                        } else if (geom instanceof ol.geom.LineString) {
                            that.helpMsg = that.continueLineMsg;
                        }
                    }
                    that.helpTooltipElement.innerHTML = that.helpMsg;
                    that.helpTooltip.setPosition(evt.coordinate);
                    that.helpTooltipElement.classList.remove('hidden');
                };
                that.move_event = that.map.on('pointermove', pointerMoveHandler);
                that.map.getViewport().addEventListener('mouseout', function() {
                    that.helpTooltipElement.classList.add('hidden');
                });
                that.drawtool = new ol.interaction.Draw({
                    source: _this.source,
                    type: /** @type {ol.geom.GeometryType} */ (type),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.5)',
                            lineDash: [10, 10],
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 5,
                            stroke: new ol.style.Stroke({
                                color: 'rgba(0, 0, 0, 0.7)'
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 0.2)'
                            })
                        })
                    })
                });
                that.map.addInteraction(that.drawtool);
                that.drawtool.on('drawstart',
                    function(evt) {
                        sketch = evt.feature;
                        var tooltipCoord = evt.coordinate;
                        listener = sketch.getGeometry().on('change', function(evt) {
                            var geom = evt.target;
                            var output;
                            if (geom instanceof ol.geom.Polygon) {
                                output = that.measure.formatArea(geom);
                                tooltipCoord = geom.getInteriorPoint().getCoordinates();
                            } else if (geom instanceof ol.geom.LineString) {
                                output = that.measure.formatLength(geom);
                                tooltipCoord = geom.getLastCoordinate();
                            }
                            that.measureTooltipElement.innerHTML = output;
                            that.measureTooltip.setPosition(tooltipCoord);
                            that.event.controlActive(ol.interaction.DoubleClickZoom, false); //关闭双击缩进时间,避免绘制结束图层缩进
                        });
                    }, that);
                that.drawtool.on('drawend',
                    function() {
                        that.measureTooltipElement.className = 'tooltip tooltip-static';
                        that.measureTooltip.setOffset([0, -7]);
                        sketch = null;
                        ol.Observable.unByKey(listener);
                        that.helpMsg = "点击开始绘制";
                        if (that.measureMore === undefined || !that.measureMore) {
                            that.map.unByKey(that.move_event);
                            that.measureTooltipElement = null;
                            that.helpTooltipElement.parentNode.removeChild(that.helpTooltipElement); //清除附着框
                            that.map.removeInteraction(that.drawtool);
                        } else {
                            that.measure.createMeasureTooltip(that.map, that.measureTooltipElement);
                        }
                        setTimeout(function() {
                            that.event.controlActive(ol.interaction.DoubleClickZoom, true);
                        }, 250); //绘制结束,恢复双击缩进
                    }, that);
            },
            createHelpTooltip: function() {
                if (that.helpTooltipElement) {
                    $(".hidden").remove();
                }
                that.helpTooltipElement = document.createElement('div');
                that.helpTooltipElement.className = 'tooltip hidden';
                that.helpTooltip = new ol.Overlay({
                    element: that.helpTooltipElement,
                    offset: [15, 0],
                    positioning: 'center-left'
                });
                that.map.addOverlay(that.helpTooltip);
            },
            createMeasureTooltip: function() {
                if (that.measureTooltipElement) {
                    $(".tooltip-measure").remove();
                }
                that.measureTooltipElement = document.createElement('div');
                that.measureTooltipElement.className = 'tooltip tooltip-measure';
                that.measureTooltip = new ol.Overlay({
                    element: that.measureTooltipElement,
                    offset: [0, -15],
                    positioning: 'bottom-center'
                });
                that.map.addOverlay(that.measureTooltip);
            },
            formatLength: function(line) {
                var length;
                if (1) {
                    var coordinates = line.getCoordinates();
                    length = 0;
                    var sourceProj = that.map.getView().getProjection();
                    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                        length += that.wgs84Sphere.haversineDistance(c1, c2);
                    }
                } else {
                    length = Math.round(line.getLength() * 100) / 100;
                }
                var output;
                if (length > 100) {
                    output = (Math.round(length / 1000 * 100) / 100) +
                        ' ' + 'km';
                } else {
                    output = (Math.round(length * 100) / 100) +
                        ' ' + 'm';
                }
                return output;
            },
            formatArea: function(polygon) {
                var area;
                if (1) {
                    var sourceProj = that.map.getView().getProjection();
                    var geom = /** @type {ol.geom.Polygon} */ (polygon.clone().transform(
                        sourceProj, 'EPSG:4326'));
                    var coordinates = geom.getLinearRing(0).getCoordinates();
                    area = Math.abs(that.wgs84Sphere.geodesicArea(coordinates));
                } else {
                    area = polygon.getArea();
                }
                var output;
                if (area > 10000) {
                    output = (Math.round(area / 1000000 * 100) / 100) +
                        ' ' + 'km<sup>2</sup>';
                } else {
                    output = (Math.round(area * 100) / 100) +
                        ' ' + 'm<sup>2</sup>';
                }
                return output;
            },
        },
        event: {
            controlActive: function(event, active) {
                var interactions = that.map.getInteractions();
                for (var i = 0; i < interactions.getLength(); i++) {
                    var interaction = interactions.item(i);
                    if (interaction instanceof event) {
                        interaction.setActive(active);
                    }
                }
            }
        },
        /**
         * 清理图层
         */
        clear: function(source) {
            this.source.clear();
            $(".tooltip").remove();
        },

    };
    return window.amap = new AMAP();
}));
