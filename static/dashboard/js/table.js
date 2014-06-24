$.widget('viz.vizdataentrytable', $.viz.vizbase, {
    options: {
    },
    _create: function() {
        this.options.base.resizeStop = this.resize.bind(this);
        this.options.extend.maximize = this.resize.bind(this);
        this.options.extend.restore  = this.resize.bind(this);
        this._super('_create');
        this.element.addClass("viztable dataentrytable");
        this.element.data("viz", "vizVizdataentrytable");

        var data = [];
        this.options.group.all().forEach(function(d) {
            if (d.key) {
                var dataentry = wb.store.dataentry[d.key];
                data.push([
                    d.key,                                    // data entry id
                    wb.store.dataset[dataentry.dataset].name,    // dataset name
                    dataentry.content,                       // data entry content
                    wb.utility.formatDate(dataentry.date)   // data entry date
                ]);
            }
        });

        var columns = ['ID', 'Dataset', 'Content', 'Date'];

        this.table = wb.viz.table()
            .columns(columns)
            .height(this.element.height() - 80)
            .data(data)
            .dimension(this.options.dimension)
            .group(this.options.group)
            .on('filter', function() {
                $.publish('/data/filter', this.element.attr("id")); // TODO: move the event listener to outside
            }.bind(this))
        ;

        this._setupAnnotator();

        this.update();
    },
    update: function() {
        d3.select(this.element[0]).call(this.table);
    },
    _setupAnnotator: function() {
        var ele = this.element.closest(".ui-dialog");
        ele.annotator();
        ele.annotator('addPlugin', 'Store', {
            prefix: '/annotation',
            urls: {
                // These are the default URLs.
                create:  '/annotations',
                read:    '/annotations/:id',
                update:  '/annotations/:id',
                destroy: '/annotations/:id',
                search:  '/search'
            }
        });
        ele.annotator('addPlugin', 'Tags');
    },
    _destroyAnnotator: function() {
        var ele = this.element.closest(".ui-dialog");
        if (ele.data("annotator")) {
            ele.annotator("destroy");
        }
    },
    _resetAnnotator: function() {
        this._destroyAnnotator();
        this._setupAnnotator();
    },
    resize: function() {
        this._super('resize');
        this.element.find('.dataTables_scrollBody').css('height', (this.element.height() - 80))
    }
});


$.widget('viz.vizentitytable', $.viz.vizbase, {
    _create: function() {
        this.options.base.resizeStop = this.resize.bind(this);
        this.options.extend.maximize = this.resize.bind(this);
        this.options.extend.restore  = this.resize.bind(this);
        this._super('_create');

        // determine columns first
        var columns = ['ID', 'Name'];
        this.options.group.top(2).some(function(d) {
            if (d.key) {
                var entity = wb.store.entity[d.key];
                if (entity) {
                    for (var attr in entity.primary) {
                        if (attr !== 'id' && attr !== 'name' && attr !== 'entity_type') {
                            columns.push(attr);
                        }
                    }
                }
                return true;
            }
        });

        var data = [];
        this.options.group.all().forEach(function(d) {
            if (d.key) {
                var entity = wb.store.entity[d.key];
                var primary = entity.primary;
                var row = [primary.id, primary.name];
                for (var attr in primary) {
                    if (attr !== 'id' && attr !== 'name' && attr !== 'entity_type') {
                        row.push(primary[attr]); // assume the order is as the columns
                    }
                }
                data.push(row);
            }
        });

        this.table = wb.viz.table()
            .columns(columns)
            .height(this.element.height() - 80)
            .data(data)
            .dimension(this.options.dimension)
            .group(this.options.group)
            .on('filter', function() {
                $.publish('/data/filter', this.element.attr("id")); // TODO: move the event listener to outside
            }.bind(this))
        ;

        this.update();

        this.element.addClass("viztable entitytable");
        // this.element.data("entity", 'dataentry');
        this.element.data("viz", "vizVizentitytable");
    },
    update: function() {
        d3.select(this.element[0]).call(this.table);
    },
    resize: function() {
        this._super('resize');
        this.element.find('.dataTables_scrollBody').css('height', (this.element.height() - 80))
    }
});


wb.viz.table = function() {
    var margin = {top: 20, right: 30, bottom: 30, left: 50},
        width = 500,
        height = 300
    ;
    var dimension, group, data, columns;
    var table;
    var dispatch = d3.dispatch('filter');

    function exports(selection) {
        selection.each(function() {
            if (!table) {
                var table_str = '<table style="width:100%;"><thead><tr>';
                for (var i = 0, len = columns.length; i < len; i++) {
                    table_str += '<th>' + columns[i] + '</th>';
                }
                table_str += '</tr></thead></table>';
                var $table = $(table_str).appendTo(this);

                table = $table.dataTable({
                    "bJQueryUI": true,
                    "bDestroy": true,
                    'sScrollY': height,
                    'bPaginate': false,
                    "sRowSelect": "multi", // for multi select with ctrl and shift
                    "sDom": "Rlfrtip", // enable column resizing
                });

                table.fnAddData(data);
                table.fnSetColumnVis(0,false); // hide the first column, which is id

                // save data entry into DOM TODO: maybe this is not necessary?
                var self = this;
                table.$('tr').each(function(i, row) {
                    var pos = table.fnGetPosition(this);
                    var data = table.fnGetData(pos);
                    $(row).data("id", data[0]);
                });

                table.$('tr').find("td:first").click(function(e) {
                    if ( $(this.parentNode).hasClass('row_selected') ) {
                        $(this.parentNode).removeClass('row_selected');
                    } else {
                        if (! e.shiftKey) {
                            table.$('tr.row_selected').removeClass('row_selected');
                        }
                        document.getSelection().removeAllRanges(); // disable text selection when shift+clik
                        $(this.parentNode).addClass('row_selected');
                    }
                    var selected_rows = table.$('tr.row_selected');
                    if (selected_rows.length == 0) {
                        dimension.filterAll();

                        activitylog({
                            operation: 'defilter',
                            data: JSON.stringify({'window_type': 'table'})
                        });
                    } else {
                        records_id = [];
                        table.$('tr.row_selected').each(function(idx, $row) {
                            row = table.fnGetData($row);
                            records_id.push(row[0]);
                        });
                        dimension.filter(function(d) {
                            if (d) {
                                return records_id.indexOf(d) > -1;
                            }
                            return false;
                        });
                        activitylog({
                            operation: 'filter',
                            data: JSON.stringify({'window_type': 'table', 'filter_by': records_id})
                        });

                    }
                    dispatch.filter();
                });
            }
            // filter table
            var filter = '';
            group.all().forEach(function(d) {
                if (d.key && d.value) {
                    filter += '^' + d.key + '$|';
                }
            });
            filter = filter.substring(0, filter.length - 1); // remove the last '|' character
            if (!filter) {
                // trick: if filter is blank, the default action datatable will take is to show all data
                // to avoid that, set filter to something impossible
                filter = '^$';
            }
            table.fnFilter(filter, 0, true); // 2nd param: which column to filter; 3rd param: to use regular expression or not


        });
    }

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return exports;
    };

    exports.dimension = function(_) {
        if (!arguments.length) return dimension;
        dimension = _;
        return exports;
    };

    exports.filter = function(_) {

        return exports;
    };

    exports.group = function(_) {
        if (!arguments.length) return group;
        group = _;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return exports;
    };

    exports.columns = function(_) {
        if (!arguments.length) return columns;
        columns = _;
        return exports;
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };
    return d3.rebind(exports, dispatch, 'on');
};


$.widget("viz.viztable", $.viz.vizcontainer, {
    options: {
        dimension: null,
        columns: [],
        taggable: false,
        editable: false,
        data: ""
    },
    _create: function() {
        var thead = '<table style="width: 100%;"><thead><tr>';
        for (var i = 0, len = this.options.columns.length; i < len; i++) {
            thead += '<th>' + this.options.columns[i] + '</th>';
        }
        thead += '</tr></thead></table>';
        $(thead).appendTo(this.element);

        var _this = this;
        this.table = this.element.find('table').dataTable({
            "bJQueryUI": true,
            "bDestroy": true,
            'sScrollY': _this.element.height()-80,
            'bPaginate': false,
            //      , "aoColumns": [
            //             {"sWidth": "1%"} , // column 1 will be hidden
            //             {"sWidth": "19%"} ,
            //             {"sWidth": "60%"},
            //             {"sWidth": "20%"},
            //        ],
            // for multi select with ctrl and shift
            "sRowSelect": "multi",
            "sDom": "Rlfrtip", // enable column resizing
//            "fnPreRowSelect": function(e, nodes, isSelect) {
//                if (e) {
//                    var mySelectList = null,
//                        myDeselectList = null;
//                    if (e.shiftKey && nodes.length == 1) {
//                        myDeselectList = this.fnGetSelected();
//                        mySelectList = myGetRangeOfRows(cgTableObject, myLastSelection, nodes[0]);
//                    } else {
//                        myLastSelection = nodes[0];
//                        if (!e.ctrlKey) {
//                            myDeselectList = this.fnGetSelected();
//                            if (!isSelect) {
//                                mySelectList = nodes;
//                            }
//                        }
//                    }
//                }
//                return true;
//            },
//            "fnRowSelected":   mySelectEventHandler,
//            "fnRowDeselected": mySelectEventHandler,
//            //      , "aaData": d
//            //        "sPaginationType": "full_numbers"
            // "fnDrawCallback": function(oSettings) {
            //     // var ele =  this.closest(".ui-dialog");
            //     // if (ele.data("annotator")) {
            //     //     ele.annotator("destroy");
            //     //     _this._setupAnnotator();
            //     // }
            //
            // }
        });
        // hide the ID column
//        this.table.fnSetColumnVis(0,false);


        var table = this.table;
        var self = this;
        this.element.subscribe("table/updated", function() {
            table.$('tr').find("td:first").click(function(e) {
                if ( $(this.parentNode).hasClass('row_selected') ) {
                    $(this.parentNode).removeClass('row_selected');
                } else {
                    if (! e.shiftKey) {
                        table.$('tr.row_selected').removeClass('row_selected');
                    }
                    document.getSelection().removeAllRanges(); // disable text selection when shift+clik
                    $(this.parentNode).addClass('row_selected');
                }
                var selected_rows = table.$('tr.row_selected');
                if (selected_rows.length == 0) {
                    self.options.dimension.filterAll();

                    activitylog({
                        operation: 'defilter',
                        data: JSON.stringify({'window_type': 'table'})
                    });
                } else {
                    records_id = [];
                    self.table.$('tr.row_selected').each(function(idx, $row) {
                        row = self.table.fnGetData($row);
                        records_id.push(row[0]);
                    });
                    self.options.dimension.filter(function(d) {
                        if (d[0] !== undefined) {
                        }
                        for (var i = 0; i < records_id.length; i++) {
                            if (d[0] === records_id[i]) {
                                return true;
                            }
                        }
                    });
                    activitylog({
                        operation: 'filter',
                        data: JSON.stringify({'window_type': 'table', 'filter_by': records_id})
                    });

                }
                $.publish('/data/filter', self.element.attr("id"));

            });

            if (self.options.editable) {
                $('td', table.fnGetNodes()).editable("entity/attributes", {
                    tooltip: "Double click to edit",
                    cancel: "Cancel",
                    submit: "Save",
                    event: "dblclick",
                    indicator: '<img src="/static/dashboard/img/wait.gif">',
                    placeholder: "",
                    "callback": function( sValue, y ) {
                        var aPos = table.fnGetPosition( this );
                        table.fnUpdate( sValue, aPos[0], aPos[2] );
                    },
                    "submitdata": function ( value, settings ) {
                        var column = table.fnGetPosition( this )[2];
                        var attr = table.fnSettings().aoColumns[column].sTitle.toLowerCase();
                        return {
                            "row_id": $(this.parentNode).data("id"),
                            "attr": attr,
                            "entity": self.element.data("entity")
                        };
                    }
                })
            }

        })

        this.element.on("dialogresizestop", function() {
            this.element.css("width", "auto");
            this.element.parents('.ui-dialog').css("height", 'auto');
            this.element.find('.dataTables_scrollBody').css('height', (this.element.height() - 80))
        }.bind(this));

        this.element.addClass("viztable");
        this.element.addClass("viz");
        if (this.options.taggable) {
            this.element.addClass('messageTable');
        }
        this.element.data("entity", this.options.data);
        this.element.data("viz", "vizViztable");
        this._super("_create");
        this.update();


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
    },
    _setupAnnotator: function() {
        var ele = this.element.closest(".ui-dialog");
        ele.annotator();
        ele.annotator('addPlugin', 'Store', {
            prefix: '/annotation',
            urls: {
                // These are the default URLs.
                create:  '/annotations',
                read:    '/annotations/:id',
                update:  '/annotations/:id',
                destroy: '/annotations/:id',
                search:  '/search'
            }
        });
        ele.annotator('addPlugin', 'Tags');
    },
    destroyAnnotator: function() {
        var ele = this.element.closest(".ui-dialog");
        if (ele.data("annotator")) {
            ele.annotator("destroy");
        }
    },
    resetAnnotator: function() {
        this.destroyAnnotator();
        this._setupAnnotator();
    },
    resize: function() {
        this.table.fnAdjustColumnSizing();
    },
    update: function() {
        // prepare data for DataTable
        if (this.options.dimension === null) {
            return;
        }
        var data = [];
        this.options.dimension.group().top(Infinity).forEach(function(d) {
            if (d.value !== 0 && d.key[0] !== undefined) {
                row = [];
                for (var i = 0, len = d.key.length; i < len; i++) {
                    row.push(d.key[i]);
                }
                data.push(row);
            }
        });
        this.table.fnClearTable();
        this.table.fnAddData(data);
        var _table = this.table;
        var self = this;
        this.table.$('tr').each(function(i, row) {
            var pos = _table.fnGetPosition(this);
            var data = _table.fnGetData(pos);
            $(row).data("id", data[0]);

        });

        if (this.options.taggable) {
            // Reset annotation but delayed, to avoid stuck when brushing
            var delayed_resetAnnotation = _.debounce(this.resetAnnotator, 1000);
            _.bind(delayed_resetAnnotation, this)();
        }
        this.element.publish("table/updated");
    },

    highlight: function() {
    },
    destroy: function() {
    }
});
