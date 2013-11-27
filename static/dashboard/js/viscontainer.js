$.widget("viz.vizcontainer", $.ui.dialogExtend, {
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
    update: function() {
	alert ("base");
    },
    destroy: function() {
        this._super("destroy");
    },
});
