$(document).ready(function () {

    // workspace dialogue
    $("#workspace_btn").click(function() {
        showDialogs(["workspace"]);
    });
    // map dialogue
    $("#map_btn").click(function() {
        showDialogs(["map"]);
    });
    // timeline dialogue
    $("#timeline_btn").click(function() {
        showDialogs(["timeline"]);
    });
    // Object dialogue
    $("#object_table_btn").click(function() {
        showDialogs(["object_table"]);
    });
    // Message dialogue
    $("#message_table_btn").click(function() {
        showDialogs(["message_table"]);
    });
    // Network dialogue
    $("#network_btn").click(function() {
        showDialogs(["network"]);
    });
});

function showDialogs(dialogs) {
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
    for (var i = 0, len = dialogs.length; i < len; i++) {
        switch (dialogs[i]) {
            case "map":
                $("#map").dialog($.extend({
                    title: "Map",
                    resizeStop: function() {
                        map.updateSize(); //to prevent resize-zoom error
                    },
                    dragStop: function() {
                        map.updateSize(); //to prevent drag-zoom error
                    },
                    position: ['left+400', 36]
                }, dialogOptions))
                    .dialogExtend($.extend({
                        maximize: function() {
                            map.updateSize();
                        },
                    }, dialogExtendOptions));
                map = new SIIL.Map("#map");
                map.update();
                break;
            case "timeline":
                var opt = $.extend({title: "Timeline"}, dialogOptions);
                opt.height = 200;
                opt.width = 1000;
                $("#timeline").dialog(opt).dialogExtend(dialogExtendOptions);
                timeline = new SIIL.Timeline("#timeline");
                timeline.each(render);
                break;
            case "message_table":
                $("#message_table").dialog($.extend({
                    title: "Message",
                    position: ['left', 36],
                    height: 800
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                messageTable = new SIIL.DataTable("#message_table");
                messageTable.update();
                break;
            case "object_table":
                $("#object_table").dialog($.extend({
                    title: "Object"
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                objectTable = new SIIL.DataTable("#object_table");
                objectTable.update();
                break;
            case "network":
                $("#network").dialog($.extend({
                    title: "Network"
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                network = new SIIL.Network("#network");
                network.update();
                break;
            case "workspace":
                $("#workspace").dialog($.extend({
                    title: "Workspace"
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                workspace = new SIIL.Workspace("#workspace");
                break;
        }
    }
}

