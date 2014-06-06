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
