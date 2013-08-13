function prepareNetworkData() {
    // prepare social network data
    // {
    //     "nodes": [{...}, {...}]
    //     "links": [
    //               {"source": ..., "target": ...},
    //               {"source": ..., "target": ...}
    //              ]
    //  }
    var nodes = {}, links = {};
    dDate.top(Infinity).forEach(function(p, i) {
        p.persons.forEach(function(person) {
            var link = {};
            link.source = person.id;
            link.source = nodes[link.source] || 
                (nodes[link.source] = {
                    id:     person.id
                  , name:   person.name
                  , living: person.living
                  , alias:  person.alias
                  , birth:  person.birth
                  , prof:   person.birth
                  , type:   'person'
                  , photo:  person.photo
                });
            person.groups.forEach(function(group) {
                link.target = group.id;
                link.target = nodes[link.target] || 
                    (nodes[link.target] = {
                        id:   group.id
                      , name: group.name
                      , desc: group.desc
                      , category: group.category
                      , type: 'group'
                    });
                link.id = link.source.id + '-' + link.target.id;
                links[link.id] = links[link.id] || JSON.parse(JSON.stringify(link)); // deep copy of link
            });
        });
    });
    nodes = d3.values(nodes);
    links = d3.values(links);

    return {"nodes": nodes, "links": links};
}

var force = null;
var nodes = [];
var links = [];
var network = null;
var node = null;
var link = null;

function initSN() {
    if (dDate == null) {
        return null;
    }
    var width = 900
      , height = 900
    ;

    network = d3.select("#network").append("svg")
        .attr("width", width)
        .attr("height", height)
    ;
    node = network.selectAll('.node');
    link = network.selectAll('.link');

    force = d3.layout.force()
        .gravity(.05)
        .distance(250)
        .charge(-320)
        .nodes(nodes)
        .links(links)
        .size([width, height])
        .on("tick", tick);

    updateSN();

    return network;
}

function updateSN() {
    var data = prepareNetworkData();
    nodes = data.nodes;
    links = data.links;

    link = link.data(links, function(d) {
        return d.id;
    });
    link.enter().insert("line", ".node")
      .attr("class", "link")
      .style("stroke", "#00FFDD");
    link.exit().remove();

    node = node.data(nodes, function(d) {
        return d.id;
    });
    node.enter()
      .append("image")
      .attr("xlink:href", function(d) {
          if (d.type == 'group') {
              return "/static/eventviewer/img/group.png";
          } 
          else if (d.type = 'person') {
              return "/static/eventviewer/img/head.jpg";
          }
      })
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 36)
      .attr("height", 36)
      .attr("class", "node")
      .call(force.drag);

    node.enter().append("text")
      .attr("dx", "-1.95em")
      .attr("dy", "-.95em")
      .text(function(d) { return d.name });

    node.exit().remove();

    force.start();
}

function tick() {
    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
}
