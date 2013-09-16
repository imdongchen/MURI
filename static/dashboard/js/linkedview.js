var dDate   // date dimension
  , gDate   // group by date
  , dFootprint
  , dPerson
  , dOrganization
  , dEvent
  , dResource
  , dMessage
  , gAll    // group for all
  ;

var formatNumber = d3.format(",d"),
  formatChange = d3.format("+,d"),
  formatDate = d3.time.format("%B %d, %Y"),
  formatTime = d3.time.format("%I:%M %p");

var network = null;
var map = null;
var timeline = null;
var resourceTable = null;
var personTable = null;
var organizationTable = null;
var messageTable = null;
var workspace = null;
var eventTable = null;

$(document).ready(function() {
    d3.json("data", function(error, result) {
        // Various formatters.
        var data = result.events;
        var wktParser = new OpenLayers.Format.WKT();
        var footprints = [];

        data.forEach(function(d, i) {
            d.date  = new Date(d.date);
            var fp = d.footprint;
            if (fp.shape) {
                var feature = wktParser.read(fp.shape);
                var origin_prj = new OpenLayers.Projection("EPSG:" + fp.srid);
                var dest_prj   = new OpenLayers.Projection("EPSG:900913");
                feature.geometry.transform(origin_prj, dest_prj); // projection of google map
                feature.attributes.id = fp.uid;
                feature.attributes.name= fp.name;
                fp.shape = feature;
              }
        });

        // A nest operator, for grouping the flight list.
        var nestByDate = d3.nest()
          .key(function(d) { return d3.time.day(d.date); });

        // Create the crossfilter for the relevant dimensions and groups.
        datafilter = crossfilter(data);
        gAll = datafilter.groupAll();
        dDate = datafilter.dimension(function(d) { return d.date; });
        dFootprint = datafilter.dimension(function(d) {
            return [d.footprint.uid, d.footprint.name, d.footprint.shape, d.footprint.srid]; });
        gDate = dDate.group(d3.time.day);
        dResource = datafilter.dimension(function(d) { 
            var res = d.resource;
            return [res.uid, res.name, res.condition, res.resource_type]; 
        });
        dEvent    = datafilter.dimension(function(d) { 
            return [d.uid, d.name, d.types, d.excerpt, d.date];
        });
        dPerson   = datafilter.dimension(function(d) { 
            return [d.person.uid, d.person.name, d.person.gender, d.person.race, d.person.nationality]; 
        });
        dOrganization = datafilter.dimension(function(d) {
            var org = d.organization;
            return [org.uid, org.name, org.types, org.nationality, org.ethnicity, org.religion]; 
        });
        dMessage  = datafilter.dimension(function(d) {
            var mes = d.message;
            return [mes.uid, mes.content, mes.date] 
        });
        //
        // show requested dialogs
        var dialogs = $.trim($("#display_dialogs").text()).split(",");
        console.log(dialogs);
        showDialogs(dialogs);

        function parseDate(d) {
            return new Date(2001,
                d.substring(0, 2) - 1,
                d.substring(2, 4),
                d.substring(4, 6),
                d.substring(6, 8));
        }
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
    if (map) {
        map.update();
    }
    renderAllButMap();
}

function renderAllExcept(charts) {
    var toDraw = [];
    var all = ['map', 'timeline', 'network', 'personTable', 'messageTable', 'resourceTable', 'eventTable','organizationTable'];
    for (var i = 0, len = all.length; i < len; i++) {
        if (charts.indexOf(all[i]) === -1) {
            toDraw.push(all[i])
        }
    }
    for (var i = 0, len = toDraw.length; i < len; i++) {
        switch (toDraw[i]) {
            case "map":
                if (map) map.update();
                break;
            case "timeline":
                if (timeline) timeline.update();
                break;
            case "network":
                if (network) network.update();
                break;
            case "personTable":
                if (personTable) personTable.update();
                break;
            case "messageTable":
                if (messageTable) messageTable.update();
                break;
            case "resourceTable":
                if (resourceTable) resourceTable.update();
                break;
            case "eventTable":
                if (eventTable) eventTable.update();
                break;
            case "organizationTable":
                if (organizationTable) organizationTable.update();
                break;
        }
    }

}

function renderAllButNetwork() {
    if (map) {
        map.update();
    }
    if(timeline) {
        timeline.each(render);
    }
    if (eventTable) {
        eventTable.update();
    }
    if (messageTable) {
        messageTable.update();
    }
    if (resourceTable) {
        resourceTable.update();
    }
    if (organizationTable) {
        organizationTable.update();
    }
    if (personTable) {
        personTable.update();
    }
    if (network) {
        network.update();
    }
}

function renderAllButMap() {
    if (timeline) {
        timeline.each(render);
    }
    if (messageTable) {
        messageTable.update();
    }
    if (resourceTable) {
        resourceTable.update();
    }
    if (eventTable) {
        eventTable.update();
    }
    if (organizationTable) {
        organizationTable.update();
    }
    if (personTable) {
        personTable.update();
    }
    if (network) {
        network.update();
    }
}

function highlight(event_id) {
    var eve = null; // the target event
    var NoException = {};
    try {
        // NoException: dirty trick to do 'break' in forEach
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
        if (map) {
            map.highlight(footprints_id);
        }
    }
}

function highlightFromNetwork(ids) {
    for (var i = 0, len = ids.length; i < len; i++) {
        dDate.top(Infinity).forEach(function(p, i) {
        });
    }
}

function unhighlightFromNetwork(ids) {
    for (var i = 0, len = ids.length; i < len; i++) {
    }
}
