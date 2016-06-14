function Amap(map, source) {
    this.map = map;
    this.source = source;

    this.draw = null;

    this.helpMsg = '点击开始绘制';
    this.continuePolygonMsg = '继续绘制多边形';
    this.continueLineMsg = '继续绘制折线';
    this.test = "test";
}

Amap.prototype = {
    constructor: Amap,
    init: function() {
        this.helpMsg = '';
        this.continuePolygonMsg = '';
        this.continueLineMsg = '';
    },
    drawInit: function(source) {

    },
    drawFeature: function(type) {
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
            var draw = new ol.interaction.Draw({
                source: this.source,
                type: (type),
                geometryFunction: geometryFunction,
                maxPoints: maxPoints
            });
            draw.on("drawstart", function(evt){
                controlDoubleClickZoom(map, false);
            });
            draw.on("drawend", function(evt) {
                map.removeInteraction(draw);
                setTimeout(function(){controlDoubleClickZoom(map, true);}, 250);
            });
            this.map.addInteraction(draw);
        }
    },
    /** 初始化测量方法 */
    measureInit: function(continueLineMsg, continuePolygonMsg) {
        this.continuePolygonMsg = continuePolygonMsg;
        this.continueLineMsg = continueLineMsg;
        console.log("measureInit...");
    },
    measureClear: function(map) {
        map.removeInteraction(this.draw);
    },
    measure: function(map, wgs84Sphere, type) {
        _this = this;
        var sketch;
        var helpTooltipElement;     //提示显示框(元素)
        var helpTooltip;
        var measureTooltipElement;  //数据显示框(元素)
        var measureTooltip;
        var helpMsg = this.helpMsg;
        var continueLineMsg = this.continueLineMsg;
        var continuePolygonMsg = this.continuePolygonMsg;
        var state = 0;

        var measures = this.createMeasureTooltip(map, measureTooltipElement);
        var helps = this.createHelpTooltip(map, helpTooltipElement);
        measureTooltipElement = measures[0];
        measureTooltip = measures[1];
        helpTooltipElement = helps[0];
        helpTooltip = helps[1];
        _this = this;
        var pointerMoveHandler = function(evt) {
            if (evt.dragging) {
                return;
            }
            if (sketch && state != '1') {
                state = 1;
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
            helpTooltipElement.classList.remove('hidden');
        };
        map.on('pointermove', pointerMoveHandler);
        map.getViewport().addEventListener('mouseout', function() {
            helpTooltipElement.classList.add('hidden');
        });
        this.draw = new ol.interaction.Draw({
            source: source,
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
        map.addInteraction(this.draw);
        var listener;
        this.draw.on('drawstart',
            function(evt) {
                sketch = evt.feature;
                var tooltipCoord = evt.coordinate;
                listener = sketch.getGeometry().on('change', function(evt) {
                    var geom = evt.target;
                    var output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = formatArea(map, wgs84Sphere, geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();
                    } else if (geom instanceof ol.geom.LineString) {
                        output = formatLength(map, wgs84Sphere, geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    measureTooltipElement.innerHTML = output;
                    measureTooltip.setPosition(tooltipCoord);
                    controlDoubleClickZoom(map, false); //关闭双击缩进时间,避免绘制结束图层缩进
                });
            }, this);
        this.draw.on('drawend',
            function() {
                measureTooltipElement.className = 'tooltip tooltip-static';
                measureTooltip.setOffset([0, -7]);
                sketch = null;
                // measureTooltipElement = null;
                // this.createMeasureTooltip(map, measureTooltipElement);
                ol.Observable.unByKey(listener);
                map.removeInteraction(this.draw);
                helpTooltipElement.parentNode.removeChild(helpTooltipElement);  //清除附着框
                setTimeout(function(){controlDoubleClickZoom(map, true);}, 250);//绘制结束,恢复双击缩进
            }, this);
    },
    createHelpTooltip: function(map, helpTooltipElement) {
        if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'tooltip hidden';
        helpTooltip = new ol.Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(helpTooltip);
        return [helpTooltipElement, helpTooltip];
    },
    createMeasureTooltip: function(map, measureTooltipElement) {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
        return [measureTooltipElement, measureTooltip];
    }

};

function controlDoubleClickZoom(map, active){
    var interactions = map.getInteractions();
    for (var i = 0; i < interactions.getLength(); i++) {
        var interaction = interactions.item(i);
        if (interaction instanceof ol.interaction.DoubleClickZoom) {
            interaction.setActive(active);
        }
    }
}

function formatLength(map, wgs84Sphere, line) {
    var length;
    if (1) {
        var coordinates = line.getCoordinates();
        length = 0;
        var sourceProj = map.getView().getProjection();
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
            var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
            var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
            length += wgs84Sphere.haversineDistance(c1, c2);
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
}

function formatArea(map, wgs84Sphere, polygon) {
    var area;
    if (1) {
        var sourceProj = map.getView().getProjection();
        var geom = /** @type {ol.geom.Polygon} */ (polygon.clone().transform(
            sourceProj, 'EPSG:4326'));
        var coordinates = geom.getLinearRing(0).getCoordinates();
        area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
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
}
