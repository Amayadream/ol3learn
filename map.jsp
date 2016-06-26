<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>    
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>地图展示</title>
	<jsp:include page="/admin/apps/publicMap/publicIp.jsp"></jsp:include>
    <link rel="stylesheet" type="text/css" href="${ctx}/admin/apps/publicMap/source/ol/ol.css">
    <link rel="stylesheet" type="text/css" href="${ctx}/admin/apps/publicMap/source/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="${ctx}/admin/apps/publicMap/source/static/css/style.css">
    <link rel="stylesheet" type="text/css" href="${ctx}/admin/apps/publicMap/source/static/css/sidebar.css">
    <script type="text/javascript" src="${ctx}/admin/apps/publicMap/source/static/js/jquery.1.9.1.js"></script>
    <script type="text/javascript" src="${ctx}/admin/apps/publicMap/source/bootstrap/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="${ctx}/admin/apps/publicMap/source/ol/ol.js"></script>
    <script type="text/javascript" src="${ctx}/admin/apps/publicMap/source/static/js/jquery.sidebar.min.js"></script>
    <script type="text/javascript" src="${ctx}/admin/apps/publicMap/source/static/js/app.js"></script>
    <style>
        html,
        body {
            height: 100%;
            margin: 0;
        }

        #map {
            height: 100%;
        }

        .btn-group> .btn {
            line-height: 25px;
            display: inline-block;
            padding-left: 8px;
            padding-right: 8px;
        }
    </style>
</head>
<body>
<div id="map"></div>
    <div id="popup" class="ol-popup" style="display:None">
        <a href="#" id="popup-closer" class="ol-popup-closer"></a>
        <div id="popup-content"></div>
    </div>
    <div class="sidebar left">
        <div class="input-group" style="margin-top: 10px;margin-bottom: 20px">
            <input type="text" class="form-control" id="searchKey" aria-label="...">
            <div class="input-group-btn">
                <button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    查询 <span class="caret"></span>
                    <span class="sr-only">Toggle Dropdown</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-right">
                    <li><a href="javascript:;" onclick="searchInfo('event')">事件地</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('company')">单位</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('person')">人员</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('video')">视频</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('voice')">语音</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('phone')">电话</a></li>
                    <li><a href="javascript:;" onclick="searchInfo('publish')">信息发布</a></li>
                </ul>
            </div>
            <!-- /btn-group -->
        </div>
        <!-- /input-group -->
        <div style="height:600px; overflow:auto">
            <li id="result-list"></li>
        </div>
    </div>
    <script>
        var offline_url = "http://"+p_map_server_ip+"/{z}/{x}/{y}.png";
        var wgs84Sphere = new ol.Sphere(6378137);
        var offlineMapLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: offline_url
            })
        });
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');

        var style_text, point, popup, html, i, key, coordinate, collection, data, method;
        var style_common = new ol.style.Style({
            image: new ol.style.Icon({
                src: '${ctx}/admin/apps/publicMap/source/static/img/mark-org-s.png'
            })
        });

        var vector_show = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_draw = new ol.layer.Vector({
            source: new ol.source.Vector({
                wrapX: false
            })
        });
        var vector_event = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_company = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_person = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_video = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_voice = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_phone = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        var vector_publish = new ol.layer.Vector({
            source: new ol.source.Vector()
        });

        var view = new ol.View({
            extent: ol.proj.transformExtent([124.35, 42.88, 126.35, 44.88], 'EPSG:4326', 'EPSG:3857'),
            center: ol.proj.transform([125.35, 43.88], 'EPSG:4326', 'EPSG:3857'),
            zoom: 12,
            minZoom: 12,
            maxZoom: 19
        });

        var map = new ol.Map({
            controls: ol.control.defaults({}).extend([
                new ol.control.FullScreen(),
                new ol.control.ScaleLine(),
                new ol.control.ZoomSlider(),
                new ol.control.ZoomToExtent()
            ]),
            layers: [offlineMapLayer, vector_show, vector_draw, vector_event, vector_company, vector_person, vector_video, vector_voice, vector_phone, vector_publish],
            view: view,
            target: 'map'
        });

        // 在viewport节点下添加工具条
        var viewport = map.getViewport();
        html = '<div class="btn-group toolbar" role="group" aria-label="...">';
        html += '<button type="button" class="btn btn-info btn-sm" id="search"><span class="glyphicon glyphicon-search"></span> 查询</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="event"><span class="glyphicon glyphicon-screenshot"></span> 事件地</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="company"><span class="glyphicon glyphicon-tower"></span> 单位</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="person"><span class="glyphicon glyphicon-user"></span> 人员</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="video"><span class="glyphicon glyphicon-facetime-video"></span> 视频</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="voice"><span class=" glyphicon glyphicon-headphones"></span> 语音</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="phone"><span class="glyphicon glyphicon-phone"></span> 电话</button>';
        html += '<button type="button" class="btn btn-default btn-sm btn-tool" id="publish"><span class="glyphicon glyphicon-comment"></span> 消息发布</button>';
        html += '<button type="button" class="btn btn-danger btn-sm" onclick="clearLayers()"><span class="glyphicon glyphicon-trash"></span> 清除</button>';
        html += '<div class="btn-group" role="group">';
        html += '<button type="button" class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
        html += '<span class="glyphicon glyphicon-cog"></span> 工具 ';
        html += '<span class="caret"></span>';
        html += '</button>';
        html += '<ul class="dropdown-menu">';
        html += '<li><a href="javascript:;" onclick="amap.draw.run(\'Point\')">点</a></li>';
        html += '<li><a href="javascript:;" onclick="amap.draw.run(\'LineString\')">线</a></li>';
        html += '<li><a href="javascript:;" onclick="clear();amap.draw.run(\'Polygon\', wfsSearch)">面</a></li>';
        html += '<li><a href="javascript:;" onclick="clear();amap.draw.run(\'Box\', wfsSearch)">区域</a></li>';
        html += '<li><a href="javascript:;" onclick="amap.measure.run(\'LineString\');">距离</a></li>';
        html += '<li><a href="javascript:;" onclick="amap.measure.run(\'Polygon\');">面积</a></li>';
        html += '</ul>';
        html += '</div>';
        html += '</div>';
        $(viewport).append(html);

        //初始化amap
        amap.init({
            "map": map,
            "source": vector_draw.getSource(),
            "wgs84Sphere": wgs84Sphere
        });
        amap.draw.init({
            drawBeforeClear: true,
            drawMore: false
        });
        amap.measure.init({
            measureBeforeClear: true,
            measureMore: false
        });

        $(".btn-tool").click(function() {
            if ($(this).hasClass("state-on")) {
                $(this).removeClass("btn-success").removeClass("state-on").addClass("btn-default");
            } else {
                $(this).removeClass("btn-default").addClass("btn-success").addClass("state-on");
            }
            var state = $(this).hasClass("state-on");
            switch ($(this).attr("id")) {
                case "event":
                    vector_event.getSource().clear();
                    if (state)
                        showEvent(vector_event);
                    break;
                case "company":
                    vector_company.getSource().clear();
                    if (state)
                        showCompany(vector_company);
                    break;
                case "person":

                    break;
                case "video":

                    break;
                case "voice":

                    break;
                case "phone":

                    break;
                case "publish":

                    break;
            }
        });

        /** 清理所有矢量图层以及提示框 */
        function clearLayers() {
            clear();
            $(".sidebar.left").trigger("sidebar:close");
        }

        function clear(){
            $(".btn-tool").addClass("btn-default").removeClass("btn-success").removeClass("state-on").button('reset');  //按钮重置成白色
            amap.clear(vector_draw.getSource());        //清理绘制图层以及提示框
            map.getLayers().forEach(function(item) {    //清理所有矢量图层
                if (item instanceof ol.layer.Vector) {
                    item.getSource().clear();
                }
            }, this);
            map.getOverlays().forEach(function(item){   //清理所有overlay
                map.removeOverlay(item);
            }, this);
        }

        $(".sidebar.left").sidebar({
            close: true
        });

        //点击查询按钮弹出侧边栏事件
        $("#search").click(function() {
            $(".sidebar.left").trigger("sidebar:toggle");
        });

        //侧边栏打开事件
        $(".sidebar.left").on("sidebar:opened", function() {
            $(".btn-tool").attr("disabled", true);
            clear();
        });

        //侧边栏关闭事件
        $(".sidebar.left").on("sidebar:closed", function() {
            $(".btn-tool").attr("disabled", false);
            $("#result-list").html("");
            $("#searchKey").val("");
            clear();
        });

        //点击overlay右侧关闭按钮事件
        closer.onclick = function() {
            popup.setPosition(undefined);
            closer.blur();
            return false;
        };

        //点击要素的select事件注册
        var selectEvent = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove, // 唯一的不同之处，设置鼠标移到feature上就选取
            filter: function(feature, layer) {
                return feature.get("id") !== undefined;
            }
        });
        map.addInteraction(selectEvent);    //添加select互动
        selectEvent.on("select", function(event) {
            if (event.selected.length > 0) {
                var feature = event.selected[0];
                if (feature && feature.get("id")) {
                    generateOverlay(feature);   //生成Overlay弹窗
                }
            } else if (event.deselected.length > 0) {
                // if (map.getOverlayById(event.deselected[0].get("id"))) {
                //     map.removeOverlay(map.getOverlayById(event.deselected[0].get("id")));   //关闭Overlay弹窗
                // }
            }
        });

        function searchInfo(type) {
            clear();
            key = $("#searchKey").val();
            if(key === undefined || key == null || key == ""){
                alert("请输入关键字...");
                return ;
            }
            switch (type) {
                case undefined:
                    console.log("查询全部");
                    break;
                case "event":
                    showEvent(vector_event, key);
                    break;
                case "company":
                    showCompany(vector_company, key);
                    break;
                case "person":
                    console.log("查询人员");
                    break;
                case "video":
                    console.log("查询视频");
                    break;
                case "voice":
                    console.log("查询语音");
                    break;
                case "phone":
                    console.log("查询电话");
                    break;
                case "publish":
                    console.log("查询消息发布");
                    break;
            }
        }

        /** 生成 point feature */
        function generatePoint(point, id, coordinate, name, index) {
            point = new ol.Feature({
                id: id,
                geometry: new ol.geom.Point(ol.proj.transform(coordinate, "EPSG:4326", "EPSG:3857")),
            });
            style_text = new ol.style.Text({
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                // stroke: new ol.style.Stroke({
                //     color: '#000000',
                //     width: 1
                // })
            });
            if (name !== undefined && name !== null && name !== "") {
                style_text.setText(name);
                style_text.setFont("14px Calibri,sans-serif");
                style_text.setOffsetY(20);
            }
            if(index !== undefined && index !== null && index !== ""){
                style_text.setText(index.toString()),
                style_text.setFont("14px Calibri,sans-serif");
                style_text.setOffsetY(-7);
            }
            point.setStyle(new ol.style.Style({
                text: style_text,
                image: new ol.style.Icon({
                    src: '${ctx}/admin/apps/publicMap/source/static/img/mark-box-red-m.png'
                })
            }));
            return point;
        }

        function wfsSearch(geometry) {
            $.ajax({
                url: '${ctx}/admin/apps/zhxt/mapgl/getAllDepartmentList.do',
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    i = 0;
                    $.each(data, function(index, item) {
                        if(jQuery.isArray(item.coordinate) && item.coordinate.length == 2){
                            if(geometry.intersectsExtent(ol.proj.transform(item.coordinate, "EPSG:4326", "EPSG:3857"))){
                                i ++;
                                point = generatePoint(point, item.id, item.coordinate, null, i);
                                point.setProperties({
                                    "coordinate": item.coordinate !==undefined ? item.coordinate : "",
                                    "dwdm": item.dwdm !==undefined ? item.dwdm : "",
                                    "name": item.name !==undefined ? item.name : "",
                                    "dutyperson": item.dutyperson !==undefined ? item.dutyperson : "",
                                    "address": item.address !==undefined ? item.address : "",
                                    "phone": item.phone !== undefined ? item.phone : "",
									"image": item.tpfjpath !== undefined? "${ctx}/"+item.tpfjpath : "${ctx}/admin/apps/publicMap/source/static/img/test.jpg"
                                }, true);
                                vector_company.getSource().addFeature(point);
                            }
                        }
                    });
					vector_draw.getSource().clear();
                }
            });
        }

        //选择一个点,并弹出他的overlay
        function selectPoint(layer, guid){
            layer.getSource().forEachFeature(function(feature){
                if(feature.get("guid") == guid){
                    var pan = ol.animation.pan({
                        duration: 2000,
                        source: (view.getCenter())
                    });
                    // map.beforeRender(pan);
                    // view.setCenter(ol.proj.transform(feature.get("coordinate"), "EPSG:4326", "EPSG:3857"));
                    generateOverlay(feature);
                }
            }, this);
        }

        //展示事件地信息
        function showEvent(vector, key) {
            if(key !== undefined && key !== null){
                data = {key: key};
                method = "POST";
            }else{
                data = {};
                method = "GET";
            }
            $.ajax({
                url: '${ctx}/admin/apps/zhxt/mapgl/getAllSjdzList.do',
                type: method,
                dataType: 'json',
                data: data,
                success: function(data) {
                    html = '';
                    i = 0;
                    $.each(data, function(index, item) {
                        if(jQuery.isArray(item.coordinate) && item.coordinate.length == 2){
                            if(key !== undefined && key !== null){
                                i ++;
                                html += "<ul><a href=\"javascript:;\" onclick=\"selectPoint(vector_event, '"+item.guid+"');\">"+ i + ". " + item.sfdd+"</a></ul>";
                                point = generatePoint(point, item.id, item.coordinate, null, i);
                            }else{
                                point = generatePoint(point, item.id, item.coordinate, null);
                                point.setStyle(style_common);
                            }
                            point.setProperties({
                                "coordinate": item.coordinate,
                                "guid": item.guid,
                                "sjfl": item.sjfl !== undefined ? item.sjfl : "",
                                "sjflmc": item.sjflmc !== undefined ? item.sjflmc : "",
                                "sfdd": item.sfdd !== undefined ? item.sfdd : "",
                                "sjjb": item.sjjb !== undefined ? item.sjjb : "",
                                "sjjbmc": item.sjjbmc !== undefined ? item.sjjbmc : "",
                                "sjlx": item.sjlx !== undefined ? item.sjlx : "",
                                "sjlxmc": item.sjlxmc !== undefined ? item.sjlxmc : "",
                                "sjms": item.sjms !== undefined ? item.sjms : "",
                                "tpfjmc": item.tpfjmc !== undefined ? item.tpfjmc : "",
                                "image": item.tpfjpath !== undefined? "${ctx}/"+item.tpfjpath : "${ctx}/admin/apps/publicMap/source/static/img/test.jpg"
                            });
                            vector.getSource().addFeature(point);
                        }
                    });
                    if(key !== undefined && key != null){
                        $("#result-list").html(html);
                    }
                }
            });
        }

        //展示单位信息
        function showCompany(vector, key) {
            if(key !== undefined && key !== null){
                data = {key: key};
                method = "POST";
            }else{
                data = {};
                method = "GET";
            }
            $.ajax({
                url: '${ctx}/admin/apps/zhxt/mapgl/getAllDepartmentList.do',
                type: method,
                dataType: 'json',
                data: data,
                success: function(data) {
                    html = '';
                    i = 0;
                    $.each(data, function(index, item) {
                   	 	if(jQuery.isArray(item.coordinate) && item.coordinate.length == 2){	//如果为数组且数组位数合法,则进行显示
                            if(key !== undefined && key !== null){
                                i ++;
                                html += "<ul><a href=\"javascript:;\" onclick=\"selectPoint(vector_company, '"+item.guid+"');\">"+ i + ". " + item.name+"</a></ul>";
                                point = generatePoint(point, item.id, item.coordinate, null, i);
                            }else{
                                point = generatePoint(point, item.id, item.coordinate, null);
                                point.setStyle(style_common);
                            }
	                        point.setProperties({
	                            "coordinate": item.coordinate !==undefined ? item.coordinate : "",
                                "guid": item.guid,
	                            "dwdm": item.dwdm !==undefined ? item.dwdm : "",
	                            "name": item.name !==undefined ? item.name : "",
	                            "dutyperson": item.dutyperson !==undefined ? item.dutyperson : "",
	                            "address": item.address !==undefined ? item.address : "",
                                "phone": item.phone !== undefined ? item.phone : "",
								"image": item.tpfjpath !== undefined? "${ctx}/"+item.tpfjpath : "${ctx}/admin/apps/publicMap/source/static/img/test.jpg"
	                        }, true);
	                        vector.getSource().addFeature(point);
                   	 	}
                    });
                    if(key !== undefined && key != null){
                        $("#result-list").html(html);
                    }
                }
            });
        }

        //展示人员信息
        function showPerson(vector, key) {
            if(key !== undefined && key !== null){
                data = {key: key};
                method = "POST";
            }else{
                data = {};
                method = "GET";
            }
            $.ajax({
                url: '${ctx}/admin/apps/zhxt/mapgl/getAllDepartmentList.do',
                type: method,
                dataType: 'json',
                data: data,
                success: function(data) {
                    html = '';
                    i = 0;
                    $.each(data, function(index, item) {
                        if(jQuery.isArray(item.coordinate) && item.coordinate.length == 2){ //如果为数组且数组位数合法,则进行显示
                            if(key !== undefined && key !== null){
                                i ++;
                                html += "<ul><a href=\"javascript:;\" onclick=\"selectPoint(vector_person, '"+item.guid+"');\">"+ i + ". " + item.name+"</a></ul>";
                                point = generatePoint(point, item.id, item.coordinate, null, i);
                            }else{
                                point = generatePoint(point, item.id, item.coordinate, null);
                                point.setStyle(style_common);
                            }
                            point.setProperties({
                                "coordinate": item.coordinate !==undefined ? item.coordinate : "",
                                "guid": item.guid,
                                "dwdm": item.dwdm !==undefined ? item.dwdm : "",
                                "name": item.name !==undefined ? item.name : "",
                                "dutyperson": item.dutyperson !==undefined ? item.dutyperson : "",
                                "address": item.address !==undefined ? item.address : "",
                                "phone": item.phone !== undefined ? item.phone : "",
                                "image": item.tpfjpath !== undefined? "${ctx}/"+item.tpfjpath : "${ctx}/admin/apps/publicMap/source/static/img/test.jpg"
                            }, true);
                            vector.getSource().addFeature(point);
                        }
                    });
                    if(key !== undefined && key != null){
                        $("#result-list").html(html);
                    }
                }
            });
        }		

        popup = new ol.Overlay(({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        }));

        map.on("click", function(){
            map.getOverlays().forEach(function(item){
                item.setPosition(undefined);
                closer.blur();
                return false;
            }, this);
        });

        //根据feature生成overlay
        function generateOverlay(feature){
            container.style.display = "";
            switch (feature.get("id")) {
                case "event":
                    // popup = new ol.Overlay(({
                    //     id: "event"
                    // }));
                    html = "<div class=\"row\" style=\"width:620px\">";
                    html += "<div class=\"col-md-5\" style=\"width:300px\"><img src='"+feature.get("image")+"' style=\"width:300px\"></div>";
                    html += "<div class=\"col-md-5\" style=\"margin-left:10px\"><p><b>事发地点: " + feature.get("sfdd") + 
									"</b></p><p>事件分类: " + feature.get("sjflmc") + 
									//"</p><p>事件分类代码: " + feature.get("sjfl") + 
									//"</p><p>事件级别代码: " + feature.get("sjjb") + 
									"</p><p>事件级别: " + feature.get("sjjbmc") + 
									//"</p><p>事件类型代码: " + feature.get("sjlx")+ 
									"</p><p>事件类型: " + feature.get("sjlxmc")+ 
									"</p><p>事件描述: " + feature.get("sjms")+  
									//"</p><p>tpfjmc: " + feature.get("tpfjmc")+ 
									"</p></div>";
                    html += "</div>";
                    break;
                case "company":
                    // popup = new ol.Overlay(({
                    //     id: 'company'
                    // }));
                    html = "<div class=\"row\" style=\"width:620px\">";
                    html += "<div class=\"col-md-5\" style=\"width:300px\"><img src='"+feature.get("image")+"' style=\"width:300px\"></div>";
                    html += "<div class=\"col-md-5\" style=\"margin-left:10px\"><p><b>单位名称: " + feature.get("name") + "</b></p><p>单位代码: " + feature.get("dwdm") + "</p><p>负责人: " + feature.get("dutyperson") + "</p><p>电话: " + feature.get("phone") + "</p><p>联系地址: " + feature.get("address")+ "</p></div>";
                    html += "</div>";
                    break;
                case "person":
                    break;
                case "video":
                    break;
                case "voice":
                    break;
                case "phone":
                    break;
                case "publish":
                    break;
            }
            content.innerHTML = html;
            popup.setPosition(ol.proj.transform(feature.get("coordinate"), 'EPSG:4326', 'EPSG:3857'));
            map.addOverlay(popup);
        }

        //根据id获取feature所在图层
        function getVector(id){
            var result = null;
            switch (id) {
                case "event":
                    result = vector_event;
                    break;
                case "company":
                    result = vector_company;
                    break;
                case "person":
                    result = vector_person;
                    break;
                case "video":
                    result = vector_video;
                    break;
                case "voice":
                    result = vector_voice;
                    break;
                case "phone":
                    result = vector_phone;
                    break;
                case "publish":
                    result = vector_publish;
                    break;
            }
        }
    </script>
</body>
</html>