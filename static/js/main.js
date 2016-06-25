var offline_url = "http://localhost:8888/roadmap_chen/{z}/{x}/{y}.png";

var wgs84Sphere = new ol.Sphere(6378137);

var offlineMapLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: offline_url
    })
});

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

var style_text, point, popup, html;
var style_common = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
            color: 'rgb(168, 66, 66)'
        })
    })
});

var vector_show = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_draw = new ol.layer.Vector({source: new ol.source.Vector({wrapX: false})});

var vector_event = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_company = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_person = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_video = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_voice = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_phone = new ol.layer.Vector({source: new ol.source.Vector()});
var vector_publish = new ol.layer.Vector({source: new ol.source.Vector()});

var view = new ol.View({
    // extent: [124.35, 42.88, 126.35, 44.88], //[minX, minY, maxX, maxY]
    center: ol.proj.transform([125.35, 43.88], 'EPSG:4326', 'EPSG:3857'),
    zoom: 5,
    minZoom: 5,
    maxZoom: 15
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
html += '<li><a href="javascript:;" onclick="amap.draw.run(\'Polygon\', wfsSearch)">面</a></li>';
html += '<li><a href="javascript:;" onclick="amap.draw.run(\'Box\', wfsSearch)">区域</a></li>';
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
amap.draw.init({drawBeforeClear: true, drawMore: false});
amap.measure.init({measureBeforeClear: true, measureMore: false});

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
function clearLayers(){
    $(".btn-tool").addClass("btn-default").removeClass("btn-success").removeClass("state-on").button('reset');
    amap.clear(vector_draw.getSource());
    map.getLayers().forEach(function(item){
        if(item instanceof ol.layer.Vector){
            item.getSource().clear();
        }
    }, this);
}



$(".sidebar.left").sidebar({
    close: true
});

//点击查询按钮弹出侧边栏事件
$("#search").click(function() {
    $(".sidebar.left").trigger("sidebar:toggle");
});

//侧边栏收起事件
$(".sidebar.left").on("sidebar:opened", function() {
    $(".btn-tool").attr("disabled",true);
    if ($(".btn-tool").hasClass("state-on")) {
        $(".btn-tool").removeClass("btn-success").removeClass("state-on").addClass("btn-default");
    }
    vector_show.getSource().clear();
    vector_company.getSource().clear();
});

//侧边栏关闭事件
$(".sidebar.left").on("sidebar:closed", function() {
    $(".btn-tool").attr("disabled",false);
});

closer.onclick = function() {
    popup.setPosition(undefined);
    closer.blur();
    return false;
};

//点击要素的select事件注册
var selectEvent = new ol.interaction.Select({
    filter: function(feature, layer){
        return feature.get("id") !== undefined;
    }
});
map.addInteraction(selectEvent);

function searchInfo(type){
    switch (type) {
        case undefined:
            console.log("查询全部");
            break;
        case "event":
            console.log("查询事发地");
            break;
        case "company":
            console.log("查询单位");
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
function generatePoint(point, id, coordinate, name){
    point = new ol.Feature({
        id: id,
        geometry: new ol.geom.Point(ol.proj.transform(coordinate, "EPSG:4326", "EPSG:3857")),
    });
    style_text = new ol.style.Text({
        fill: new ol.style.Fill({
            color: '#08d2ff'
        }),
        stroke: new ol.style.Stroke({
            color: '#752586',
            width: 3
        })
    });
    if(name !== undefined && name !== null && name !== ""){
        style_text.setText(name);
        style_text.setFont("14px Calibri,sans-serif");
        style_text.setOffsetY(20);
    }
    point.setStyle(new ol.style.Style({
        text: style_text,
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: 'rgb(168, 66, 66)'
            })
        })
    }));
    return point;
}

function wfsSearch(geometry){
    $.ajax({
        url: 'static/json/event.json',
        type: 'GET',
        dataType: 'json',
        success: function(data){
            $.each(data, function(index, item){
                if(geometry.intersectsExtent(ol.proj.transform(item.coordinate, "EPSG:4326", "EPSG:3857"))){
                    point = generatePoint(point, item.id, item.coordinate, item.name);
                    point.setProperties({
                        "description": item.description,
                        "name": item.name,
                        "coordinate": item.coordinate,
                        "comandante": item.comandante
                    }, true);
                    vector_show.getSource().addFeature(point);
                }
            });
        }
    });
}

function showEvent(view){
    $.ajax({
        url: 'static/json/event.json',
        type: 'GET',
        dataType: 'json',
        success: function(data){
            $.each(data, function(index, item){
                point = generatePoint(point, item.id, item.coordinate, item.name);
                point.setProperties({
                    "description": item.description,
                    "name": item.name,
                    "coordinate": item.coordinate,
                    "comandante": item.comandante
                });
                point.setStyle(
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: item.name,
                            font: "14px Calibri,sans-serif",
                            offsetY: 20,
                            fill: new ol.style.Fill({
                                color: '#08d2ff'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#752586',
                                width: 3
                            })
                        }),
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: 'rgb(168, 66, 66)'
                            })
                        })
                    })
                );
                view.getSource().addFeature(point);
            });
        }
    });
}

function showCompany(view){
    $.ajax({
        url: 'static/json/company.json',
        type: 'GET',
        dataType: 'json',
        success: function(data){
            $.each(data, function(index, item){
                point = generatePoint(point, item.id, item.coordinate, null);
                point.setProperties({
                    "coordinate": item.coordinate,
                    "type": item.type,
                    "phone": item.phone,
                    "address": item.address
                }, true);
                point.setStyle(style_common);
                view.getSource().addFeature(point);
            });
        }
    });
}

selectEvent.on("select", function(event) {
    if (event.selected.length > 0) {
        var feature = event.selected[0];
        if (feature && feature.get("id")) {
            container.style.display = "";
            switch (feature.get("id")) {
                case "event":
                    popup = new ol.Overlay(({
                        id: "event"
                    }));
                    html = "<p><b>城市: " + feature.get("name") + "</b></p><p>简称: " + feature.get("comandante") + "</p><p>简介: " + feature.get("description") + "</p>";
                    break;
                case "company":
                    popup = new ol.Overlay(({
                        id: 'company'
                    }));
                    html = "<p><b>单位名称: " + feature.get("name") + "</b></p><p>联系电话: " + feature.get("phone") + "</p><p>联系地址: " + feature.get("address") + "</p>";
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
            popup.setElement(container);
            popup.set("autoPan", true, true);
            popup.set("autoPanAnimation", {
                duration: 250
            }, true);
            map.addOverlay(popup);
        }
    } else if (event.deselected.length > 0) {
        if (map.getOverlayById(event.deselected[0].get("id"))) {
            map.removeOverlay(map.getOverlayById(event.deselected[0].get("id")));
        }
    }
});
