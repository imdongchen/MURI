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
    // Resource dialogue
    $("#resource_table_btn").click(function() {
        showDialogs(["resource_table"]);
    });
    // People dialogue
    $("#person_table_btn").click(function() {
        showDialogs(["person_table"]);
    });
    // Organization dialogue
    $("#organization_table_btn").click(function() {
        showDialogs(["organization_table"]);
    });
    // Event dialogue
    $("#event_table_btn").click(function() {
        showDialogs(["event_table"]);
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
                    close: function() {
                        map.destroy();
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
            case "event_table":
                $("#event_table").dialog($.extend({
                    title: "Events",
                    position: ['left', 36],
                    resizeStop: function() { eventTable.resize(); },
                    height: 800
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                eventTable = new SIIL.DataTable("#event_table");
                eventTable.update();
                break;
            case "message_table":
                $("#message_table").dialog($.extend({
                    title: "Messages",
                    position: ['left', 36],
                    resizeStop: function() { messageTable.resize(); },
                    height: 800
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                messageTable = new SIIL.DataTable("#message_table");
                messageTable.update();
                break;
            case "person_table":
                $("#person_table").dialog($.extend({
                    title: "People",
                    resizeStop: function() { eventTable.resize(); },
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                personTable = new SIIL.DataTable("#person_table");
                personTable.update();
                break;
            case "organization_table":
                $("#organization_table").dialog($.extend({
                    title: "Organizations",
                    resizeStop: function() { eventTable.resize(); },
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                organizationTable = new SIIL.DataTable("#organization_table");
                organizationTable.update();
                break;
            case "resource_table":
                $("#resource_table").dialog($.extend({
                    title: "Resources",
                    resizeStop: function() { eventTable.resize(); },
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                resourceTable = new SIIL.DataTable("#resource_table");
                resourceTable.update();
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

