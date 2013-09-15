SIIL.Workspace = function(div) {
    $( ".accordion" ).accordion({
            collapsible: true,
            header: "> div > div.accordion-header"
        }).sortable({
            axis: "y",
            handle: "h3",
            stop: function( event, ui ) {
              // IE doesn't register the blur when sorting
              // so trigger focusout handlers to remove .ui-state-focus
              ui.item.children( "h3" ).triggerHandler( "focusout" );
            }
        });
    $(".accordion-body").jstree({
        core: {
            load_open: true,
            html_titles: false,

        },
        plugins: ["themes", "html_data", "ui", "dnd", "contextmenu", "crrm", "types"],
        contextmenu: {
            items: customMenu
        },
        themes: {
//            "url": "{{STATIC_URL}}eventviewer/css/workspace.css"
        },
        types: {
            "valid_children": ["indicator"],
            "max_depth": 2, 
            "types": {
                "indicator": {
                    "valid_children": ["default"],
                    "icon": {
                        "image": "{{STATIC_URL}}dashboard/img/indicator.png"
                    }
                },
                "default": {
                    "valid_children": "none",
                    "icon": {
                        "image": "{{STATIC_URL}}dashboard/img/evidence.png"
                    },
                }
            }
        }
    })
        .bind("create.jstree", function(e, data) {
            // post to server about the change
        })
        .bind("remove.jstree", function(e, data) {
            // post to server about the change
        })
        .bind("rename.jstree", function(e, data) {
            // post to server about the change
        })
        .bind("move_node.jstree", function(e, data) {
            // post to server about the change
        });

    $('.accordion-body').bind('dblclick.jstree', function(obj) {
        $(".accordion-body").jstree("rename");
    });

    function customMenu(node) {
        // The default set of all items
        var items = {
            renameItem: { // The "rename" menu item
                label: "Edit",
                action: function(obj) {
                    this.rename(obj);
                }
            },
            deleteItem: { // The "delete" menu item
                label: "Delete",
                action: function (obj) {
                    this.remove(obj);
                }
            },
            createIndicator: {
                label: "Add Indicator",
                action: function(obj) {
//                    $(".accordion-body").jstree("create", null, "last", { "attr": { "rel": "indicator"} });
                    this.create_node(obj, "after", { "attr": { "rel": "indicator"}, "data": "New indicator" } );
                }
            },
            createEvidence: {
                label: "Add Evidence",
                action: function(obj) {
                    this.create_node(obj, "after", { "attr": { "rel": "default"}, "data": "New evidence" } );
                }
            }
        };

        if ($(node).hasClass("default")) {
            // Delete the "delete" menu item
            items.createIndicator._disabled = true;
        }

        return items;
    }
};
