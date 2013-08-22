$(document).ready(function () {
    var dialogOptions = {
//        "title" : "Workspace",
        "width" : 800,
        "height" : 500,
        "modal" : false,
        "resizable" : true,
        "draggable" : true
//        "close" : function(){
//            $(this).remove(); 
//        }
    };
        // dialog-extend options
    var dialogExtendOptions = {
        "closable" :    true,
        "maximizable" : true,
        "minimizable" : true,
        "minimizeLocation" : "left",
        "collapsable" : true,
        "dblclick" : "collapse",
    };
    // workspace dialogue
    $("#workspace_btn").click(function() {
        $("#workspace").dialog($.extend({
            title: "Workspace"
        }, dialogOptions))
            .dialogExtend(dialogExtendOptions);
        workspace = new SIIL.Workspace("#workspace");
    });
    // map dialogue
    $("#map_btn").click(function() {
        $("#map").dialog($.extend({
            title: "Map",
            resizeStop: function() {
                map.updateSize(); //to prevent resize-zoom error
            },
            dragStop: function() {
                map.updateSize(); //to prevent drag-zoom error
            }
        }, dialogOptions))
            .dialogExtend(dialogExtendOptions);
        map = new SIIL.Map("#map");
        map.update();
    });
    // timeline dialogue
    $("#timeline_btn").click(function() {
        var opt = $.extend({title: "Timeline"}, dialogOptions);
        opt.height = 200;
        opt.width = 1000;
        $("#timeline").dialog(opt).dialogExtend(dialogExtendOptions);
        timeline = new SIIL.Timeline("#timeline");
        timeline.each(render);
    });
    // Object dialogue
    $("#object_table_btn").click(function() {
        $("#object_table").dialog($.extend({
            title: "Object"
        }, dialogOptions))
            .dialogExtend(dialogExtendOptions);
        objectTable = new SIIL.DataTable("#object_table");
        objectTable.update();
    });
    // Message dialogue
    $("#message_table_btn").click(function() {
        $("#message_table").dialog($.extend({
            title: "Message"
        }, dialogOptions))
            .dialogExtend(dialogExtendOptions);
        messageTable = new SIIL.DataTable("#message_table");
        messageTable.update();
    });
    // Network dialogue
    $("#network_btn").click(function() {
        $("#network").dialog($.extend({
            title: "Network"
        }, dialogOptions))
            .dialogExtend(dialogExtendOptions);
        network = new SIIL.Network("#network");
        network.update();
    });
});


