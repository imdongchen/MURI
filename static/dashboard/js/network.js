$.widget("viz.viznetwork", $.viz.vizcontainer, {
    options: {
        dimension: null
    },
    _create: function() {
        this.width  = this.element.width();
        this.height = this.element.height();
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
            .attr("pointer-events", "all")
        ;
        // define node images
        var images = ['person', 'organization', 'location', 'event', 'message', 'resource']
        for (var i = 0; i < images.length; i++) {
            this.svg.append('svg:defs')
                .append('svg:pattern').attr('id', 'img-'+images[i]).attr('patternUnits', 'userSpaceOnUse').attr('x', '12').attr('y', '12').attr('height','24').attr('width','24')
                .append('image').attr('x', '0').attr('y', '0').attr('width', 24).attr('height', 24).attr('xlink:href', STATIC_URL + 'dashboard/img/' + images[i] + '.png');
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
            .attr('fill', '#ccc');

        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#ccc');

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


        // line displayed when dragging new nodes
        this.drag_line = this.svg.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0');
        // mouse event vars
        this.selected_node = null,
        this.selected_link = null;
        this.mousedown_link = null;
        this.mousedown_node = null;
        this.mouseup_node = null;

        this._super("_create");
        this.element.addClass("viznetwork");
        this.element.addClass("viz");
        this.element.data("viz", "vizViznetwork")
        this.update();
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
            $('#relation_form form').submit(function() {
                var rel = $('#relation').val();
                link.rel = rel;
                $.post('network/relation', {
                    source: link.source.id,
                    target: link.target.id,
                    rel: link.rel
                }, function(d) {
                    console.log(d);
                    activitylog({
                        operation: 'create relationship',
                        data: JSON.stringify({'window_type': 'network', 'id': d.id})
                    })
                })
                $(this).trigger('reset').parent().hide();
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
            var nodes_id = [];
            d3.selectAll(".node").classed("selected", function(d) {
                d.selected = e[0][0] <= brushX.invert(d.x) && brushX.invert(d.x) <= e[1][0]
                    && e[0][1] <= brushY.invert(d.y) && brushY.invert(d.y) <= e[1][1];
                if (d.selected) nodes_id.push(d.id);
                return d.selected;
            });
            if (nodes_id.length > 0) {
                _this.options.dimension.filter(function(d) {
                    for (var i = 0, len = nodes_id.length; i < len; i++) {
                        var ent = '' + nodes_id[i];
                        if (ent.charAt(0) === 'm') {
                            if (ent == 'm' + d[0]) {
                                return true;
                            }
                        } else {
                            ent = parseInt(ent);
                            if (d.indexOf(ent) > 0) {
                                return true;
                            }
                        }
                    }
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
                    return d.selected=false;
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

//        this.svg.call(this.zoom
//            .on("zoom", zoomed)
//        );
        this.zoom.on('zoom', zoomed);
        this.node.call(this.drag
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragend)
        );


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

    update: function() {
        /* get the id of filtered messages */
        var messages_id = [];
        this.options.dimension.group().top(Infinity).forEach(function(p, i) {
            if (p.key[0] !== undefined && p.value !== 0) {
                messages_id.push(p.key[0])
            }
        })

        // request data from server
	    data = {};
        data['entities'] = ['person, organization'];
	    data['messages_id'] = messages_id;
        var _this = this;

	    $.get("network", data, function(d) {
            _this.nodes.length = 0;
            Array.prototype.push.apply(_this.nodes, d.nodes);
            _this.links.length = 0;
            Array.prototype.push.apply(_this.links, d.links);

            _this.restart();
            _this.setMode("normal");
	    });
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
        var g = this.node.enter().append("svg:g");
//        g.call(_this.force.drag);

        g.append("svg:circle")
            .attr('r', 12)
            .attr('class', 'node')
            .attr('fill', function(d) {
                if (d.id.toString().charAt(0) === 'm') {
                    return "url(#img-message)";
                }
                else {
                    return "url(#img-" + d.entity + ")";
                }
            })
            .on("mouseover", function(d) {
                // enlarge target node
                d3.select(this).attr('transform', 'scale(1.5)');
            })
            .on('mouseout', function(d) {
                // unenlarge target node
                d3.select(this).attr('transform', '');
            })
        ;

        g.append("text")
            .attr("x", 0)
            .attr("y", 4)
            .style("text-anchor", "middle")
            .attr("dy", "-.95em")
            .text(function(d) { return d.name })
            .style("-webkit-user-select", "none"); // disable text selection when dragging mouse

        g.append("svg:title").text(function(d) {
            var res = '';
            for (var key in d) {
                res += key;
                if (d[key] === null || d[key] === "") res += ":\tUnknown\n";
                else res += ":\t" + d[key] + "\n";
            }
            return res;
        });
        this.node.exit().remove();


        // calculate the link length
        //            var k = Math.sqrt(nodes.length / (this.width * this.height));
        //            force.charge(-10 / k)
        //                .gravity(100 * k)

        this.force.start();
    },

    resize: function() {
        this.width = this.element.width();
        this.height = this.element.height();
        this.svg.attr("width", this.width).attr("height", this.height);
        this.force.size([this.width, this.height]).resume();
    },
    highlight: function() {
    },
    destroy: function() {
    }
});
