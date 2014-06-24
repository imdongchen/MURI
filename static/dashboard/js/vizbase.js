$.widget("viz.vizcontainer", $.ui.dialogExtend, {
    options: {
        color: "red",
        "closable" :    true,
        "maximizable" : true,
        "minimizable" : true,
        "minimizeLocation" : "right",
        "collapsable" : true,
        "dblclick" : "collapse",
        "close" : function(){
            this.destroy();
        },
        maximize: this.resize

    },
    _create: function() {
        this._super("_create");
    },
    update: function() {
        alert ("base");
    },
    resize: function() {
        this.element.publish('resize');
    },
    destroy: function() {
        this._super("destroy");
    },
});

$.widget('viz.vizbase', {
    options: {
        title: '',
        dimension: null,
        group: null,
        width: 800,
        height: 500,
        base: { // for jquery dialog
            modal : false,
            resizable : true,
            draggable : true,
            closeOnEscape: false,
        },
        extend: { // for jquery dialogextend
            maximizable : true,
            minimizable : true,
            minimizeLocation : "right",
            collapsable : true,
            dblclick : "collapse",
        }
    },
    _create: function() {
        if (!this.options.base.close) {
            this.options.base.close = this._destroy.bind(this);
        }
        if (!this.options.base.resizeStop) {
            this.options.base.resizeStop = this.resize.bind(this);
        }
        this.options.base.width = this.options.width;
        this.options.base.height = this.options.height;
        this.options.base.title = this.options.title;
        this.element.dialog(this.options.base).dialogExtend(this.options.extend);
        this.element.addClass('viz');
    },
    resize: function() {
        this.element.css("width", "auto");
        this.element.parents('.ui-dialog').css("height", 'auto');
    },
    _destroy: function() {
        if (this.options.dimension) {
            this.options.dimension.filterAll();
            $.publish('/data/filter');
        }
        $.publish("/viz/close", [this.element.attr("id"), this.element.dialog('option', 'title')]);
        this.element.dialog('destroy').remove();
    }
})
