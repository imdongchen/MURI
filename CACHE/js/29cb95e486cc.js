
// comment {
//var force = null;
//var nodes = [];
//var links = [];
//var network = null;
//var node = null;
//var link = null;
//
//function initSN() {
//    if (dDate == null) {
//        return null;
//    }
//    var width = 900
//      , height = 900
//    ;
//
//    network = d3.select("#network").append("svg")
//        .attr("width", width)
//        .attr("height", height)
//    ;
//    node = network.selectAll('.node');
//    link = network.selectAll('.link');
//
//    force = d3.layout.force()
//        .gravity(.05)
//        .distance(250)
//        .charge(-320)
//        .nodes(nodes)
//        .links(links)
//        .size([width, height])
//        .on("tick", tick);
//
//    updateSN();
//
//    return network;
//}
//
//function updateSN() {
//    var data = prepareNetworkData();
//    nodes = data.nodes;
//    links = data.links;
//
////    link = link.data(links, function(d) {
////        return d.id;
////    });
//    link = link.data(links);
//    link.enter().append("line")
//      .attr("class", "link")
//      .style("stroke", "#00FFDD");
////    link.exit().remove();
//
////    node = node.data(nodes, function(d) {
////        return d.id;
////    });
//    node = node.data(nodes);
//    node.enter()
//      .append("image")
//      .attr("xlink:href", function(d) {
//          if (d.type == 'group') {
//              return "/static/eventviewer/img/group.png";
//          } 
//          else if (d.type == 'person') {
//              return "/static/eventviewer/img/head.jpg";
//          }
//      })
//      .attr("x", -8)
//      .attr("y", -8)
//      .attr("width", 36)
//      .attr("height", 36)
//      .attr("class", "node")
//      .call(force.drag);
//
//    node.enter().append("text")
//      .attr("dx", "-1.95em")
//      .attr("dy", "-.95em")
//      .text(function(d) { return d.name });
//
////    node.exit().remove();
//
//    force.start();
//}
//
//function tick() {
//    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
//    link.attr("x1", function(d) { return d.source.x; })
//        .attr("y1", function(d) { return d.source.y; })
//        .attr("x2", function(d) { return d.target.x; })
//        .attr("y2", function(d) { return d.target.y; });
//}
//} comment

var width = 960,
    height = 500;

var nodes = [],
    links = [];

var node = null, link = null;

function initSN() {
    var svg = d3.select("#network").append("svg")
        .attr("width", width)
        .attr("height", height);

    node = svg.selectAll(".node");
    link = svg.selectAll(".link");
}

function updateSN() {
    prepareNetworkData();

    var force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .charge(-400)
        .linkDistance(120)
        .size([width, height])
        .on("tick", tick);

//    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
    link = link.data(links);
    link.enter().append("line").attr("class", "link")
      .style("stroke", "#FF0000");
    link.exit().remove();

 //   node = node.data(nodes, function(d) { return d.id;});
//    node = node.data(nodes);
//    node.enter().append("g")
////      .append("circle").attr("r", 8)
//      .attr("class", "node")
//      .call(force.drag);
//    node.append("image")
//      .attr("xlink:href", function(d) {
//          if (d.type == 'group') {
//              return "/static/eventviewer/img/group.png";
//          } 
//          else if (d.type == 'person') {
//              return "/static/eventviewer/img/head.jpg";
//          }
//      })
//       .attr("x", -8)
//       .attr("y", -8)
//       .attr("width", 36)
//       .attr("height", 36)
    node = node
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("image")
      .attr("xlink:href", "https://github.com/favicon.ico")
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16);

  node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name }); 
//    node.exit().remove();

    force.start();

    function tick() {

        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

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
