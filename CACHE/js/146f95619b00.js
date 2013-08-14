$(function() {
    $("#workspace_btn").click(function() {
        var dialogOptions = {
            "title" : "Workspace",
            "width" : 800,
            "height" : 500,
            "modal" : false,
            "resizable" : true,
            "draggable" : true,
            "close" : function(){
                $(this).remove(); 
            }
        };
            // dialog-extend options
        var dialogExtendOptions = {
            "closable" :    true,
            "maximizable" : true,
            "minimizable" : true,
            "minimizeLocation" : "left",
            "collapsable" : true,
            "dblclick" : "maximize",
//            "titlebar" : $("#my-form [name=titlebar]:checked").val() || false
        };

        $("#workspace").dialog(dialogOptions).dialogExtend(dialogExtendOptions);
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
    });

    $(".editbtn").click(function() {
        $('.edit-box').show();
    });
});

