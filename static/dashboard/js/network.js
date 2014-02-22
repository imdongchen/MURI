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

        var shiftKey = null;

        var keyflip = function() {
            this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
        }
        shiftKey = this.shiftKey;

        this.svg = d3.select(this.element[0])
            .on("keydown.brush", function() {
                if(d3.event.shiftKey) {
                    _this.svg.append("svg:g")
                        .datum(function() { return {selected: false, previouslySelected: false}; })
                        .attr("class", "brush")
                        .call(d3.svg.brush()
                            .x(d3.scale.identity().domain([0, _this.width]))
                            .y(d3.scale.identity().domain([0, _this.height]))
                            .on("brushstart", function(d) {
                                _this.node.each(function(d) { d.previouslySelected = shiftKey && d.selected; });
                            })
                            .on("brush", function() {
                                var extent = d3.event.target.extent();
                                _this.node.classed("selected", function(d) {
                                    return d.selected = d.previouslySelected ^
                                        (extent[0][0] <= d.x && d.x < extent[1][0]
                                            && extent[0][1] <= d.y && d.y < extent[1][1]);
                                });
                            })
                            .on("brushend", function() {
                                d3.event.target.clear();
                                d3.select(this).call(d3.event.target);
                            })
                        )
                    ;
                }
            })
            .on("keyup", function() {
                if(d3.event.shiftKey) {
                    _this.svg
                        .on('keydown.brush', null)
                }
            })
//            .on("keydown.brush", keyflip)
//            .on("keyup.brush", keyflip)
            .each(function() { this.focus(); })
            .append("svg:svg")
        //        .attr("width", this.width)
        //        .attr("height", this.height)
            .attr("pointer-events", "all")
            .on("mousemove", function() {
                if(!_this.mousedown_node) return;

                // update drag line
                _this.drag_line.attr('d', 'M' + _this.mousedown_node.x + ',' + _this.mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

                _this.restart();
            })
            .on("mouseup", function() {
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

        ;
        // define node images
        var images = ['person', 'organization', 'location', 'event', 'message', 'resource']
        for (var i = 0; i < images.length; i++) {
            this.svg.append('svg:defs')
                .append('svg:pattern').attr('id', 'img-'+images[i]).attr('patternUnits', 'userSpaceOnUse').attr('x', '12').attr('y', '12').attr('height','24').attr('width','24')
                .append('image').attr('x', '0').attr('y', '0').attr('width', 24).attr('height', 24).attr('xlink:href', '{{STATIC_URL}}dashboard/img/' + images[i] + '.png');
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
            .attr('fill', '#000');

        this.svg.append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#000');

        // add zoom behavior
        this.svg.call(d3.behavior.zoom().on("zoom", redraw));

        this.force = d3.layout.force()
            .nodes(this.nodes)
            .links(this.links)
            .charge(-400)
            .linkDistance(120)
            .size([this.width, this.height])
            .on("tick", tick);

        this.link = this.svg.append('svg:g').selectAll("path");
        this.node = this.svg.append('svg:g').selectAll("g");

        function redraw() {
            _this.svg.attr("transform",
                "translate(" + d3.event.translate + ")"
                    + " scale(" + d3.event.scale + ")");
        }

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
                        sourceY = d.source.y - k + (sourcePadding * normY),
                        targetX = d.target.x - (targetPadding * normX),
                        targetY = d.target.y + k - (targetPadding * normY);
//                    return "M" + sourceX + "," + sourceY + "A" + dist + "," + dist + " 0 0,1 " + targetX + "," + targetY;
                    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
                })
            ;
//                .attr("x1", function(d) {
//                    return d.source.x;
//                })
//                .attr("y1", function(d) { return d.source.y -= k; })
//                .attr("x2", function(d) { return d.target.x; })
//                .attr("y2", function(d) { return d.target.y += k; })
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

    update: function() {
        /* get the id of all entities in filtered messages
	    var entities_id = [];
	    dMessage.top(Infinity).forEach(function(p, i) {
            for (var key in p) {
                var obj = p[key];
                if (obj.hasOwnProperty("uid")) {
                    entities_id.push(obj.uid)
                }
            }

	    });
        end */
        /* get the id of filtered messages */
        var messages_id = [];
        dMessage.group().top(Infinity).forEach(function(p, i) {
            if (p.key[0] !== undefined && p.value !== 0) {
                messages_id.push(p.key[0])
            }
        })

	    // New code, request data on the fly
    //        var request = d3.xhr('http://localhost:8000/network');
    //        request.post({events_id: events_id, entities: entities}, function(d) 
	    data = {};
        data['entities'] = ['person, organization'];
	    data['messages_id'] = messages_id;
        var _this = this;
	    $.get("network", data, function(d) {
            _this.nodes.length = 0;
            Array.prototype.push.apply(_this.nodes, d.nodes);
            _this.links.length = 0;
            Array.prototype.push.apply(_this.links, d.links);
//            for (var i = 0, len = _this.nodes.length; i < len; i++) {
//                if (_this._findNode(_this.nodes[i], nodes) == -1) {
//                    _this.nodes.splice(i, 1);
//                }
//            }
//            for (var i = 0, len = _this.links.length; i < len; i++) {
//                if (_this._findLink(_this.links[i], links) == -1) {
//                    _this.links.splice(i, 1);
//                }
//            }
//            for (var i = 0, len = nodes.length; i < len; i++) {
//                if (_this._findNode(nodes[i], _this.nodes) == -1) {
//                    _this.nodes.push(nodes[i]);
//                }
//            }
//            for (var i = 0, len = links.length; i < len; i++) {
//                if (_this._findLink(links[i], _this.links) == -1) {
//                    _this.links.push(links[i]);
//                }
//            }
            _this.restart();
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
//                if(!_this.mousedown_node || d === _this.mousedown_node) return;
                // enlarge target node
                d3.select(this).attr('transform', 'scale(1.2)');
            })
            .on('mouseout', function(d) {
//               if(!_this.mousedown_node || d === _this.mousedown_node) return;
                // unenlarge target node
                d3.select(this).attr('transform', '');
            })
            .on('mousedown', function(d) {
                if(d3.event.ctrlKey) return;

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
            .on('mouseup', function(d) {
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
                var source, target, direction;
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
                _this.restart();
            });

        ;

        g.append("text")
            .attr("x", 0)
            .attr("y", 4)
            .style("text-anchor", "middle")
            .attr("dy", "-.95em")
            .text(function(d) { return d.name });
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
