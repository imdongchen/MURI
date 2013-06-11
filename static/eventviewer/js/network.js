$(document).ready(function () {
    showNetwork();
});

function showNetwork () {
    var width = 900,
        height = 900
    ;

    var svg = d3.select("#network").append("svg")
        .attr("width", width)
        .attr("height", height)
    ;

    var force = d3.layout.force()
        .gravity(.05)
        .distance(250)
        .charge(-320)
        .size([width, height]);

    d3.json("network?node=person&node=group", function(error, json) {
      force
          .nodes(json.nodes)
          .links(json.links)
          .start();

      var link = svg.selectAll(".link")
          .data(json.links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke", "#00FFDD");
        

      var node = svg.selectAll(".node")
          .data(json.nodes)
        .enter().append("g")
          .attr("class", "node")
          .call(force.drag);

      node.append("image")
          .attr("xlink:href", function(d) {
              if (d.type == 'group') {
                  return "{{STATIC_URL}}eventviewer/img/group.png";
              } 
              else if (d.type = 'person') {
                  return "{{STATIC_URL}}eventviewer/img/head.jpg";
              }
          })
          .attr("x", -8)
          .attr("y", -8)
          .attr("width", 36)
          .attr("height", 36);

      node.append("text")
          .attr("dx", "-1.95em")
          .attr("dy", "-.95em")
          .text(function(d) { return d.name });

      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
    });
    
}
