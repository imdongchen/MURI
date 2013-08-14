function initDataTable() {
    // initialize DataTable
    $('#event_tabs').tabs()
        .find('.ui-tabs-nav')
        .sortable({ axis: 'x', zIndex: 2 })
    ;
    $("div.ui-tabs-panel").css('padding','0px');

    eventTable = $('#event_all').dataTable({
        "bJQueryUI": true
      , 'sScrollY': '100%'
      , "aoColumns": [ 
             {"sWidth": "20%"} ,
             {"sWidth": "60%"},
             {"sWidth": "20%"},
        ]
//      , "aaData": d 
//        "sPaginationType": "full_numbers"
    });

    return eventTable;
}

function updateDataTable() {
     // prepare data for DataTable
    if (eventTable) {
        if (dDate == null) {
            return;
        }
        var d = [];
        dDate.top(Infinity).forEach(function(p, i) {
            var record = [];
            record.push(p.category, p.desc, formatDate(p.date));
            d.push(record);
        });
        eventTable.fnClearTable();
        eventTable.fnAddData(d);
    }
}


