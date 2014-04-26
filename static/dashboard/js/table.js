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
            "fnDrawCallback": function(oSettings) {
                var ele =  this.closest(".ui-dialog");
                if (ele.data("annotator")) {
                    ele.annotator("destroy");
                    _this._setupAnnotator();
                }

            }
        });
        // hide the ID column
//        this.table.fnSetColumnVis(0,false);

        if (this.options.taggable) {
            this._setupAnnotator();
        }

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
                    })
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
                    })

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

        })
        this.table.fnGetNodes().forEach(function(row) {
            var id = row[0]
        })
        this.element.publish("table/updated");

        $('body').highlight("Rashid")

    },
    // get the selected text as plain format
    _selectionGet: function() {
        // for webkit, mozilla, opera
        if (window.getSelection)
            return window.getSelection();
        // for ie
        else if (document.selection && document.selection.createRange && document.selection.type != "None")
            return document.selection.createRange();
    },

    _markText: function(tag, classvalue) {
        if (window.getSelection)
        {
            var selObj = selectionGet(), selRange, newElement, documentFragment;

            if (selObj.anchorNode && selObj.getRangeAt)
            {
                selRange = selObj.getRangeAt(0);

                // create to new element
                newElement = document.createElement(tag);

                // add the attribute to the new element
                $(newElement).removeClass();
                $(newElement).addClass(classvalue);

                // extract to the selected text
                documentFragment = selRange.extractContents();


                // add the contents to the new element
                newElement.appendChild(documentFragment);

                selRange.insertNode(newElement);
                selObj.removeAllRanges();

                // if the attribute is "style", change styles to around tags
//				if(tAttr=="style")
//					affectStyleAround($(newElement),tVal);
//				// for other attributes
//				else
//					affectStyleAround($(newElement),false);
            }
        }
        // for ie
        else if (document.selection && document.selection.createRange && document.selection.type != "None")
        {
            var range = document.selection.createRange();
            var selectedText = range.htmlText;

            var newText = '<'+ tTag +' '+tAttr+'="'+tVal+'">'+selectedText+'</'+tTag+'>';

            document.selection.createRange().pasteHTML(newText);
        }
    },
    /**
     * Gets an XPath for an element which describes its hierarchical location.
     */
    _getElementXPath : function(element)
    {
        if (element && element.id)
            return '//*[@id="' + element.id + '"]';
        else
            return this._getElementTreeXPath(element);
    },

    _getElementTreeXPath : function(element)
    {
        var paths = [];

        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        for (; element && element.nodeType == 1; element = element.parentNode)
        {
            var index = 0;
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
            {
                // Ignore document type declaration.
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                    continue;

                if (sibling.nodeName == element.nodeName)
                    ++index;
            }

            var tagName = element.nodeName.toLowerCase();
            var pathIndex = (index ? "[" + (index+1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    },

    highlight: function() {
    },
    destroy: function() {
    }
});
