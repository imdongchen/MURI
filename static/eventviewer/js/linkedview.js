var dDate   // date dimension
  , gDate   // group by date
  , dFootprint
  , dFootprints
  , gAll    // group for all
  ;

var formatNumber = d3.format(",d"),
  formatChange = d3.format("+,d"),
  formatDate = d3.time.format("%B %d, %Y"),
  formatTime = d3.time.format("%I:%M %p");

var network = null;
var map = null;
var timeline = null;
var objectTable = null;
var messageTable = null;

$(document).ready(function() {
    d3.json("data", function(error, result) {
        // Various formatters.
        var data = result.events;
        var wktParser = new OpenLayers.Format.WKT();
        var footprints = [];

        data.forEach(function(d, i) {
            d.date  = new Date(d.date);
            d.footprints.forEach(function(fp, i) {
                var feature = wktParser.read(fp.shape);
                var origin_prj = new OpenLayers.Projection("EPSG:" + fp.srid);
                var dest_prj   = new OpenLayers.Projection("EPSG:900913");
                feature.geometry.transform(origin_prj, dest_prj); // projection of google map
                feature.attributes.id = fp.id;
                feature.attributes.category = fp.category;
                feature.attributes.precision = fp.precision;
                feature.attributes.description = fp.description;
                fp.shape = feature;
                footprints.push(fp);
            });
        });

        function parseDate(d) {
            return new Date(2001,
                d.substring(0, 2) - 1,
                d.substring(2, 4),
                d.substring(4, 6),
                d.substring(6, 8));
        }
        // A nest operator, for grouping the flight list.
        var nestByDate = d3.nest()
          .key(function(d) { return d3.time.day(d.date); });

        // Create the crossfilter for the relevant dimensions and groups.
        datafilter = crossfilter(data);
        gAll = datafilter.groupAll();
        dDate = datafilter.dimension(function(d) { return d.date; });
        dFootprints = datafilter.dimension(function(d) { return d.footprints; });
        gDate = dDate.group(d3.time.day);
        var footprintfilter = crossfilter(footprints);
        dFootprint = footprintfilter.dimension(function(p) { return p.id; });
    });
});
//
//
// Renders the specified chart or list.
function render(method) {
    d3.select(this).call(method); // I don't understand, what method is being called?
}

// Whenever the brush moves, re-render everything.
function renderAll() {
    updateFootprints();
    if (map) {
        map.update();
    }
    renderAllButMap();
}

function renderAllButMap() {
    if(timeline) {
        timeline.each(render);
    }
    if (messageTable) {
        messageTable.update();
    }
    if (objectTable) {
        objectTable.update();
    }
    if (network) {
        network.update();
    }
}

function updateFootprints() {
    var footprints = [];
    dDate.top(Infinity).forEach(function(p, i) {
        if (p.footprints !== null) {
            p.footprints.forEach(function(fp) {
                footprints.push(fp);
            });
        }
    });
    var footprintfilter = crossfilter(footprints);
    dFootprint      = footprintfilter.dimension(function(p) { return p.id; });
}

function highlight(event_id) {
    var eve = null; // the target event
    var NoException = {};
    try {
        dDate.top(Infinity).forEach(function(p, i) {
            if (p.id == event_id) {
                eve = p;
                throw NoException;
            }
        });
    } catch(e) {
        if (e !== NoException) throw e;
        var footprints_id = [];
        for (var i = 0; i < eve.footprints.length; i++) {
            footprints_id.push(eve.footprints[i].id);
        }
        map.highlight(footprints_id);
    }
}
