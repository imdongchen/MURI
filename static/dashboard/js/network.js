$.widget("viz.viznetwork", $.viz.vizbase, {
    _create: function() {
        this.options.base.resizeStop = this.resize.bind(this);
        this.options.extend.maximize = this.resize.bind(this);
        this.options.extend.restore  = this.resize.bind(this);
        this._super('_create');
        this.element.addClass("viz viznetwork");
        this.element.data("viz", "vizViznetwork")

        var images = ['person', 'organization', 'location', 'event', 'dataentry', 'resource']
        var filterbar = '<ul id="network-filterbar">';
        for (var i = 0; i < images.length; i++) {
            filterbar += '<li><input type="checkbox" id="' + images[i] +'-check"/><label for="' + images[i] + '-check">' + images[i] + '</label>';
        }
        filterbar += '</ul>';
        // this.element.append($(filterbar)); // TODO: add this filter bar after filter function is completed
        this.margin = {top: 35, bottom: 5, left: 13, right: 5};
        this.width  = this.element.width() - this.margin.left - this.margin.right;
        this.height = this.element.height() - this.margin.top - this.margin.bottom;
        this.nodeMap = {};
        this.nodes = [];
        this.links = [];
        var _this = this;

        d3.select("body")
            .on("keydown", function() {
                if (d3.event.shiftKey) {
                    _this.mode = "filter";
                }
                else if (d3.event.altKey) {
                    _this.mode = "draw";
                }
                else {
                    _this.mode = "normal";
                }
                _this.setMode(_this.mode);
            })
            .on("keyup", function() {
                _this.mode = "normal";
                _this.setMode(_this.mode);
            })
        ;

        this.svg = d3.select(this.element[0])
            .each(function() { this.focus(); })
            .append("svg:svg")
            .attr('width', this.width)
            .attr('height', this.height)
            .attr("pointer-events", "all")
        ;
        // define node images
        for (var i = 0; i < images.length; i++) {
            this.svg.append('svg:defs')
                .append('svg:pattern').attr('id', 'img-'+images[i]).attr('patternUnits', 'userSpaceOnUse').attr('x', '12').attr('y', '12').attr('height','24').attr('width','24')
                .append('image').attr('x', '0').attr('y', '0').attr('width', 24).attr('height', 24).attr('xlink:href', STATIC_URL + 'dashboard/img/' + images[i] + '.png')
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
            .on("tick", tick)
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

        // mouse event vars
        this.selected_node = null,
        this.selected_link = null;
        this.mousedown_link = null;
        this.mousedown_node = null;
        this.mouseup_node = null;

        this.updateData();
        this.update();

        function tick(e) {
            // Push sources up and targets down to form a weak tree.
            var k = 6 * e.alpha;

            _this.link.attr('d', function(d) {
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

            _this.node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        };
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

            _this.restart();
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

            // pop up relationship form
            _this.element.append($('#relation_form')
                .show().focus()
                .css('top', (_this.mouseup_node.y + _this.mousedown_node.y)/2.0)
                .css('left', (_this.mouseup_node.x + _this.mousedown_node.x)/2.0)
            );
            $('#relation_form form').submit(function(e) {
                var rel = $('#relation').val();
                link.rel = rel;
                $.post('relationship', {
                    source: link.source.id,
                    target: link.target.id,
                    rel: link.rel
                }, function(d) {
                    var rel = d.relationship;
                    $.publish('/relationship/add', rel);
                    wb.notify('1 relationship added!', 'success');
                    
                    activitylog({
                        operation: 'create relationship',
                        data: JSON.stringify({'window_type': 'network', 'id': d.id})
                    });
                });
                $(this).trigger('reset').parent().hide();
                e.preventDefault();
            });

            _this.restart();
        })

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
                    operation: 'defilter',
                    data: JSON.stringify({'window_type': 'network'})
                })
            }
            else {
                var nodes_id = [];
                d3.selectAll('.node.selected').each(function(d) {
                    nodes_id.push(d.id)
                })
                activitylog({
                    operation: 'filter',
                    data: JSON.stringify({'window_type': 'network', 'filter_by': nodes_id})
                })
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
            .on('mouseover', function(d) {
                window.networkmouseovertimeout = setTimeout(function() {
                    this.showTooltip(d)
                }.bind(this), 1000); // delay for 1s to show tooltip
            }.bind(this))
            .on('mouseout', function(d) {
                clearTimeout(window.networkmouseovertimeout);
                this.hideTooltip();
            }.bind(this))
        ;

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);

            activitylog({
                operation: 'relayout network',
                data: JSON.stringify({'window_type': 'network'})
            })
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

    showTooltip: function(d) {
        var tooltip = '<div id="network-tooltip" class="entity-tooltip"><table>'
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
            tooltip += '</table></div>';
            $(tooltip).appendTo(this.element).css({
                position: 'absolute',
                top: d.y + 'px',
                left: d.x + 15 + 'px'
            });
        }
    },

    hideTooltip: function() {
        $('#network-tooltip', this.element).remove();
    },

    findNode: function(id, node) {
        var node_id = node + '-' + id;
        return this.nodeMap[node_id];
    },

    addNode: function(id, node, relationship) {
        var existed_node = this.findNode(id, node);
        if (existed_node) {
            existed_node.relationships.push(relationship.primary.id);
            return existed_node;
        } else {
            var node_id = node + '-' + id;
            var entity = $.extend({}, wb.store[node][id]);
            entity.id = node_id;
            entity.relationships = [relationship.primary.id];
            this.nodeMap[node_id] = entity;
            this.nodes.push(entity);
            return entity;
        }
    },

    addLink: function(source, target, source_node, target_node, relationship) {
        var source_entity = this.addNode(source, source_node, relationship);
        var target_entity = this.addNode(target, target_node, relationship);
        this.links.push({
            source: source_entity,
            target: target_entity,
            confidence: 1,
            relation: relationship.primary.relation,
            description: '',
            date: source_entity.date,
            id: relationship.primary.id
        });
    },

    updateData: function() {
        var _this = this;

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
            .on("contextmenu", function(data, index) {
                var position = d3.mouse(this)
                d3.select("#network_contextmenu")
                    .style('position', 'absolute')
                    .style('left', position[0] + "px")
                    .style('top', position[1] + "px")
                    .style('display', 'block');
                d3.event.preventDefault();
            })
        ;
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
            // .on("mouseover", function(d) {
            //     // enlarge target node
            //     d3.select(this).attr('transform', 'scale(1.5)');
            // })
            .on('mouseover', this.highlight)
            // .on('mouseout', function(d) {
            //     // unenlarge target node
            //     d3.select(this).attr('transform', '');
            // })
            .on('mouseout', this.unhighlight)
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

        function onMouseOverNode(d) {
            highlight(d);
        }
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

    highlight: function(nodeData) {
        d3.selectAll('.node circle').style('stroke-opacity', function(o) {
            if (isConnected(nodeData, o)) {
                d3.select(this).style('fill-opacity', 1);
                $(this).siblings('text').css('fill-opacity', 1);
                return 1;
            } else {
                d3.select(this).style('fill-opacity', .2);
                $(this).siblings('text').css('fill-opacity', .2);
                return .2
            }
        });
        d3.selectAll('.link').style('stroke-opacity', function(o) {
            if (o.source.id === nodeData.id || o.target.id === nodeData.id) {
                return 1;
            } else {
                return .2;
            }
        });

        d3.select(this).attr('transform', 'scale(1.5)');

        function isConnected(a, b) {
            var connected = false;
            if (a.id === b.id) connected = true;

            d3.selectAll('.link').data().some(function(link) {
                if (link) {
                    if ((link.source.id === a.id && link.target.id === b.id)
                        || (link.target.id === a.id && link.source.id === b.id)) {
                            connected = true;
                            return connected;
                        };
                }
            });
            return connected;
        }
    },
    unhighlight: function() {
        d3.selectAll('.node circle').style('stroke-opacity', 1).style('fill-opacity', 1);
        d3.selectAll('.link').style('stroke-opacity', 1);
        d3.selectAll('.node-text').style('fill-opacity', 1);
        d3.select(this).attr('transform', '');
    },
    destroy: function() {
    }
});



wb.viz.network = function() {
    function exports(selection) {
        selection.each(function() {
        });
    }

    return exports;
};
