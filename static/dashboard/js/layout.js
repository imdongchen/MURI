$(document).ready(function () {
    var container_options = {
        "width" : 800,
        "height" : 500,
        "modal" : false,
        "resizable" : true,
        "draggable" : true,
        "closeOnEscape": false,
        "close": function() {
            $(this).dialog('destroy').remove();
            $.publish("/viz/close", [$(this).attr("id")]);
        }
    };
    // workbench dialogue
    $("#workbench_btn").click(function() {
        viz_panels.push(
            $("<div>").dialog($.extend({
                "title": "Workbench",
            }, container_options))
            .vizworkbench()
        );
    });
    // map dialogue
    $("#map_btn").click(function() {
        viz_panels.push(
            $("<div>").dialog($.extend({
                "title": "Map",
            }, container_options))
            .vizmap({
                dimension: dLocation
            })
        );
    });
    // timeline dialogue
    $("#timeline_btn").click(function() {
        viz_panels.push(
            $("<div>").dialog($.extend({}, container_options, {
                "title": "Timeline",
                "width": 1000,
                "height": 200
            }))
            .viztimeline({
                dimension: dDate
            })
        );
    });
    $("#message_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                "title": "Messages"
            }))
            .viztable({
                "dimension": dMessage,
                "columns": ['ID', 'Content', 'Date'],
                "taggable": true
            });
        viz_panels.push( table );
    });
    // Location dialogue
    $("#location_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                    "title": "Locations"
                }))
                .viztable({
                    "dimension": dLocation,
                    "columns": ['ID', 'Name'],
                    "editable": true,
                    "data": "location"
                });
        viz_panels.push( table );
    });
    // Resource dialogue
    $("#resource_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                    "title": "Resources"
                }))
                .viztable({
                    "dimension": dResource,
                    "columns": ['ID', 'Name', 'Condition', 'Type'],
                    "editable": true,
                    "data": "resource"
                });
        viz_panels.push( table );
    });
    // People dialogue
    $("#person_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                    "title": "Persons"
                }))
                .viztable({
                    "dimension": dPerson,
                    "columns": ['ID', 'Name', 'Gender', 'Race', 'Nationality'],
                    "editable": true,
                    "data": "person"
                });
        viz_panels.push( table );
    });
    // Organization dialogue
    $("#organization_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                    "title": "Organizations"
                }))
                .viztable({
                    "dimension": dOrganization,
                    "columns": ['ID', 'Name', 'Type', 'Nationality', 'Ethnicity', 'religion'],
                    "editable": true,
                    "data": "organization"
                });
        viz_panels.push( table );
    });
    // Event dialogue
    $("#event_table_btn").click(function() {
        var table =
            $("<table>").dialog($.extend({}, container_options, {
                    "title": "Events"
                }))
                .viztable({
                    "dimension": dEvent,
                    "columns": ['ID', 'Name', 'Types', 'Date'],
                    "editable": true,
                    "data": "event"
                });
        viz_panels.push( table );
    });
    // Network dialogue
    $("#network_btn").click(function() {
        var network =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Network"
                }))
                .viznetwork({
                    'dimension': dNetwork
                });
        viz_panels.push( network );
    });
});

function showDialogs(dialogs) {
    var dialogOptions = {
//        "title" : "Workbench",
        "width" : 800,
        "height" : 500,
        "modal" : false,
        "resizable" : true,
        "draggable" : true,
//        "close" : function(){
//            $(this).empty(); 
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
            case "location_table":
                $("#location_table").dialog($.extend({
                    title: "Locations",
                    resizeStop: function() { eventTable.resize(); },
                    width: 200
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                locationTable = new SIIL.DataTable("#location_table");
                locationTable.update();
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
            case "workbench":
                var dialogLayout;
                $("#workbench").dialog($.extend({
                    title: "Workbench",
                    open:		function() {
                                                    var layout_settings = {
                                                        zIndex:			0		// HANDLE BUG IN CHROME - required if using 'modal' (background mask)
                                                ,	resizeWithWindow:	false	// resizes with the dialog, not the window
                                                ,	spacing_open:		6
                                                ,	spacing_closed:		6
                                                ,	west__size:			'30%' 
                                                ,	west__minSize:		100 
                                                ,	west__maxSize:		300 
                                                ,       center__childOptions: {
                                                    center__paneSelector:	".inner-center"
                                                        ,       north__size:	150 
                                                        ,       spacing_open: 6
                                                    ,      	north__minSize:		100 
                                                        ,	north__maxSize:		300 
                                                        
                                                }
//                                                ,	south__closable:	false 
//                                                ,	south__resizable:	false 
//                                                ,	south__slidable:	false 
                                                //,	applyDefaultStyles:		true // DEBUGGING
                                        };
							if (!dialogLayout) {
								// init layout *the first time* dialog opens
								dialogLayout = $("#workbench").layout( layout_settings );
                                                        } else
								// just in case - probably not required
								dialogLayout.resizeAll();
						}
		,	resize:		function() { if (dialogLayout) dialogLayout.resizeAll(); },
                        close: function() {
                            workbench.destroy();
                        },
                    
                }, dialogOptions))
                    .dialogExtend(dialogExtendOptions);
                workbench = new SIIL.Workbench("#workbench");
                break;
        }
    }
};

