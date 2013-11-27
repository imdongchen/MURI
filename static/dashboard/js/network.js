$.widget("viz.viznetwork", $.viz.vizcontainer, {
    options: {
	dimension: null,
    },
    _create: function() {
	this.width  = 200;
	this.height = 200;

	var shiftKey = null;

	var keyflip = function() {
	  this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	var svg = d3.select(this.element)
	    .on("keydown.brush", keyflip)
	    .on("keyup.brush", keyflip)
	    .each(function() { this.focus(); })
	    .append("svg:svg")
    //        .attr("width", this.width)
    //        .attr("height", this.height)
	    .attr("pointer-events", "all")
	    .append('svg:g')
	    .call(d3.behavior.zoom().on("zoom", redraw))
	    .append('svg:g');

	var node = svg.selectAll(".node");
	var link = svg.selectAll(".link");

	this.force = d3.layout.force()
	    .nodes([])
	    .links([])
	    .charge(-400)
	    .linkDistance(120)
	    .size([this.width, this.height])
	    .on("tick", tick);
	
	var nodes = force.nodes();
	var links = force.links();

	function redraw() {
	    svg.attr("transform",
		"translate(" + d3.event.translate + ")"
		+ " scale(" + d3.event.scale + ")");
	}
	function tick() {
	    link.attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; })
	    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}

	var brush = svg.append("g")
	    .datum(function() { return {selected: false, previouslySelected: false}; })
	    .attr("class", "brush")
	    .call(d3.svg.brush()
		.x(d3.scale.identity().domain([0, this.width]))
		.y(d3.scale.identity().domain([0, this.height]))
		.on("brushstart", function(d) {
		    node.each(function(d) { d.previouslySelected = shiftKey && d.selected; });
		})
		.on("brush", function() {
		    var extent = d3.event.target.extent();
		    node.classed("selected", function(d) {
		      return d.selected = d.previouslySelected ^
			  (extent[0][0] <= d.x && d.x < extent[1][0]
			  && extent[0][1] <= d.y && d.y < extent[1][1]);
		    });
		})
		.on("brushend", function() {
		    d3.event.target.clear();
		    d3.select(this).call(d3.event.target);
		})
	    );
    },

    update: function() {
	    events_id = []
	    dimension.top(Infinity).forEach(function(p, i) {
		events_id.push(p.uid);
	    });

	    entities = ['person, organization'];
	    // New code, request data on the fly
    //        var request = d3.xhr('http://localhost:8000/network');
    //        request.post({events_id: events_id, entities: entities}, function(d) 
	    data = {};
	    data['events_id'] = events_id;
	    $.get("network", data, function(d) {
		link = link.data([]);
		link.exit().remove();
		node = node.data([]);
		node.exit().remove();
		this.force.nodes(d.nodes)
		    .links(d.links);
	    //
		//    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
		link = link.data(d.links);
		link.enter().append("line").attr("class", "link")
		  .style("stroke", "#FF0000");

		//   node = node.data(nodes, function(d) { return d.id;});
		node = node.data(d.nodes);
		node.enter().append("g")
		  .attr("class", "node")
		  .call(force.drag)
		  .on("mouseover", mouseover)
		  .on("mouseout", mouseout)
		  .on("mousedown", function(d) {
			d.fixed = true;
			d3.select(this).classed("sticky", true);
			if (shiftKey) d3.select(this).classed("selected", d.selected = !d.selected);
			else node.classed("selected", function(p) { return p.selected = d === p; });
		   });

		node.append("image")
		  .attr("xlink:href", function(d) {
		      if (d.node == 'organization') {
			  return "{{STATIC_URL}}dashboard/img/organization.png";
		      } 
		      else if (d.node === 'person') {
			  return "{{STATIC_URL}}dashboard/img/person.png";
		      }
		      else if (d.node === 'event') {
			  return "{{STATIC_URL}}dashboard/img/event.png";
		      }
		      else if (d.node === 'footprint') {
			  return "{{STATIC_URL}}dashboard/img/footprint.png";
		      }
		      else if (d.node === 'resource') {
			  return "{{STATIC_URL}}dashboard/img/resource.png";
		      }
		  })
		   .attr("x", -12)
		   .attr("y", -12)
		   .attr("width", 36)
		   .attr("height", 36);
	    //    node.append("rect")
	    //       .attr("x", -12)
	    //       .attr("y", -12)
	    //       .attr("width", 40)
	    //       .attr("height", 40)
		  // .style("fill", "transparent")
	    //       ;

		node.append("text")
		  .attr("dx", "-1.95em")
		  .attr("dy", "-.95em")
		  .text(function(d) { return d.name });
		node.append("svg:title").text(function(d) { 
		    var res = '';
		    res += "Name: " + d.name;
		    if (d.type == 'group') {
			res += "\nDescription: " + d.desc;
			res += "\nType: " + d.category;
		    }
		    else if (d.type == 'person') {
			res += "\nAlias: " + d.alias;
			res += "\nBirth: " + d.birth;
			res += "\nprofession: " + d.prof;
			res += "\nLiving? " + d.living;
		    }
		    return res;
		});

		// calculate the link length 
    //            var k = Math.sqrt(nodes.length / (this.width * this.height));
    //            force.charge(-10 / k)
    //                .gravity(100 * k)

		this.force.start();
	    });
	    // end new code request data on the fly

	function mouseover() {
	  d3.select(this).select("image").transition()
	      .duration(450)
	      .attr("width", 64)
	      .attr("height", 64);
	  highlightFromNetwork(this.__data__.id);
	}

	function mouseout() {
	  d3.select(this).select("image").transition()
	      .duration(450)
	       .attr("width", 36)
	       .attr("height", 36);
	  unhighlightFromNetwork(this.__data__.id);
	}
    },
    resize: function() {
    },
    highlight: function() {
    },
    destroy: function() {
    },
});
SIIL.Network = function(div) {
    this.width  = 200;
    this.height = 200;

    var force  = null;
    var shiftKey = null;

    var keyflip = function() {
      this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
    }

    var svg = d3.select(div)
        .on("keydown.brush", this.keyflip)
        .on("keyup.brush", keyflip)
        .each(function() { this.focus(); })
        .append("svg:svg")
//        .attr("width", this.width)
//        .attr("height", this.height)
        .attr("pointer-events", "all")
        .append('svg:g')
        .call(d3.behavior.zoom().on("zoom", redraw))
        .append('svg:g');

    var node = svg.selectAll(".node");
    var link = svg.selectAll(".link");

    force = d3.layout.force()
        .nodes([])
        .links([])
        .charge(-400)
        .linkDistance(120)
        .size([this.width, this.height])
        .on("tick", tick);
    
    var nodes = force.nodes();
    var links = force.links();

    function redraw() {
        svg.attr("transform",
            "translate(" + d3.event.translate + ")"
            + " scale(" + d3.event.scale + ")");
    }
function tick() {
        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    var brush = svg.append("g")
        .datum(function() { return {selected: false, previouslySelected: false}; })
        .attr("class", "brush")
        .call(d3.svg.brush()
            .x(d3.scale.identity().domain([0, this.width]))
            .y(d3.scale.identity().domain([0, this.height]))
            .on("brushstart", function(d) {
                node.each(function(d) { d.previouslySelected = shiftKey && d.selected; });
            })
            .on("brush", function() {
                var extent = d3.event.target.extent();
                node.classed("selected", function(d) {
                  return d.selected = d.previouslySelected ^
                      (extent[0][0] <= d.x && d.x < extent[1][0]
                      && extent[0][1] <= d.y && d.y < extent[1][1]);
                });
            })
            .on("brushend", function() {
                d3.event.target.clear();
                d3.select(this).call(d3.event.target);
            })
        );

    this.update = function() {

        events_id = []
        dDate.top(Infinity).forEach(function(p, i) {
            events_id.push(p.uid);
        });

        entities = ['person, organization'];
        // New code, request data on the fly
//        var request = d3.xhr('http://localhost:8000/network');
//        request.post({events_id: events_id, entities: entities}, function(d) {
        data = {};
        data['events_id'] = events_id;
        $.post("network", data, function(d) {
            link = link.data([]);
            link.exit().remove();
            node = node.data([]);
            node.exit().remove();
            force.nodes(d.nodes)
                .links(d.links);
        //
            //    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
            link = link.data(d.links);
            link.enter().append("line").attr("class", "link")
              .style("stroke", "#FF0000");

            //   node = node.data(nodes, function(d) { return d.id;});
            node = node.data(d.nodes);
            node.enter().append("g")
              .attr("class", "node")
              .call(force.drag)
              .on("mouseover", mouseover)
              .on("mouseout", mouseout)
              .on("mousedown", function(d) {
                    d.fixed = true;
                    d3.select(this).classed("sticky", true);
                    if (shiftKey) d3.select(this).classed("selected", d.selected = !d.selected);
                    else node.classed("selected", function(p) { return p.selected = d === p; });
               });

            node.append("image")
              .attr("xlink:href", function(d) {
                  if (d.node == 'organization') {
                      return "{{STATIC_URL}}dashboard/img/organization.png";
                  } 
                  else if (d.node == 'person') {
                      return "{{STATIC_URL}}dashboard/img/person.png";
                  }
                  else if (d.node == 'event') {
                      return "{{STATIC_URL}}dashboard/img/event.png";
                  }
                  else if (d.node == 'footprint') {
                      return "{{STATIC_URL}}dashboard/img/footprint.png";
                  }
                  else if (d.node == 'resource') {
                      return "{{STATIC_URL}}dashboard/img/resource.png";
                  }
              })
               .attr("x", -12)
               .attr("y", -12)
               .attr("width", 36)
               .attr("height", 36);
        //    node.append("rect")
        //       .attr("x", -12)
        //       .attr("y", -12)
        //       .attr("width", 40)
        //       .attr("height", 40)
              // .style("fill", "transparent")
        //       ;

            node.append("text")
              .attr("dx", "-1.95em")
              .attr("dy", "-.95em")
              .text(function(d) { return d.name });
            node.append("svg:title").text(function(d) { 
                var res = '';
                res += "Name: " + d.name;
                if (d.type == 'group') {
                    res += "\nDescription: " + d.desc;
                    res += "\nType: " + d.category;
                }
                else if (d.type == 'person') {
                    res += "\nAlias: " + d.alias;
                    res += "\nBirth: " + d.birth;
                    res += "\nprofession: " + d.prof;
                    res += "\nLiving? " + d.living;
                }
                return res;
            });

            // calculate the link length 
//            var k = Math.sqrt(nodes.length / (this.width * this.height));
//            force.charge(-10 / k)
//                .gravity(100 * k)

            force.start();
        });
        // end new code request data on the fly


    }

    function mouseover() {
      d3.select(this).select("image").transition()
          .duration(450)
          .attr("width", 64)
          .attr("height", 64);
      highlightFromNetwork(this.__data__.id);
    }

    function mouseout() {
      d3.select(this).select("image").transition()
          .duration(450)
           .attr("width", 36)
           .attr("height", 36);
      unhighlightFromNetwork(this.__data__.id);
    }

    function prepareNetworkData() {
        // prepare social network data
        // {
        //     "nodes": [{...}, {...}]
        //     "links": [
        //               {"source": ..., "target": ...},
        //               {"source": ..., "target": ...}
        //              ]
        //  }
        var nodesDict = {}, linksDict = {};
        dDate.top(Infinity).forEach(function(p, i) {
            p.persons.forEach(function(person) {
                person.groups.forEach(function(group) {
                    var link_info = {};
                    link_info.source = nodesDict[person.id] || 
                        (nodesDict[person.id] = {
                            id:     person.id
                          , name:   person.name
                          , living: person.living
                          , alias:  person.alias
                          , birth:  person.birth
                          , prof:   person.prof
                          , type:   'person'
                          , photo:  person.photo
                        });
                    link_info.target = nodesDict[group.id] || 
                        (nodesDict[group.id] = {
                            id:   group.id
                          , name: group.name
                          , desc: group.desc
                          , category: group.category
                          , type: 'group'
                        });
                    link_info.id = link_info.source.id + '-' + link_info.target.id;
                    if (linksDict[link_info.id] == undefined) {
                        linksDict[link_info.id] = link_info;
                    }
                });
            });
        });
        
        nodes = d3.values(nodesDict);   // global variable
        links = d3.values(linksDict);   // global variable
    }

};

