wb.datafilter = null;
wb.dim = {}; // dimensions created by crossfilter
wb.group = {};
wb.store = {}; // store to host data such as data entries and entities
wb.vartifacts = [];
wb.ENTITY_ENUM = ['person', 'location', 'organization', 'event', 'resource'];


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
            wb.dim.dataentry = wb.datafilter.dimension(function(d) { return d.dataentry; });
            wb.dim.relationship = wb.datafilter.dimension(function(d) { return d.relationship; });
            wb.dim.date = wb.datafilter.dimension(function(d) { return d.date; });
            wb.dim.person = wb.datafilter.dimension(function(d) { return d.person; });
            wb.dim.location = wb.datafilter.dimension(function(d) { return d.location; });
            wb.dim.event = wb.datafilter.dimension(function(d) { return d.event; });
            wb.dim.resource = wb.datafilter.dimension(function(d) { return d.resource; });
            wb.dim.organization = wb.datafilter.dimension(function(d) { return d.organization; });
            wb.group.dataentry = wb.dim.dataentry.group();
            wb.group.relationship = wb.dim.relationship.group();
            wb.group.date = wb.dim.date.group();
            wb.group.person = wb.dim.person.group();
            wb.group.location = wb.dim.location.group();
            wb.group.event = wb.dim.event.group();
            wb.group.resource = wb.dim.resource.group();
            wb.group.organization = wb.dim.organization.group();

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

// override toString to easy display location entity
OpenLayers.Feature.Vector.prototype.toString = function() {
    return this.geometry.toString();
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


// Event subscriptions

// do when a visual artifact is closed
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
});

// do when a visual artifact performs a filter
$.subscribe('/data/filter', function() {
    // first argument is event object, ignore it
    // other arguments are the id of viz panels to be excluded for update
    for (var j = 0; j < wb.vartifacts.length; j++) {
        var panel = wb.vartifacts[j];
        if ($.makeArray(arguments).indexOf(panel.attr("id")) < 0) {
            var viz = panel.data("viz");
            panel.data(viz).update();
        }
    }
});


// do when an entity is added (created by annotation)
$.subscribe("/entity/add", function(e, entity, relationships) {
    var facts = [];
    relationships.forEach(function(relationship) {
        relationship.primary.date = new Date(relationship.primary.date);
        wb.store.relationship[relationship.primary.id] = relationship;

        var fact = {};
        fact.dataentry = relationship.primary.dataentry;
        fact.relationship = relationship.primary.id;
        fact.date = relationship.primary.date;
        var ENTITY_ENUM = wb.ENTITY_ENUM;
        for (var i = 0; i < ENTITY_ENUM.length; i++) {
            var ENTITY_TYPE = ENTITY_ENUM[i];
            if (entity.primary.entity_type === ENTITY_TYPE) {
                fact[ENTITY_TYPE] = relationship.primary.target;
            } else {
                fact[ENTITY_TYPE] = 0;
            }
        }
        facts.push(fact);
    });
    wb.datafilter.add(facts);

    // finally update store
    if (entity.primary.entity_type === 'location') {
        entity.primary.geometry = toOLGeometry(entity);
    }
    wb.store.entity[entity.primary.id] = entity;

    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});

// do when entity is deleted
$.subscribe('/entity/delete', function(e, annotations) {
    // delete fact in crossfilter that contains this dataentry and the previous entity
    // first defilter all existing filters
    var old_entity = {};
    old_entity.id = annotations[0].tag.id;
    old_entity.entity_type = annotations[0].tag.entity_type;

    for (var dim in wb.dim) {
        wb.dim[dim].filterAll();
    }
    // then filter out what we need
    // that is, data entry = annotation.anchor, 'the' entity = old entity id, and all other entities equal 0
    for (var i = 0; i < wb.ENTITY_ENUM.length; i++) {
        var ENTITY_TYPE = wb.ENTITY_ENUM[i];
        if (ENTITY_TYPE === old_entity.entity_type) {
            wb.dim[ENTITY_TYPE].filterExact(old_entity.id);
        } else {
            wb.dim[ENTITY_TYPE].filterExact(0);
        }
    }
    var dataentries = annotations.map(function(ann) { return ann.anchor; });
    wb.dim.dataentry.filter(function(d) {
        return dataentries.indexOf(d) > -1;
    });
    wb.datafilter.remove();
    for (var dim in wb.dim) {
        wb.dim[dim].filterAll();
    }

    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});


// do when attribute of an entity is modified
$.subscribe('/entity/attribute/change', function(e, entity) {
    wb.store.entity[entity.primary.id] = entity;
});


// do when an annotation changes its entity type, meaning the relationship between data entry and entity needs to be changed
// also, it means the data crossfilter needs to be chagned
$.subscribe('entity/annotation/change', function(e, annotations, entity, relationships) {
    // we need to update ele, the basic crossfilter data, and (optional) update entity and relationship in the store
    $.publish('/entity/delete', [annotations]);

    for (var i = 0, len = annotations.length; i < len; i++) {
        annotations[i].tag.id = entity.primary.id;
        annotations[i].tag.entity_type = entity.primary.entity_type;
    }

    $.publish('/entity/add', [entity, relationships]);
});

// do when data crossfilter is changed, and all visual artifacts need to reload data
$.subscribe('/data/reload', function(e, except) {
    var dataentry_table_id = $('.dataentrytable').attr('id');
    for (var j = 0; j < wb.vartifacts.length; j++) {
        var panel = wb.vartifacts[j];
        if (dataentry_table_id.indexOf(panel.attr("id")) < 0) { // if it is not data entry table, reload it
            var viz = panel.data("viz");
            panel.data(viz).reload();
        }
    }
});
