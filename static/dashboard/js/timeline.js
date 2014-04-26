$.widget("viz.viztimeline", $.viz.vizcontainer, {
    options: {
        dimension: null
    },
    _create: function() {
        var width = this.element.width();
        var height = this.element.height();
        var margin = {top: 10, right: 15, bottom: 30, left: 20};

        var charts = [
            barChart()
                .dimension(this.options.dimension)
                .group(this.options.dimension.group())
                .round(d3.time.day.round)
                .margin(margin)
                .x(d3.time.scale()
                    .domain([this.options.dimension.bottom(1)[0].date, this.options.dimension.top(1)[0].date])
//                    .domain([d3.min(dates), d3.max(dates)])
                    .rangeRound([margin.left, width - margin.left - margin.right])
                )
                .y(d3.scale.linear()
                    .rangeRound([height - margin.top - margin.bottom, 0])
                )
//                .filter([new Date(2010, 1, 1), new Date(2010, 2, 1)])
        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        d3.selectAll(this.element)
            .data(charts)
            .each(function(chart) {
                chart.on("brush", function() {
                    $.publish('/data/filter', ['viznetwork']);
                }).on("brushend", function(){
                    $.publish('/data/filter');
                });
            })
            .each(this.render);


        //    renderAll();

        //     d3.selectAll("#total")
        //      .text(datafilter.size());

        window.filter = function(filters) {
            filters.forEach(function(d, i) { charts[i].filter(d); });
            renderAll();
        };

//        window.reset = function(i) {
//            charts[i].filter(null);
//            renderAll();
//        };

        function barChart() {
            if (!barChart.id) barChart.id = 0;

            var margin = {top: 10, right: 10, bottom: 10, left: 30},
                x,
                y,
                id = barChart.id++,
                xAxis = d3.svg.axis().orient("bottom"),
                yAxis = d3.svg.axis().orient("left"),
                brush = d3.svg.brush(),
                brushDirty,
                dimension,
                group,
                round;

            function chart(div) {
                var width = x.range()[1],
                    height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);
                yAxis.scale(y)
                    .tickFormat(d3.format("d"))
                    .ticks(5)


                div.each(function() {
                    var div = d3.select(this),
                        g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                            .attr("href", "javascript:reset(" + id + ")")
                            .attr("class", "reset")
                            .text("reset")
                            .style("display", "none");

                        g = div.append("svg")
                            .attr("width", width + margin.left + margin.right - 10)
                            .attr("height", height + margin.top + margin.bottom - 10)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        g.append("clipPath")
                            .attr("id", "clip-" + id)
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        g.selectAll(".bar")
                            .data(["background", "foreground"])
                            .enter().append("path")
                            .attr("class", function(d) { return d + " bar"; })
                            .datum(group.all());

                        g.selectAll(".foreground.bar")
                            .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0" + "," + height + ")")
                            .call(xAxis);

                        g.append("g")
                            .attr("class", "y axis")
                            .attr("transform", "translate(" + margin.left + ",0)" )
                            .call(yAxis);
                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", 0)
                                .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", x(extent[0]))
                                .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").transition().attr("d", barPath);
                    g.selectAll(".y.axis").transition().call(yAxis);
                });

                function barPath(groups) {
                    var path = [],
                        i = -1,
                        n = groups.length,
                        d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                        x = e ? 1 : -1,
                        y = height / 3;
                    return "M" + (.5 * x) + "," + y
                        + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                        + "V" + (2 * y - 6)
                        + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                        + "Z"
                        + "M" + (2.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8)
                        + "M" + (4.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function() {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function() {
                var g = d3.select(this.parentNode),
                    extent = brush.extent();
                if (round) g.select(".brush")
                    .call(brush.extent(extent = extent.map(round)))
                    .selectAll(".resize")
                    .style("display", null);
                g.select("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                dimension.filterRange(extent);
            });

            brush.on("brushend.chart", function() {
                if (brush.empty()) {
                    var div = d3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                    dimension.filterAll();

                    activitylog({
                        operation: 'defilter',
                        data: JSON.stringify({'window_type': 'timeline'})
                    })
                } else {
                    var extent = brush.extent();
                    activitylog({
                        operation: 'filter',
                        data: JSON.stringify({'window_type': 'timeline', 'filter_by': extent})
                    })
                }
            });

            chart.margin = function(_) {
                if (!arguments.length) return margin;
                margin = _;
                return chart;
            };

            chart.x = function(_) {
                if (!arguments.length) return x;
                x = _;
                xAxis.scale(x);
                brush.x(x);
                return chart;
            };

            chart.y = function(_) {
                if (!arguments.length) return y;
                y = _;
                return chart;
            };

            chart.dimension = function(_) {
                if (!arguments.length) return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function(_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function(_) {
                if (!arguments.length) return group;
                group = _;
                return chart;
            };

            chart.round = function(_) {
                if (!arguments.length) return round;
                round = _;
                return chart;
            };

            return d3.rebind(chart, brush, "on");
        }

        // update map when dialog resized or dragged
        this.element.on("dialogresizestop", function() {
            this.update();
            var ele = this.element;
            ele.css('width', 'auto');
            ele.parent().css("height", 'auto');
        }.bind(this));

        this._super("_create");
        this.element.addClass("viztimeline");
        this.element.addClass("viz");
        this.element.data("viz", "vizViztimeline")
    },
    update: function() {
        d3.selectAll(this.element).each(this.render);
    },
    // Renders the specified chart or list.
    render: function(method) {
        // I don't understand, what method is being called?
        d3.select(this).call(method)
    },
    destroy: function() {
    }
});
