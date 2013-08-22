SIIL.Workspace = function(div) {
    $( ".accordion" ).accordion({
            collapsible: true,
            header: "> div > div.header"
        }).sortable({
            axis: "y",
            handle: "h3",
            stop: function( event, ui ) {
              // IE doesn't register the blur when sorting
              // so trigger focusout handlers to remove .ui-state-focus
              ui.item.children( "h3" ).triggerHandler( "focusout" );
            }
        });
};
