(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'ol'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery', 'ol'));
    } else {
        factory(jQuery, ol); //依赖jQuery和openlayers3
    }
}(this, function() {
    var that;
    var Amap = function() {
        this.a = 'a';
        that = this;
    };
    Amap.prototype = {
        constructor: Amap,
        init : function(){
            console.log(this.a);
        },
        test : {
            init : function(){
                console.log(that.a);
            },
            run : function(){
                console.log(that.a);
            }
        },
        event : {
            controlEvent: function(event, active){
                var interactions = this.map.getInteractions();
                for (var i = 0; i < interactions.getLength(); i++) {
                    var interaction = interactions.item(i);
                    if (interaction instanceof event) {
                        interaction.setActive(active);
                    }
                }
            }
        }
    };
    return window.razor = new Amap();
}));
