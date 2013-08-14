var width = 960,
    height = 500,
    shiftKey;

var nodes = [],
    links = [];

var node = null, link = null;

var force = null;

function keyflip() {
  shiftKey = d3.event.shiftKey || d3.event.metaKey;
}

function initSN() {
    var svg = d3.select("#network")
        .on("keydown.brush", keyflip)
        .on("keyup.brush", keyflip)
        .each(function() { this.focus(); })
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    node = svg.selectAll(".node");
    link = svg.selectAll(".link");

    force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .charge(-400)
        .linkDistance(120)
        .size([width, height])
        .on("tick", tick);

      var brush = svg.append("g")
      .datum(function() { return {selected: false, previouslySelected: false}; })
      .attr("class", "brush")
      .call(d3.svg.brush()
        .x(d3.scale.identity().domain([0, width]))
        .y(d3.scale.identity().domain([0, height]))
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
        }));


    function tick() {
        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }
}

function updateSN() {
    link = link.data([]);
    link.exit().remove();
    node = node.data([]);
    node.exit().remove();
    prepareNetworkData();

    force.nodes(nodes).links(links);


//    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
    link = link.data(links);
    link.enter().append("line").attr("class", "link")
      .style("stroke", "#FF0000");

//   node = node.data(nodes, function(d) { return d.id;});
    node = node.data(nodes);
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
          if (d.type == 'group') {
              return "{{STATIC_URL}}eventviewer/img/group.png";
          } 
          else if (d.type == 'person') {
              return "{{STATIC_URL}}eventviewer/img/head.jpg";
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


    force.start();


}

function mouseover() {
  d3.select(this).select("image").transition()
      .duration(450)
      .attr("width", 64)
      .attr("height", 64);
}

function mouseout() {
  d3.select(this).select("image").transition()
      .duration(450)
       .attr("width", 36)
       .attr("height", 36);
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
