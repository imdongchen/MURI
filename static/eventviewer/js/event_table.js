var eventTable = null;

function loadDataTable() {
    // prepare data for DataTable
    var d = [];
    date.top(Infinity).forEach(function(p, i) {
        var record = [];
        record.push(p.category, p.desc, p.date);
        d.push(record);
    });

    // initialize DataTable
    $('#event_tabs').tabs()
        .find('.ui-tabs-nav')
        .sortable({ axis: 'x', zIndex: 2 })
    ;
    $("div.ui-tabs-panel").css('padding','0px');

    eventTable = $('#event_all').dataTable({
        "bJQueryUI": true
      , 'sScrollY': '100%'
      , "aaData": d 
//        "sPaginationType": "full_numbers"
    });

}

function updateDataTable() {
     // prepare data for DataTable
    if (eventTable) {
        var d = [];
        date.top(Infinity).forEach(function(p, i) {
            var record = [];
            record.push(p.category, p.desc, p.date);
            d.push(record);
        });
        eventTable.fnClearTable();
        eventTable.fnAddData(d);
    }
}


