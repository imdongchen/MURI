$.widget("viz.viztimeline", $.viz.vizbase, {
    _create: function() {
        // window maximize and restore event, exposed by jquery dialogextend
        this.options.extend.maximize = this.update.bind(this);
        this.options.extend.restore = this.update.bind(this);
        this.options.base.resizeStop = this.resize.bind(this);
        this._super("_create");

        this.timeline = wb.viz.timeline()
            .on('brush', function() {
                $.publish('/data/filter', ['viznetwork']);
            })
            .on('brushend', function() {
                $.publish('/data/filter');
            })
        ;
        this.update();

        this.element.addClass("viztimeline");
        this.element.data("viz", "vizViztimeline")

    },
    updateData: function() {

    },
    update: function() {
        var width = this.element.width();
        var height = this.element.height();
        var margin = {top: 10, right: 25, bottom: 20, left: 30};

        this.timeline
            .height(height - margin.top - margin.bottom - 15)
            .width(width - margin.left - margin.right - 15)
            .margin(margin)
            .dimension(this.options.dimension)
            .group(this.options.group)
            .round(d3.time.day)
        ;
        d3.select(this.element[0]).call(this.timeline);
    },
    reload: function() {
        this.updateData();
        this.update();
    },
    resize: function() {
        this._super('resize');
        this.update();
    },
    destroy: function() {
    }
});


wb.viz.timeline = function() {
    var margin = {top: 20, right: 30, bottom: 30, left: 50},
        width = 500,
        height = 300
    ;
    var brush = d3.svg.brush();
    var brushDirty;
    var round;
    var dimension, group;
    var scaleX, scaleY;
    var axisX, axisY;

    function exports(selection) {
        selection.each(function(d, i) {
            // generate chart here; 'd' is the data and 'this' is the element
            scaleX = d3.time.scale()
                .domain(d3.extent(_.pluck(group.all(), 'key')))
                .rangeRound([0, width])
                .nice(d3.time.week)
            ;
            scaleY = d3.scale.linear()
                .domain([0, d3.max(_.pluck(group.all(), 'value'))])
                .range([height, 0])
            ;

            var svg = d3.select(this).select('svg');
            var gbrush;
            if (svg.empty()) {
                svg = d3.select(this).append('svg');
                g = svg.append('g')
                    .attr('transform', 'translate(' + margin.left + "," + margin.top + ')')
                ;

                g.append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                ;

                g.selectAll(".bar")
                    .data(["background", "foreground"])
                    .enter().append("path")
                    .attr("class", function(d) { return d + " bar"; })
                    .datum(group.all())
                ;

                g.selectAll(".foreground.bar")
                    .attr("clip-path", "url(#clip)")
                ;

                g.append('g')
                    .attr('class', 'axis x')
                ;
                g.append('g')
                    .attr('class', 'axis y')
                ;

                brush.x(scaleX);
                // Initialize the brush component with pretty resize handles.
                gBrush = g.append("g")
                    .attr("class", "brush")
                    .call(brush)
                ;
                gBrush.selectAll(".resize").append("path");
            }

            if (brushDirty) {
                brushDirty = false;
                svg.selectAll('.brush').call(brush);
                if (brush.empty()) {
                    svg.selectAll("#clip rect")
                        .attr("x", 0)
                        .attr("width", width)
                    ;
                } else {
                    var extent = brush.extent();
                    svg.selectAll("#clip rect")
                        .attr("x", scaleX(extent[0]))
                        .attr("width", scaleX(extent[1]) - scaleX(extent[0]))
                    ;
                }
            }

            svg.attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            ;

            gBrush.selectAll("rect").attr("height", height);
            gBrush.selectAll('.resize').selectAll('path').attr('d', resizePath);
            var extent = brush.extent();
            svg.select('#clip rect')
                .attr('height', height)
                .attr('width', function() {
                    if (brush.empty()) {
                        // this.setAttribute('x', null);
                        return width;
                    } else {
                        this.setAttribute('x', scaleX(extent[0]));
                        return scaleX(extent[1]) - scaleX(extent[0]);
                    }
                })
            ;
            brush.x(scaleX);
            gBrush.call(brush.extent(extent));

            svg.selectAll(".bar").transition().attr("d", barPath);
            // add axis
            axisX = d3.svg.axis()
                .scale(scaleX)
                .orient('bottom')
            ;
            axisY = d3.svg.axis()
                .scale(scaleY)
                .orient('left')
                .tickFormat(d3.format("d"))
            ;
            svg.select('.axis.x')
                .attr('transform', 'translate(0,' + height + ')')
                .transition()
                .call(axisX);
            svg.select('.axis.y').transition().call(axisY);

            function zoomed() {
                svg.select('.axis.x').call(axisX);
                svg.selectAll(".bar").attr("d", barPath);
            }

            function barPath(groups) {
                var path = [],
                    i = -1,
                    n = groups.length,
                    d;
                while (++i < n) {
                    d = groups[i];
                    if (d.key) {
                        path.push("M", scaleX(d.key), ",", height, "V", scaleY(d.value), "h9V", height);
                    }
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
        });
    }

    brush.on("brushstart.chart", function() {
    });

    brush.on("brush.chart", function() {
        var g = d3.select(this.parentNode),
            extent = brush.extent();
        if (round) g.select(".brush")
            .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
            .style("display", null);
        g.select("#clip rect")
            .attr("x", scaleX(extent[0]))
            .attr("width", scaleX(extent[1]) - scaleX(extent[0]));
        dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
        if (brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select("#clip rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
            activitylog({
                operation: 'defilter',
                data: JSON.stringify({'window_type': 'table'})
            });
        } else {
            activitylog({
                operation: 'filter',
                data: JSON.stringify({'window_type': 'table', 'filter_by': brush.extent()})
            });
        }
    });

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return exports;
    };

    exports.dimension = function(_) {
        if (!arguments.length) return dimension;
        dimension = _;
        return exports;
    };

    exports.filter = function(_) {
        if (_) {
            brush.extent(_);
            dimension.filterRange(_);
        } else {
            brush.clear();
            dimension.filterAll();
        }
        brushDirty = true;
        return exports;
    };

    exports.group = function(_) {
        if (!arguments.length) return group;
        group = _;
        return exports;
    };

    exports.round = function(_) {
        if (!arguments.length) return round;
        round = _;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return exports;
    };

    return d3.rebind(exports, brush, "on");
};
