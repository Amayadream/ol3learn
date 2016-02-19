<%@ page contentType="text/html;charset=UTF-8" language="java" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<html>
<head>
    <title>地图展示</title>
    <link rel="stylesheet" type="text/css" href="${ctx}/plugins/openlayers3/css/ol.css">
    <script src="${ctx}/plugins/openlayers3/js/ol.js"></script>
</head>
<body>
<div class="span12">
    <div id="map" class="map" style="height:500px;width: 1000px;"></div>
    <a href="javascript:drawFeature('Point')">Point</a>
    <a href="javascript:drawFeature('LineString')">LineString</a>
    <a href="javascript:drawFeature('Polygon')">Polygon</a>
    <a href="javascript:drawFeature('Circle')">Circle</a>
    <a href="javascript:drawFeature('Square')">Square</a>
    <a href="javascript:drawFeature('Box')">Box</a>
</div>
<script>
    var raster = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'sat'})
    });
    var source = new ol.source.Vector({wrapX: false});
    var vector = new ol.layer.Vector({
        controls: ol.control.defaults().extend([
            new ol.control.ScaleLine()
        ]),
        source: source,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });
    var map = new ol.Map({
        controls: ol.control.defaults().extend([
            new ol.control.FullScreen()
        ]),
        layers: [raster, vector],
        target: 'map',
        view: new ol.View({
            center: [-11000000, 4600000],
            zoom: 4
        })
    });
    var drawLayer;
    function drawFeature(x){
        map.removeInteraction(drawLayer);
        var geometryFunction, maxPoints;
        if(x =='Square'){
            x = 'Circle';
            geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
        }
        if(x == 'Box'){
            x = 'LineString';
            maxPoints = 2;
            geometryFunction = function(coordinas, geometry){
                if(!geometry){
                    geometry = new ol.geom.Polygon(null);
                }
                var start = coordinas[0];
                var end = coordinas[1];
                geometry.setCoordinates([
                    [start, [start[0], end[1]], end, [end[0], start[1]], start]
                ]);
                return geometry;
            };
        }
        drawLayer = new ol.interaction.Draw({
            source: source,
            type: x,
            geometryFunction: geometryFunction,
            maxPoints: maxPoints,
        });
        map.addInteraction(drawLayer);
    }
</script>

</body>
</html>
