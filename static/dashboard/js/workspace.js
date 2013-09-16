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
    $(".rich_editor").jqte();
    $(".text_viewer").html("<b>hello</b>");

//    $('.accordion-body .header').html('Indicators & Warnings');
    $('.accordion-body .header').focus(function() {
        if ($(this).html() == 'Indicators &amp; Warnings') {
            $(this).html('');
        }
    });
    $('.accordion-body .header').blur(function() {
        if ($(this).html() == '' || $(this).html() == '<br>') {
            $(this).html('Indicators & Warnings');
        }
    });
    $('.accordion-body .text_viewer').focus(function() {
        $(this).hide();
        $('.jqte').show();
        $('.rich_editor').jqteVal($(this).html());
        $('.jqte_editor').focus();
    });

};
