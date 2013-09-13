SIIL.DataTable = function(div) {
    // initialize DataTable
    this.columns = [];
    this.name = div.split("_")[0].split("#")[1]; // Temporary trick: use div name to distinguish data
    var self = this

    this.table = $(div).dataTable({
        "bJQueryUI": true, 
        "bDestroy": true,
        'sScrollY': '100%',
//      , "aoColumns": [ 
//             {"sWidth": "1%"} , // column 1 will be hidden
//             {"sWidth": "19%"} ,
//             {"sWidth": "60%"},
//             {"sWidth": "20%"},
//        ],
        // for multi select with ctrl and shift
        "sRowSelect": "multi",
        "sDom": "Rlfrtip",
        "fnPreRowSelect": function(e, nodes, isSelect) {
            if (e) {
                mySelectList = myDeselectList = null;
                if (e.shiftKey && nodes.length == 1) {
                    myDeselectList = this.fnGetSelected();
                    mySelectList = myGetRangeOfRows(cgTableObject, myLastSelection, nodes[0]);
                } else {
                    myLastSelection = nodes[0];
                    if (!e.ctrlKey) {
                        myDeselectList = this.fnGetSelected();
                        if (!isSelect) {
                            mySelectList = nodes;
                        }
                    }
                }
            }
            return true;
        },
        "fnRowSelected":   mySelectEventHandler,
        "fnRowDeselected": mySelectEventHandler,
//      , "aaData": d 
//        "sPaginationType": "full_numbers"
    });

    function mySelectEventHandler(nodes) {
        if (myDeselectList) {
            var nodeList = myDeselectList;
            myDeselectList = null;
            this.fnDeselect(nodeList);
        }
        if (mySelectList) {
            var nodeList = mySelectList;
            mySelectList = null;
            this.fnSelect (nodeList);
        }
    }
     
    function myGetRangeOfRows(oDataTable, fromNode, toNode) {
        var
            fromPos = oDataTable.fnGetPosition(fromNode),
            toPos = oDataTable.fnGetPosition(toNode);
            oSettings = oDataTable.fnSettings(),
            fromIndex = $.inArray(fromPos, oSettings.aiDisplay),
            toIndex = $.inArray(toPos, oSettings.aiDisplay),
            result = [];
     
        if (fromIndex >= 0 && toIndex >= 0 && toIndex != fromIndex) {
            for (var i=Math.min(fromIndex,toIndex); i < Math.max(fromIndex,toIndex); i++) {
                var dataIndex = oSettings.aiDisplay[i];
                result.push(oSettings.aoData[dataIndex].nTr);
            }
        }
        return result.length>0?result:null;
    }

    this.update = function() {
         // prepare data for DataTable
        if (dDate == null) {
            return;
        }
        var data = [];
        switch (self.name) {
            case "event":
                dEvent.top(Infinity).forEach(function(d) {
                    data.push([d.uid, d.name, d.types, d.date, d.excerpt]);
                });
//                record.push(p.uid, p.types, p.excerpt, formatDate(p.date));
                break;
            case "resource":
                dResource.group().top(Infinity).forEach(function(d) {
                    data.push(d.key);
                });
 //               record.push(p.uid, p.name);
                break;
            case "person":
                dPerson.group().top(Infinity).forEach(function(d) {
                    data.push(d.key);
                });
                break;
            case "organization":
                dOrganization.group().top(Infinity).forEach(function(d) {
                    data.push(d.key);
                });
//                record.push(p.uid, p.name, p.types);
                break;
        }
//        var d = [];
//        dDate.top(Infinity).forEach(function(p, i) {
//            var record = [];
//            switch (self.name) {
//                case "message":
//                    record.push(p.uid, p.types, p.excerpt, formatDate(p.date));
//                    break;
//                case "resource":
//                    record.push(p.uid, p.name);
//                    break;
//                case "person":
//                    record.push(p.uid, p.name, p.gender, p.race, p.nationality);
//                    break;
//                case "organization":
//                    record.push(p.uid, p.name, p.types);
//                    break;
//            }
//            d.push(record);
//        });
        this.table.fnClearTable();
        this.table.fnAddData(data);
        this.table.fnSetColumnVis(0, false); // set column 1 - id invisible
        
        self = this;
        this.table.$('tr').click(function(e) {
            if ( $(this).hasClass('row_selected') ) {
                $(this).removeClass('row_selected');
            } else {
                if (! e.shiftKey) {
                    self.table.$('tr.row_selected').removeClass('row_selected');
                }
                document.getSelection().removeAllRanges(); // disable text selection when shift+clik
                $(this).addClass('row_selected');
            }
        });

        this.table.$('tr').mouseover(function() {
            var data = self.table.fnGetData(this);
//          highlight(data[0]); // data[0]: event id
        });
        
//        function fnGetSelected (OTableLocal) {
//            alert('hi');
//        }
    };

    this.destroy = function() {
    };


};