$(document).ready(function () {
    var container_options = {
        "width" : 800,
        "height" : 500,
        "modal" : false,
        "resizable" : true,
        "draggable" : true,
        "closeOnEscape": false,
        "close": function() {
            $.publish("/viz/close", [$(this).attr("id"), $(this).dialog('option', 'title')]);
            $(this).dialog('destroy').remove();
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
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'map'})
        })
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
        var table;
        table =
            $("<div>").dialog($.extend({}, container_options, {
                "title": "Messages"
            }))
            .viztable({
                "dimension": dMessage,
                "columns": ['ID', 'Content', 'Date'],
                "taggable": true,
                "data": "message"
            })
        ;
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'message table'})
        })
    });
    // Location dialogue
    $("#location_table_btn").click(function() {
        var table =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Locations"
                }))
                .viztable({
                    "dimension": dLocation,
                    "columns": ['ID', 'Name'],
                    "editable": true,
                    "data": "location"
                });
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'location table'})
        })
    });
    // Resource dialogue
    $("#resource_table_btn").click(function() {
        var table =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Resources"
                }))
                .viztable({
                    "dimension": dResource,
                    "columns": ['ID', 'Name', 'Condition', 'Type'],
                    "editable": true,
                    "data": "resource"
                });
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'resource table'})
        })
    });
    // People dialogue
    $("#person_table_btn").click(function() {
        var table =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Persons"
                }))
                .viztable({
                    "dimension": dPerson,
                    "columns": ['ID', 'Name', 'Gender', 'Race', 'Nationality'],
                    "editable": true,
                    "data": "person"
                });
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'person table'})
        })
    });
    // Organization dialogue
    $("#organization_table_btn").click(function() {
        var table =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Organizations"
                }))
                .viztable({
                    "dimension": dOrganization,
                    "columns": ['ID', 'Name', 'Type', 'Nationality', 'Ethnicity', 'religion'],
                    "editable": true,
                    "data": "organization"
                });
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'organization table'})
        })
    });
    // Event dialogue
    $("#event_table_btn").click(function() {
        var table =
            $("<div>").dialog($.extend({}, container_options, {
                    "title": "Events"
                }))
                .viztable({
                    "dimension": dEvent,
                    "columns": ['ID', 'Name', 'Types', 'Date'],
                    "editable": true,
                    "data": "event"
                });
        viz_panels.push( table );
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'event table'})
        })
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
        activitylog({
            operation: 'open window',
            data: JSON.stringify({'window_type': 'network table'})
        })
    });
});
