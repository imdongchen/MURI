$.widget("viz.viznetwork", $.viz.vizbase, {
    _create: function() {
        this.options.base.resizeStop = this.resize.bind(this);
        this.options.extend.maximize = this.resize.bind(this);
        this.options.extend.restore  = this.resize.bind(this);
        this._super('_create');
        this.element.addClass("viz viznetwork");
        this.element.data("viz", "vizViznetwork")

        this.ENTITY = ['dataentry', 'person', 'organization', 'location', 'event', 'resource']

        this._setupUI();
        this._setupEventListener();
        this._setupForceLayout();

        this.updateData();
        this.update();

    },

    _setupForceLayout: function() {
        this.margin = {top: 35, bottom: 5, left: 13, right: 5};
        this.width  = this.element.width() - this.margin.left - this.margin.right;
        this.height = this.element.height() - this.margin.top - this.margin.bottom;
        this.nodeMap = {};
        this.nodes = [];
        this.links = [];
        // mouse event vars
        this.selected_node = null,
        this.selected_link = null;
        this.mousedown_link = null;
        this.mousedown_node = null;
        this.mouseup_node = null;

        this.svg = d3.select(this.element[0])
            .each(function() { this.focus(); })
            .append("svg:svg")
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("pointer-events", "all")
        ;
        // define node image
        for (var i = 0; i < this.ENTITY.length; i++) {
            this.svg.append('svg:defs')
                .append('svg:pattern').attr('id', 'img-'+this.ENTITY[i]).attr('patternUnits', 'userSpaceOnUse').attr('x', '12').attr('y', '12').attr('height','24').attr('width','24')
                .append('image').attr('x', '0').attr('y', '0').attr('width', 24).attr('height', 24).attr('xlink:href', STATIC_URL + 'dashboard/img/' + this.ENTITY[i] + '.png')
            ;
        }

        // define arrow markers for links
        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'linkarrow')
        ;

        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('class', 'linkarrow');

        this.force = d3.layout.force()
            .nodes(this.nodes)
            .links(this.links)
            .charge(-400)
            .linkDistance(120)
            .size([this.width, this.height])
            .on("tick", this._tick.bind(this))
        ;

        // d3 behaviors
        this.zoom = d3.behavior.zoom();
        this.brush = d3.svg.brush();
        this.drag = this.force.drag();

        this.svg = this.svg.append('svg:g')
            .call(this.zoom)
            .append('g')
        ;

        this.svg.append('svg:rect')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('fill', 'white')
        ;

        this.link = this.svg.selectAll("path");
        this.node = this.svg.selectAll("g");

        // line displayed when dragging new nodes
        this.drag_line = this.svg.append('svg:path')
            .attr('class', 'dragline hidden')
            .attr('d', 'M0,0L0,0');
    },

    _tick: function() {
        this.link.attr('d', function(d) {
                var deltaX = d.target.x - d.source.x,
                    deltaY = d.target.y - d.source.y,
                    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                    normX = deltaX / dist,
                    normY = deltaY / dist,
                    sourcePadding = d.left ? 17 : 12,
                    targetPadding = d.right ? 17 : 12,
                    sourceX = d.source.x + (sourcePadding * normX),
                    sourceY = d.source.y + (sourcePadding * normY),
                    targetX = d.target.x - (targetPadding * normX),
                    targetY = d.target.y - (targetPadding * normY);
//                    return "M" + sourceX + "," + sourceY + "A" + dist + "," + dist + " 0 0,1 " + targetX + "," + targetY;
                return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
            })
        ;

        this.node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    },

    _setupUI: function() {
      // filter bar
      var filterbar = '<div class="network-filterbar"><ul>';
      for (var i = 0; i < this.ENTITY.length; i++) {
          filterbar += '<li><input type="checkbox" id="'
                      + this.ENTITY[i]
                      + '-check" checked value="'
                      + this.ENTITY[i]
                      + '" style="margin-right: 5px;"/><label for="'
                      + this.ENTITY[i]
                      + '-check">'
                      + this.ENTITY[i]
                      + '</label>'
          ;
      }
      filterbar += '</ul></div>';
      this.element.append(filterbar);

      // network viewer
      var viewer = '\
        <div class="network-viewer"> \
            <span class="network-viewer-controls"> \
              <button type="button" title="delete" class="close delete"><span class="glyphicon glyphicon-remove"></span></button> \
              <button type="button" title="edit" class="close edit"><span class="glyphicon glyphicon-pencil"></span></button> \
            </span> \
        </div> \
      ';
      //
      // network editor
      var editor = '\
        <div class="network-editor"> \
            <div class="relationship-label"> \
              <span class="rel-source"></span> \
              <span class="glyphicon glyphicon-arrow-right"></span> \
              <span class="rel-target"></span> \
            </div> \
            <form> \
              <input name="relation" id="relation" placeholder="Relationship..."/>  \
              <textarea name="description" id="desc" placeholder="Description..."/>  \
              <button type="button" title="Save" class="save"><span class="glyphicon glyphicon-ok-circle"></span></button> \
              <button type="button" title="cancel" class="cancel"><span class="glyphicon glyphicon-remove-circle"></span></button> \
            </form> \
        </div> \
      ';
      $(viewer).appendTo(this.element);
      $(editor).appendTo(this.element);
    },


    _setupEventListener: function() {
      d3.select('body')
        .on("keydown", this._onSetMode.bind(this))
        .on("keyup", this._onExitMode.bind(this));

      $('.network-filterbar :checkbox').change(this._onSetFilter.bind(this));

      $('.network-editor .save').click(this._onEditorSave.bind(this));
      $('.network-editor .cancel').click(this._onEditorCancel.bind(this));

      $('.network-viewer .delete').click(this._onViewerDelete.bind(this));
      $('.network-viewer .edit').click(this._onViewerEdit.bind(this));

      $('.network-viewer').mouseleave(function() {
        $(this).hide();
        $('.network-viewer').data('link', null);
        $('.network-viewer').data('node', null);
      });
    },


    _onSetFilter: function(e) {
      var display = '';
      var value = e.target.value;

      if (! e.target.checked) {
          // hide node and associated links
          display = 'none';
      }
      this.svg.selectAll('.node').transition().style('display', function(o) {
          if (value === 'dataentry') {
              if (o.primary === undefined) {
                  return display;
              } else {
                  return this.style.display;
              }
          } else {
              if (o.primary && o.primary.entity_type === value) {
                  return display;
              } else {
                  return this.style.display;
              }
          }
      });
      this.svg.selectAll('.link').transition().style('display', function(o) {
          if (value === 'dataentry') {
              if (o.source.primary === undefined || o.target.primary === undefined) {
                  return display;
              } else {
                  return this.style.display;
              }
          } else {
              if ((o.source.primary && o.source.primary.entity_type === value) || (o.target.primary && o.target.primary.entity_type === value)) {
                  return display;
              } else {
                  return this.style.display;
              }
          }
      });

    },

    _onSetMode: function(e) {
      if (d3.event.shiftKey) {
          this.mode = "filter";
      }
      else if (d3.event.altKey) {
          this.mode = "draw";
      }
      else {
          this.mode = "normal";
      }
      this.setMode(this.mode);
    },

    _onExitMode: function(e) {
      this.mode = "normal";
      this.setMode(this.mode);
    },

    _onViewerEdit: function(e) {
      var $viewer = $('.network-viewer');
      var link = $viewer.data('link');
      var node = $viewer.data('node');

      $viewer.hide();

      if (link) {
        this.showLinkEditor(link);
      }
      if (node) {
        this.showNodeEditor(node);
      }
    },

    _onViewerDelete: function(e) {
      var $viewer = $('.network-viewer');
      var link = $viewer.data('link');
      var node = $viewer.data('node');

      if (link) {
        // delete a relationship
        $.ajax({
          url: 'relationship',
          type: 'DELETE',
          data: JSON.stringify({
            source: link.source.id,
            target: link.target.id,
            rel: link.relation,
            id: link.id
          }),
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          success: function(d) { // return deleted relationship
            $.publish('/relationship/delete', [[d.relationship]]);
            wb.utility.notify('1 relationship deleted', 'success');
          }
        });
      }
      if (node) {
        // delete an entity
      }

      $viewer.hide();

    },

    _onEditorCancel: function(e) {
      $('.network-editor form')[0].reset();
      $('.network-editor').hide();
      var link = $('.network-editor').data('link');

      // // delete the link
      // var i = this.findLink(link);
      // if (i >= 0) {
      //   this.links.splice(i, 1);
      // }
      $('.network-editor').data('link', null);
      this.selected_link = null;

      this.restart();
    },

    _onEditorSave: function(e) {
      var link = $('.network-editor').data('link');
      var rel = $('.network-editor #relation').val();
      var desc = $('.network-editor #desc').val();
      link.relation = rel;
      link.description = desc;
      $.post('relationship', {
          source: link.source.id,
          target: link.target.id,
          rel: rel,
          desc: desc
      }, function(d) {
          $('.network-editor form')[0].reset();
          $('.network-editor').hide();

          // add attr to link
          var rel = d.relationship;
          link.id = rel.primary.id;
          link.created_by = rel.primary.created_by;
          link.created_at = rel.primary.created_at;

          if (d.created) {
            // the link could be created or simply updated
            $.publish('/relationship/add', [[rel]]);
            wb.utility.notify('1 relationship added!', 'success');
          } else {
            // because only the attribute of the relationship changes, we do
            // not need to publish the event
            $.publish('/relationship/update', [[rel]]);
            wb.utility.notify('1 relationship updated!', 'success');
          }


          $('.network-editor').data('link', null);
          this.selected_link = null;
      });

    },


    setMode: function(mode) {
        this.exitAllModes();
        switch (mode) {
            case "normal":
                this.setNormalMode();
                break;
            case "draw":
                this.setDrawMode();
                break;
            case "filter":
                this.setFilterMode();
                break;
        }
    },

    setDrawMode: function() {
        var _this = this;
        this.svg.on("mousemove", function(d) {
            if(!_this.mousedown_node) {
                return;
            }
            _this.drag_line.attr('d', 'M' + _this.mousedown_node.x + ',' + _this.mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

            _this.restart();
        })

        this.svg.on("mouseup", function() {
            if(_this.mousedown_node) {
                // hide drag line
                _this.drag_line
                    .classed('hidden', true)
                    .style('marker-end', '');
            }

            // because :active only works in WebKit?
            _this.svg.classed('active', false);

            // clear mouse event vars
            _this.resetMouseVars();
        })

        this.node.on("mousedown", function(d) {
            // select node
            _this.mousedown_node = d;
            if(_this.mousedown_node === _this.selected_node) _this.selected_node = null;
            else _this.selected_node = _this.mousedown_node;
            _this.selected_link = null;

            // reposition drag line
            _this.drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + _this.mousedown_node.x + ',' + _this.mousedown_node.y + 'L' + _this.mousedown_node.x + ',' + _this.mousedown_node.y);

            // _this.restart();
            _this.force.stop();
        })

        this.node.on("mouseup", function(d) {
            if(!_this.mousedown_node) return;

            // needed by FF
            _this.drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            _this.mouseup_node = d;
            if(_this.mouseup_node === _this.mousedown_node) { _this.resetMouseVars(); return; }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target;
            source = _this.mousedown_node;
            target = _this.mouseup_node;

            var link;
            link = _this.links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if(link) {

            } else {
                link = {source: source, target: target};
                _this.links.push(link);
            }

            // select new link
            _this.selected_link = link;
            _this.selected_node = null;

            _this.showLinkEditor(link);


            _this.restart();
        });

    },

    setFilterMode: function() {
        var _this = this;
        var brushX=d3.scale.linear().range([0, this.width]),
            brushY=d3.scale.linear().range([0, this.height]);

        this.svg.append('g')
            .attr('class', 'brush')
            .call(this.brush
                .on("brushstart", brushstart)
                .on("brush", brushing)
                .on("brushend", brushend)
                .x(brushX)
                .y(brushY)
            )
        ;

        function brushstart() {
            // do whatever you want on brush start
        }

        function brushing() {
            var e = _this.brush.extent();
            var selected_nodes = [], selected_relationships = [];
            d3.selectAll(".node").classed("selected", function(d) {
                d.selected = e[0][0] <= brushX.invert(d.x) && brushX.invert(d.x) <= e[1][0]
                    && e[0][1] <= brushY.invert(d.y) && brushY.invert(d.y) <= e[1][1];
                if (d.selected) {
                    selected_nodes.push(d);
                    selected_relationships = selected_relationships.concat(d.relationships);
                }
                return d.selected;
            });

            if (selected_relationships.length > 0) {
                selected_relationships = wb.utility.uniqueArray(selected_relationships);

                _this.options.dimension.filter(function(d) {
                    if (d > 0) return selected_relationships.indexOf(d) >= 0;
                    return false;
                });

                $.publish('/data/filter', _this.element.attr("id"))
            }
        }

        function brushend() {
            d3.select(this).call(d3.event.target);
            var e = _this.brush.extent();
            // empty brush deselects all nodes
            if (_this.brush.empty()) {
                d3.selectAll(".node").classed("selected", function(d) {
                    return d.selected = false;
                });
                _this.options.dimension.filterAll();
                $.publish('/data/filter', _this.element.attr("id"))

                activitylog({
                    operation: 'removed filter in',
                    item: 'network',
                    tool: 'network'
                });
            }
            else {
                var nodes_id = [];
                d3.selectAll('.node.selected').each(function(d) {
                    nodes_id.push(d.id)
                })
                var selected_name = nodes_id.map(function(id) {
                  id = id.split('-');
                  if (id[0] === 'entity') {
                    return wb.store.entity[id[1]].primary.name;
                  }
                });
                activitylog({
                    operation: 'filtered in',
                    item: 'network',
                    tool: 'network',
                    data: {
                      'id': nodes_id.join(','),
                      'name': selected_name.join(',')
                    }
                });
            }

//            vis.selectAll("circle").attr("fill", function(d) {
//                truth = e[0][0] <= brushX.invert(d.x) && brushX.invert(d.x) <= e[1][0]
//                    && e[0][1] <= brushY.invert(d.y) && brushY.invert(d.y) <= e[1][1];
//                if (truth) { d.selected = true; }
//            });
        }
    },

    setNormalMode: function() {
        var _this = this;

        this.zoom.on('zoom', zoomed);
        this.node.call(this.drag
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragend)
        );
        this.node
            .on('mouseover', this.onMouseOverNode.bind(this))
            .on('mouseout', this.onMouseOutNode.bind(this))
            .on('click', this.onClickNode.bind(this))
        ;

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function dragged(d) {
//            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        }

        function dragend(d) {
            d3.select(this).classed("dragging", false);
            d.fixed = true;
        }
        function zoomed() {
            _this.svg.attr("transform",
                "translate(" + d3.event.translate + ")"
                    + " scale(" + d3.event.scale + ")");
        }
    },

    exitAllModes: function() {
        // exit draw mode
        this.svg.on("mousemove", null).on("mouseup", null);
        this.node.on("mousemove", null).on("mouseup", null).on("mousedown", null);
        // exit zoom mode
        this.zoom.on('zoom', null);
//        this.svg.select('g.zoom').remove();
        // exit brush mode
        this.svg.select('.brush').remove();
        this.svg.on("mousemove.brush", null).on('mousedown.brush', null).on('mouseup.brush', null);
        // exit drag mode
        this.node.on('mousedown.drag', null);
    },

    showLinkEditor: function(l) {
      var $editor = $('.network-editor').show()
          // .css('top', (this.mouseup_node.y + this.mousedown_node.y)/2.0)
          // .css('left', (this.mouseup_node.x + this.mousedown_node.x)/2.0)
          .css('top', (l.source.y + l.target.y)/2.0)
          .css('left', (l.source.x + l.target.x)/2.0)
          .data('link', l)
      ;

      var node_type = l.source.id.split('-')[0];
      if (node_type === 'dataentry') {
        var source = 'dataentry';
      } else {
        var source = l.source.primary.name;
      }
      var target = l.target.primary.name;
      $editor.find('.rel-source').text(source);
      $editor.find('.rel-target').text(target);
      // add link attributes if any
      $editor.find('#relation').val(l.relation);
      $editor.find('#desc').val(l.description);
    },


    showNodeEditor: function(d) {

    },

    showLinkInfo: function(l, pos) {
        $('.network-viewer .attr-list').remove();
        var str = "<table class='attr-list'>";
        for (var attr in l) {
          if (attr !== 'source' && attr !== 'target' && attr !== 'id'
              && attr !== 'created_by' && attr !== 'last_edited_by' && l[attr]) {
            str += "<tr><th>" + wb.utility.capitalizeFirstLetter(attr)
                  + ": </th><td>" + l[attr] + "</td></tr>";
          }
        }
        str += "<tr><th>Created by: </th><td>" + wb.profile.users[l.created_by].name + "</td></tr>";
        str += "<tr><th>Last edited by: </th><td>" + wb.profile.users[l.last_edited_by].name + "</td></tr>";
        str += "</table>";
        $(str).appendTo($('.network-viewer'));

        $('.network-viewer').data('link', l);

        var width = $('.network-viewer').outerWidth();
        var height = $('.network-viewer').outerHeight();
        $('.network-viewer')
          .css('left', pos.left - width/2 + 'px')
          .css('top', pos.top - height - 10 + 'px')
          .css('position', 'absolute')
          .css('display', 'block')
        ;
    },

    showNodeInfo: function(d, pos) {
        $('.network-viewer .attr-list').remove();
        var tooltip = "<table class='attr-list'>";
        if (d.id) {
            var node = d.id.split('-');
            var node_type = node[0], node_id = node[1];
            if (node_type === 'dataentry') {
                tooltip += '<tr><th>Content</th><td>' + d.content + '</td></tr>';
                tooltip += '<tr><th>Dataset</th><td>' + wb.store.dataset[d.dataset].name + '</td></tr>';
                tooltip += '<tr><th>Date</th><td>' + wb.utility.formatDate(d.date) + '</td></tr>';
            } else {
                var primary = d.primary;
                tooltip += '<tr><th>' + wb.utility.capitalizeFirstLetter(primary.entity_type) + '</th><td>' + primary.name + '</td></tr>';
                for (var attr in primary) {
                    if (attr !== 'name' && attr !== 'entity_type' && attr !== 'id' && primary[attr]) {
                        tooltip += '<tr><th>' + wb.utility.capitalizeFirstLetter(attr) + '</th><td>' + primary[attr] + '</td></tr>';
                    }
                }
            }
            tooltip += '</table>';
            $(tooltip).appendTo('.network-viewer')
            $('.network-viewer').data('node', d);

            var width = $('.network-viewer').outerWidth();
            var height = $('.network-viewer').outerHeight();
            d3.select(".network-viewer")
                .style('position', 'absolute')
                .style('left', pos.left - width/2 + "px")
                .style('top', (pos.top - height - 10) + "px")
                .style('display', 'block');
        }
    },

    hideLinkInfo: function() {
        setTimeout(function() {
          if (!$('.network-viewer:hover').length) {
            $('.network-viewer').hide();
            $('.network-viewer').data('link', null);
          }
        }, 300);
    },

    hideNodeInfo: function() {
        setTimeout(function() {
          if (!$('.network-viewer:hover').length) {
            $('.network-viewer').hide();
            $('.network-viewer').data('node', null);
          }
        }, 300);
    },

    findNode: function(id, node) {
        var node_id = node + '-' + id;
        return this.nodeMap[node_id];
    },

    findLink: function(link) {
      if (link.id) {
        for (var i = 0, len = this.links.length; i < len; i++) {
          if (link.id === this.links[i].id) return i;
        }
        return -1;
      } else {
        for (var i = 0, len = this.links.length; i < len; i++) {
          if (link.source === this.links[i].source
             && link.target === this.links[i].target
             && link.relation === this.links[i].relation) {
               return i;
             }
        }
        return -1;
      }
    },

    addNode: function(id, node) {
        var existed_node = this.findNode(id, node);
        if (existed_node) {
            return existed_node;
        } else {
            var node_id = node + '-' + id;
            var entity = $.extend({}, wb.store[node][id]);
            entity.id = node_id;
            this.nodeMap[node_id] = entity;
            this.nodes.push(entity);
            return entity;
        }
    },

    addLink: function(source, target, source_node, target_node, relationship) {
        var source_entity = this.addNode(source, source_node);
        var target_entity = this.addNode(target, target_node);
        var link = {
            source: source_entity,
            target: target_entity,
            // confidence: 1,
            relation: relationship.primary.relation,
            description: relationship.primary.description,
            date: relationship.primary.date,
            id: relationship.primary.id,
            created_by: relationship.meta.created_by,
            created_at: relationship.meta.created_at,
            last_edited_by: relationship.meta.last_edited_by,
            last_edited_at: relationship.meta.last_edited_at
        };
        var i = this.findLink(link);
        if (i < 0) {
          this.links.push(link);
          if (source_entity.relationships) {
            source_entity.relationships.push(link.id);
          } else {
            source_entity.relationships = [link.id];
          }
          if (target_entity.relationships) {
            target_entity.relationships.push(link.id);
          } else {
            target_entity.relationships = [link.id];
          }
        }
    },

    updateData: function() {
        var _this = this;

        this.links = [];

        this.options.group.all().forEach(function(d) {
            if (d.key > 0) {
                var relationship = wb.store.relationship[d.key];
                var target = relationship.primary.target;
                var source;
                if (relationship.primary.source) {
                    source = relationship.primary.source;
                    _this.addLink(source, target, 'entity', 'entity', relationship);
                } else {
                    source = relationship.primary.dataentry; // if primary.source is undefined, it is the relationship between data entry and entity
                    _this.addLink(source, target, 'dataentry', 'entity', relationship);
                }
            }
        });
    },

    update: function() {
        var links = this.svg.selectAll('.link');
        var nodes = this.svg.selectAll('.node');
        links.style('display', 'none');
        nodes.style('display', 'none');
        var nodes_to_show = [], links_to_show = [];

        this.options.group.all().forEach(function(d) {
            if (d.key > 0 && d.value) {
                var relationship = wb.store.relationship[d.key];
                nodes_to_show.push('entity-' + relationship.primary.target);
                if (relationship.primary.source) {
                    nodes_to_show.push('entity-' + relationship.primary.source);
                } else {
                    nodes_to_show.push('dataentry-' + relationship.primary.dataentry);
                }
            }
        });

        var nodes_to_show_unique = wb.utility.uniqueArray(nodes_to_show);
        nodes.style('display', function(d) {
            if (nodes_to_show_unique.indexOf(d.id) < 0) return 'none'; // hide if not in the list
            else return null;
        });
        links.style('display', function(d) {
            // show link only if its source and target nodes are both in the list
            if (nodes_to_show_unique.indexOf(d.source.id) < 0 || nodes_to_show_unique.indexOf(d.target.id) < 0) return 'none';
            else return null;
        });
        this.restart();
        this.setMode('normal');
    },

    reload: function() {
        this.updateData();
        this.update();
    },

    resetMouseVars: function() {
        this.mousedown_node = null;
        this.mouseup_node = null;
        this.mousedown_link = null;
    },

    restart: function() {
        var _this = this;

        this.link = this.link.data(this.links);
        this.link.enter().append("svg:path")
            .attr("class", "link")
            .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
            .style('marker-end', function(d) { return 'url(#end-arrow)'; })
            .on("mouseover", this.onMouseOverLink.bind(this))
            .on("mouseout", this.onMouseOutLink.bind(this))
            .on('click', this.onClickLink.bind(this))
        ;
        // this.selected_link && this.selected_link.style('stroke-dasharray', '10,2');

        this.link.append('svg:title')
            .text(function(d) { return d.rel; })
        ;
        this.link.exit().remove();

        this.node = this.node.data(this.nodes, function(d) {
            return d.id;
        });

        var g = this.node.enter().append("svg:g").attr('class', 'node');

        g.append("svg:circle")
            .attr('r', 12)
            .attr('fill', function(d) {
                var node = d.id.split('-')[0];
                if (node === 'entity') { // node is an entity
                    return "url(#img-" + d.primary.entity_type + ")";
                }
                else { // node is data entry
                    return "url(#img-dataentry)";
                }
            })
        ;

        g.append("text")
            .attr('class', 'node-text')
            .attr("x", 0)
            .attr("y", 4)
            .style("text-anchor", "middle")
            .attr("dy", "-.95em")
            .text(function(d) {
                if (d.primary) {
                    return d.primary.name.length < 20 ? d.primary.name : d.primary.name.substring(0, 20) + '...';
                } else {
                    return wb.utility.formatDate(d.date);
                }
            })
            .style("-webkit-user-select", "none"); // disable text selection when dragging mouse

        this.node.exit().remove();


        // calculate the link length
        //            var k = Math.sqrt(nodes.length / (this.width * this.height));
        //            force.charge(-10 / k)
        //                .gravity(100 * k)

        this.force.start();
    },

    resize: function() {
        this._super('resize');
        this.width = this.element.width() - this.margin.left - this.margin.right;
        this.height = this.element.height() - this.margin.top - this.margin.bottom;
        this.element.find('svg').attr('width', this.width).attr('height', this.height);
        this.element.find('svg').find('rect').attr('width', this.width).attr('height', this.height);
        this.force.size([this.width, this.height]).resume();
        this.force.start();
    },

    onMouseOverNode: function(d) {
      // this.highlightNode(d);

      var pos = wb.utility.mousePosition(d3.event, this.element);
      this.showNodeInfoTimer = setTimeout(function() {
        this.showNodeInfo(d, pos);
      }.bind(this), 500);
    },

    onMouseOutNode: function(d) {
      // this.unhighlightNode(d);
      clearTimeout(this.showNodeInfoTimer);
      this.hideNodeInfo(d);
    },

    onClickNode: function(d) {
      var highlighted;
      this.node.each(function(o) {
        if (o.id === d.id) {
          // whether the svg has class active
          // jquery hasClass() failed on svg
          highlighted = /active/.test($(this).attr('class'));
          return false;
        }
      });
      if (highlighted) {
        this.unhighlightNode(d);
      } else {
        this.highlightNode(d);
      }
    },

    onMouseOverLink: function(d) {
      // this.highlightLink(d);

      var pos = wb.utility.mousePosition(d3.event, this.element);
      this.showLinkInfoTimer = setTimeout(function() {
        this.showLinkInfo(d, pos);
      }.bind(this), 500);
    },

    onMouseOutLink: function(d) {
      // this.unhighlightLink(d);
      clearTimeout(this.showLinkInfoTimer);
      this.hideLinkInfo(d);
    },

    onClickLink: function(d) {
      var highlighted;
      this.link.each(function(o) {
        if (o.id === d.id) {
          highlighted = /active/.test($(this).attr('class'));
          return false;
        }
      });
      if (highlighted) {
        this.unhighlightLink(d);
      } else {
        this.highlightLink(d);
      }

    },

    highlight: function(item) {
      // highlight relationship
      this.highlightLink({id: +item});
    },

    highlightLink: function(d) {
      var container = d3.select(this.element[0]);
      container.selectAll('.link').classed('dim', function(o) {
        if (o.id !== d.id) {
          d3.select(this).classed('active', false);
          return true;
        } else {
          d3.select(this).classed('active', true);
          return false;
        }
      });
      container.selectAll('.node').classed('dim', function(o) {
        if (o.relationships.indexOf(d.id) < 0) {
          d3.select(this).classed('active', false);
          return true;
        } else {
          d3.select(this).classed('active', true);
          return false;
        }
      });
    },

    unhighlightLink: function() {
      var container = d3.select(this.element[0]);
      container.selectAll('.node').classed({
        'dim': false,
        'active': false
      });
      container.selectAll('.link').classed({
        'dim': false,
        'active': false
      });

    },

    highlightNode: function(nodeData) {
        var container = d3.select(this.element[0]);
        var connected_nodes = [nodeData.id];

        container.selectAll('.link').classed('dim', function(o) {
          if (o.source.id === nodeData.id) {
            connected_nodes.push(o.target.id);
            d3.select(this).classed('active', true);
            return false;
          } else if (o.target.id === nodeData.id) {
            connected_nodes.push(o.source.id);
            d3.select(this).classed('active', true);
            return false;
          } else {
            d3.select(this).classed('active', false);
            return true;
          }
        });
        container.selectAll('.node').classed('dim', function(o) {
          if(connected_nodes.indexOf(o.id) < 0) {
            d3.select(this).classed('active', false);
            return true;
          } else {
            d3.select(this).classed('active', true);
            return false;
          }
        });
        // transverse link again
        // highlight links if both its source and target are highlighted
        container.selectAll('.link').classed('dim', function(o) {
          if (connected_nodes.indexOf(o.source.id) > -1
              && connected_nodes.indexOf(o.target.id) > -1) {
            d3.select(this).classed('active', true);
            return false;
          }
          d3.select(this).classed('active', false);
          return true;
        })

        // d3.select(this).select('circle').attr('transform', 'scale(1.5)');
    },

    unhighlightNode: function() {
      var container = d3.select(this.element[0]);

      container.selectAll('.node').classed({
        'dim': false,
        'active': false
      });
      container.selectAll('.link').classed({
        'dim': false,
        'active': false
      });
      // d3.select(this).select('circle').attr('transform', '');
    },

    destroy: function() {
    }
});


