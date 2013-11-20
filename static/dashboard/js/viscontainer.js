$.widget("vis.viscontainer", $.ui.dialogExtend, {
    options: {
        color: "red",
        "closable" :    true,
        "maximizable" : true,
        "minimizable" : true,
        "minimizeLocation" : "left",
        "collapsable" : true,
        "dblclick" : "collapse",
        "close" : function(){
            this.destroy();
        }

    },
    _create: function() {
        this._super("_create");
    },
    destroy: function() {
        this._super("destroy");
    },
});
