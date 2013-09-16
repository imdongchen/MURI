SIIL.Workbench = function(div) {
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
        $('.evidence_div').hide();
        $('.accordion-body .editor_form').show(600);
        $('.rich_editor').jqteVal($(this).html());
        $('.jqte_editor').focus();
    });
    $('.editor_form #save_btn').click(function() {
        $('.editor_form').hide(600);
        $('.evidence_div').show(1000);
        $('.text_viewer').html($('.rich_editor').val());
    });

    $("#add_evidence_btn").click(function() {
        $('#add_evidence_btn').hide();
        $('.accordion-body .editor_form').show(600);
    });

};
