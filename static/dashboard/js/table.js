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

        this.updateData();

        this._setupAnnotator();

        this.update();
    },

    _destroy: function() {
      this._destroyAnnotator();
      this._super('_destroy');
    },

    updateData: function() {
        var data = [];
        this.options.group.all().forEach(function(d) {
            if (d.key) {
                var dataentry = wb.store.dataentry[d.key];
                var date = dataentry.date ? wb.utility.formatDate(dataentry.date) : '';
                data.push([
                    d.key,                                    // data entry id
                    wb.store.dataset[dataentry.dataset].name,    // dataset name
                    dataentry.content,                       // data entry content
                    date   // data entry date
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
            .title('dataentry_table')
            .on('filter', function() {
                $.publish('/data/filter', this.element.attr("id")); // TODO: move the event listener to outside
            }.bind(this))
        ;
    },
    // update view
    update: function() {
        d3.select(this.element[0]).call(this.table);
    },
    reload: function() {
        this.element.empty();
        this.updateData();
        this._resetAnnotator();
        this.update();
    },

    highlight: function(item) {
      // highlight annotation
      var ele = this.element.closest(".ui-dialog");
      var annotator = ele.data('annotator');
      if (annotator) {
        var store = annotator.plugins['Store'];
        var annotations = store.annotations;
        if (annotations.length) {
          for (var i = 0, len = annotations.length; i < len; i++) {
            if (annotations[i].id == item) {
              var highlight = annotations[i].highlights[0];
              $(highlight).addClass('active');
              wb.utility.scrollTo(highlight, $('.dataTables_scrollBody', ele));
              break;
            }
          }
        } else {
          setTimeout(function() {
            this.highlight(item);
          }.bind(this), 1000);
        }
      }
    },

    _setupAnnotator: function() {
        var ele = this.element.closest(".ui-dialog");
        ele.annotator();
        ele.annotator('addPlugin', 'Store', {
            prefix: 'annotation',
            annotationData: {
              'case': wb.profile.case,
              'group': wb.profile.group.id
            },
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

    addAnnotations: function(annotations) {
      for (var i = 0, len = annotations.length; i < len; i++) {
        this.addAnnotation(annotations[i]);
      }
    },

    addAnnotation: function(annotation) {
      var ele = this.element.closest(".ui-dialog");
      var annotator = ele.data('annotator');
      if (annotator) {
        var store = annotator.plugins['Store'];
        var i = wb.utility.indexOf(annotation, store.annotations);
        if (i < 0) {
          store.registerAnnotation(annotation);
          annotator.setupAnnotation(annotation);
        } else {
          store.updateAnnotation(store.annotations[i], annotation);
        }
      }
    },

    updateAnnotations: function(annotations) {
      for (var i = 0, len = annotations.length; i < len; i++) {
        this.updateAnnotation(annotations[i]);
      }
    },

    updateAnnotation: function(annotation) {
      var ele = this.element.closest(".ui-dialog");
      var annotator = ele.data('annotator');
      if (annotator) {
        var store = annotator.plugins['Store'];
        var i = wb.utility.indexOf(annotation, store.annotations);
        if (i < 0) {
          store.registerAnnotation(annotation);
          annotator.setupAnnotation(annotation);
        } else {
          $(store.annotations[i].highlights).removeClass()
              .addClass('annotator-hl annotator-hl-' + annotation.tag.entity_type)
          ;
          store.updateAnnotation(store.annotations[i], annotation);
        }
      }

    },

    deleteAnnotations: function(annotations) {
      for (var i = 0, len = annotations.length; i < len; i++) {
        this.deleteAnnotation(annotations[i]);
      }
    },

    deleteAnnotation: function(annotation) {
      var ele = this.element.closest(".ui-dialog");
      var annotator = ele.data('annotator');
      if (annotator) {
        var store = annotator.plugins['Store'];
        var i = wb.utility.indexOf(annotation, store.annotations);
        if (i >= 0) {
          $(store.annotations[i].highlights).removeClass();
          store.unregisterAnnotation(store.annotations[i]);
        }
      }
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

        this.updateData();
        this.update();

        this.element.addClass("viztable entitytable");
        // this.element.data("entity", 'dataentry');
        this.element.data("viz", "vizVizentitytable");
    },
    updateData: function() {
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
                    // for (var attr in entity.meta) {
                    //   if (attr !== 'id') {
                    //     columns.push(attr);
                    //   }
                    // }
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
                // var meta = entity.meta;
                // for (var attr in meta) {
                //     if (attr !== 'id') {
                //       row.push(meta[attr]);
                //     }
                // }
                data.push(row);
            }
        });

        this.table = wb.viz.table()
            .columns(columns)
            .height(this.element.height() - 80)
            .data(data)
            .dimension(this.options.dimension)
            .group(this.options.group)
            .title(this.options.title + '_table')
            .on('filter', function() {
                $.publish('/data/filter', this.element.attr("id")); // TODO: move the event listener to outside
            }.bind(this))
            .editable(true)
            .on('edit', function(entity, attr) {
                $.publish('/entity/attribute/change', [entity, attr]);
            })
        ;
    },
    update: function() {
        d3.select(this.element[0]).call(this.table);
    },
    reload: function() {
        this.element.empty();
        this.updateData();
        this.update();
    },
    resize: function() {
        this._super('resize');
        this.element.find('.dataTables_scrollBody').css('height', (this.element.height() - 80))
    },

    highlight: function(item) {
      this.element.find('tr.odd, tr.even').each(function(i, row) {
        if ($(row).data('id') ==  item) {
          $(row).addClass('active');
          wb.utility.scrollTo(row, $(this).parents('.dataTables_scrollBody'));
        }
      });
    }
});


wb.viz.table = function() {
    var margin = {top: 20, right: 30, bottom: 30, left: 50},
        width = 500,
        height = 300
    ;
    var dimension, group, data, columns;
    var title;
    var table;
    var editable = false;
    var dispatch = d3.dispatch('filter', 'edit');

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
                var rows = $(table.fnGetNodes());
                rows.each(function(i, row) {
                    var pos = table.fnGetPosition(this);
                    var data = table.fnGetData(pos);
                    $(row).data("id", data[0]);
                });

                rows.find("td:first").click(function(e) {
                    if ( $(this.parentNode).hasClass('row_selected') ) {
                        $(this.parentNode).removeClass('row_selected');
                    } else {
                        if (! e.shiftKey) {
                            $('tr.row_selected', table).removeClass('row_selected');
                        }
                        document.getSelection().removeAllRanges(); // disable text selection when shift+clik
                        $(this.parentNode).addClass('row_selected');
                    }
                    var selected_rows = $('tr.row_selected', table);
                    if (selected_rows.length == 0) {
                        dimension.filterAll();

                        activitylog({
                            operation: 'removed filter in',
                            item: title,
                            tool: title,
                        });
                    } else {
                        records_id = [];
                        $('tr.row_selected', table).each(function(idx, $row) {
                            row = table.fnGetData($row);
                            records_id.push(row[0]);
                        });
                        dimension.filter(function(d) {
                            if (d) {
                                return records_id.indexOf(d) > -1;
                            }
                            return false;
                        });
                        var selected_names = [];
                        if (title !== 'dataentry_table') {
                          selected_names = records_id.map(function(id) {
                            return wb.store.entity[id].primary.name;
                          });
                        }
                        activitylog({
                            operation: 'filtered in',
                            item: title,
                            tool: title,
                            data: JSON.stringify({
                              'id': records_id.join(','),
                              'name': selected_names.join(',')
                            })
                        });

                    }
                    dispatch.filter();
                });

                if (editable) {
                    $('td', table.fnGetNodes()).editable("entity/attributes", {
                        tooltip: "Double click to edit",
                        cancel: "Cancel",
                        submit: "Save",
                        event: "dblclick",
                        indicator: '<img src="/static/dashboard/img/wait.gif">',
                        placeholder: "",
                        callback: function( sValue, y ) {
                            var aPos = table.fnGetPosition( this );
                            table.fnUpdate( sValue, aPos[0], aPos[2] );
                            dispatch.edit();
                        },
                        submitdata: function ( value, settings ) {
                            var column = table.fnGetPosition( this )[2];
                            var attr = table.fnSettings().aoColumns[column].sTitle.toLowerCase();
                            return {
                                id: $(this.parentNode).data("id"),
                                attribute: attr,
                            };
                        }
                    });
                }
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

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return exports;
    };

    exports.editable = function(_) {
        if (!arguments.length) return editable;
        editable = _;
        return exports;
    };

    return d3.rebind(exports, dispatch, 'on');
};
