
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
    var count = 0;
    dDate.top(Infinity).forEach(function(p, i) {
        p.persons.forEach(function(person) {
            person.groups.forEach(function(group) {
                var link = {};
                link.source = nodes[person.id] || 
                    (nodes[person.id] = {
                        id:     person.id
                      , name:   person.name
                      , living: person.living
                      , alias:  person.alias
                      , birth:  person.birth
                      , prof:   person.prof
                      , type:   'person'
                      , photo:  person.photo
                    });
                link.target = nodes[group.id] || 
                    (nodes[group.id] = {
                        id:   group.id
                      , name: group.name
                      , desc: group.desc
                      , category: group.category
                      , type: 'group'
                    });
                link.id = link.source.id + '-' + link.target.id;
                if (links[link.id] == undefined) {
                    links[link.id] = link;
                }
// debug{
//                count++;
//                console.log('This is the ' + i + 'th event record');
//                console.log('The number of links to be added: ' + count);
//                console.log('link info\n\t id: ' + link.id + '\n\tlink source id: ' + link.source.id 
//                        + '\n\tlink source debug: ' + link.source.debug);
//                console.log('\n\tlink target id: ' + link.target.id 
//                        + '\n\tlink target debug: ' + link.target.debug);
//                console.log('Source node id: ' + nodes[person.id].id + '\n\tSource node debug: ' + nodes[person.id].debug);
//                console.log('Target node id: ' + nodes[group.id].id + '\n\tTarget node debug: ' + nodes[group.id].debug);
//                link.source.debug = 'event ' + i + ' link ' + count;
//                link.target.debug = 'world';
//                console.log('After chaning link source and target: ');
//                console.log('link info\n\t id: ' + link.id + '\n\tlink source id: ' + link.source.id 
//                        + '\n\tlink source debug: ' + link.source.debug);
//                console.log('\n\tlink target id: ' + link.target.id 
//                        + '\n\tlink target debug: ' + link.target.debug);
//                console.log('Source node id: ' + nodes[person.id].id + '\n\tSource node debug: ' + nodes[person.id].debug);
//                console.log('Target node id: ' + nodes[group.id].id + '\n\tTarget node debug: ' + nodes[group.id].debug);
//
//}
            });
        });
    });
    
    nodes = d3.values(nodes);
    links = d3.values(links);

    return {"nodes": nodes, "links": links};
}
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

function initSN() {
var width = 960,
    height = 500;

var color = d3.scale.category10();

var nodes = [],
    links = [];

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .charge(-400)
    .linkDistance(120)
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("#network").append("svg")
    .attr("width", width)
    .attr("height", height);

var node = svg.selectAll(".node"),
    link = svg.selectAll(".link");

setTimeout(function() {
// var a = {"id":"p6","name":"Abdul Jabar Wahied","living":"Y","alias":null,"birth":null,"prof":null,"type":"person"} ,
//    b = {"id":"g2","name":"Rashid Criminal Group","desc":"Sunni","category":"Criminal Group","type":"group"} ,
//    c = {"id":"g3","name":"Iranian Special Group","desc":"Shi'a","category":"Military force","type":"group"},
//    d = {"id":"p1","name":"Dhanun Ahmad Mahmud","living":"N","alias":null,"birth":null,"prof":null,"type":"person"} ,
//    e = {"id":"p2","name":"Mu'adh Nuri Khalid Jihad","living":"Y","alias":null,"birth":null,"prof":null,"type":"person"} ,
//    la = {"source": {"id":"p6","name":"Abdul Jabar Wahied","living":"Y","alias":null,"birth":null,"prof":null,"type":"person"},"target":{"id":"g2","name":"Rashid Criminal Group","desc":"Sunni","category":"Criminal Group","type":"group"},"id":"p6-g2"} ,
//    lb = {"source":{"id":"p6","name":"Abdul Jabar Wahied","living":"Y","alias":null,"birth":null,"prof":null,"type":"person"},"target":{"id":"g3","name":"Iranian Special Group","desc":"Shi'a","category":"Military force","type":"group"},"id":"p6-g3"} ,
//    lc = {"source":{"id":"p1","name":"Dhanun Ahmad Mahmud","living":"N","alias":null,"birth":null,"prof":null,"type":"person"},"target":{"id":"g2","name":"Rashid Criminal Group","desc":"Sunni","category":"Criminal Group","type":"group"},"id":"p1-g2"} ,
//    ld = {"source":{"id":"p2","name":"Mu'adh Nuri Khalid Jihad","living":"Y","alias":null,"birth":null,"prof":null,"type":"person"},"target":{"id":"g2","name":"Rashid Criminal Group","desc":"Sunni","category":"Criminal Group","type":"group"},"id":"p2-g2"} 
//    la = {"source":a,"target":b,"id":"p6-g2"} ,
//    lb = {"source":a,"target":c,"id":"p6-g3"} ,
//    lc = {"source":d,"target":b,"id":"p1-g2"} ,
//    ld = {"source":e,"target":b,"id":"p2-g2"} 
//;
  var d = prepareNetworkData();
  d.nodes.forEach(function (node) {
      nodes.push (node);
  });
  d.links.forEach(function(link) {
      links.push(link);
  });

//  nodes.push(a, b, c, d, e);
//  links.push(la, lb, lc, ld);
  start();
}, 0);

function start() {
  link = link.data(force.links());
//  link.enter().insert("line", ".node").attr("class", "link");
  link.enter().append("line");

  node = node.data(force.nodes());
  node.enter()
      .append("image")
      .attr("xlink:href", function(d) {
          if (d.type == 'group') {
              return "/static/eventviewer/img/group.png";
          } 
          else if (d.type == 'person') {
              return "/static/eventviewer/img/head.jpg";
          }
      })
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 36)
      .attr("height", 36)
      .call(force.drag);
    node.enter().append("text")
      .attr("dx", "-1.95em")
      .attr("dy", "-.95em")
      .text(function(d) { return d.name });


  force.start();
}

function tick() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style("stroke", "#FF0000");
}
}
