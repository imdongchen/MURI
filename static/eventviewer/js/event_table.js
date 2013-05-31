$(document).ready(function () {
    $('#event_tabs').tabs()
        .find('.ui-tabs-nav')
        .sortable({ axis: 'x', zIndex: 2 })
    ;
    $("div.ui-tabs-panel").css('padding','0px');

    // init data tables
    $('#event_all').dataTable({
        "bJQueryUI": true
      , 'sScrollY': '100%'
      , "sAjaxSource": 'events/all'
//        "sPaginationType": "full_numbers"
    });

});
