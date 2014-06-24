wb.datafilter = null;
wb.dim = {}; // dimensions created by crossfilter
wb.group = {};
wb.store = {}; // store to host data such as data entries and entities
wb.vartifacts = [];


$(document).ready(function() {
    // show progress bar before data is loaded
    $("#progressbar").progressbar({
        value: false
    });

    // TODO: load datasets first
    wb.store.dataset = {'1': {name: 'Sunni Criminal'}};
    var selected_datasets = {'datasets': ['Sunni Criminal']};

    $.ajax({
        url: 'data',
        type: 'POST',
        data: {datasets: ['Sunni Criminal', 'test']},
        success: function(res) {
            wb.store.relationship = res.relationship_dict;
            wb.store.dataentry = res.dataentry_dict;
            wb.store.entity = res.entity_dict;

            res.ele.forEach(function(d, i) {
                d.date = d.date ? new Date(d.date) : null;
            });

            wb.datafilter = crossfilter(res.ele);
            // Eight dimensions in total: date, dataentry, location, event, person, resource, organization, and relationship
            for (var dim in res.ele[0]) {
                wb.dim[dim] = wb.datafilter.dimension(function(d) { return d[dim]; });
                wb.group[dim] = wb.dim[dim].group();
            }

            _.values(wb.store.dataentry).forEach(function(d) {
                d.date = d.date ? new Date(d.date) : null;
            });
            _.values(wb.store.relationship).forEach(function(d) {
                d.date = d.date ? new Date(d.date) : null;
            });

            wb.group.location.all().forEach(function(d) {
                if (d.key) {
                    var location = wb.store.entity[d.key];
                    if (location.primary.geometry) {
                        location.primary.geometry = toOLGeometry(location);
                    }

                }
            });

            $("#progressbar").remove();
        }
    })
});


// Event subscriptions
$.subscribe('/data/filter', update);

function update() {
    // first argument is event object, ignore it
    // other arguments are the id of viz panels to be excluded for update
    for (var j = 0; j < wb.vartifacts.length; j++) {
        var panel = wb.vartifacts[j];
        if ($.makeArray(arguments).indexOf(panel.attr("id")) < 0) {
            var viz = panel.data("viz");
            panel.data(viz).update();
        }
    }
};

$.subscribe("/viz/close", function(e, panel_id, panel_title) {
    // remove the viz panel from wb.vartifacts
    for (var i = 0; i < wb.vartifacts.length; i++) {
        var panel = wb.vartifacts[i];
        if (panel.attr("id") === panel_id) {
            wb.vartifacts.splice(i, 1);
            break;
        }
    }
    activitylog({
        operation: 'close window',
        data: JSON.stringify({'window_type': panel_title})
    })
})

// triggered after tag is saved in server and returned with attributes from server
$.subscribe("/entity/added", function(e, annotations) {
    var facts = [];
    for (var i = 0, len = annotations.length; i < len; i++) {
        var annotation = annotations[i];
        var dataentry = {};

        annotation.tags.forEach(function(tag) {
            wb.store.entity[tag.primary.id] = tag; // add the new entity to store

            var fact = {
                dataentry: annotation.anchor,
                relationship: 0,
                date: wb.store.dataentry[annotation.anchor].date,
            };
            var ENTITY_ENUM = ['person', 'location', 'organization', 'event', 'resource'];
            for (var i = 0; i < ENTITY_ENUM.length; i++) {
                var ENTITY_TYPE =ENTITY_ENUM[i];
                if (tag.primary.entity_type === ENTITY_TYPE) {
                    fact[ENTITY_TYPE] = tag.primary.id;
                } else {
                    fact[ENTITY_TYPE] = 0;
                }
            }
            facts.push(fact);
        });
    }
    wb.datafilter.add(facts);
    $.publish('/data/filter', [$(".dataentrytable").attr("id")])
})

$.subscribe('/entity/deleted', function(e, annotations) {
    for (var i = 0, len = annotations.length; i < len; i++) {
        var annotation = annotations[i];

    }
})

function updateData(records) {
    wb.datafilter.add(records);
    $.publish('/data/filter', [$(".dataentrytable").attr("id")])
}

function toOLGeometry(entity) {
    var wktParser = new OpenLayers.Format.WKT();
    var feature = wktParser.read(entity.primary.geometry);
    var origin_prj = new OpenLayers.Projection("EPSG:4326");
    var dest_prj   = new OpenLayers.Projection("EPSG:900913");
    if (feature) {
        feature.geometry.transform(origin_prj, dest_prj); // projection of google map
    }
    feature.attributes.id = entity.primary.id;
    feature.attributes.name = entity.primary.name;
    return feature;
}
