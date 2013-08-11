SIIL.DataTable = function(div) {
    // initialize DataTable
    $("#event_tabs").tabs()
        .find('.ui-tabs-nav')
        .sortable({ axis: 'x', zIndex: 2 })
    ;
    $("div.ui-tabs-panel").css('padding','0px');

    this.eventTable = $(div).dataTable({
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

    this.update = function() {
         // prepare data for DataTable
        if (dDate == null) {
            return;
        }
        var d = [];
        dDate.top(Infinity).forEach(function(p, i) {
            var record = [];
            record.push(p.category, p.desc, formatDate(p.date));
            d.push(record);
        });
        this.eventTable.fnClearTable();
        this.eventTable.fnAddData(d);
    };


};
