$(function() {
    $("#workspace_btn").click(function() {
        var dialogOptions = {
            "title" : "Workspace",
            "width" : 400,
            "height" : 300,
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
        $( ".accordion" ).accordion();
    });
});
