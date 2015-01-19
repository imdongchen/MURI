wb.datafilter = null;
wb.dim = {}; // dimensions created by crossfilter
wb.group = {};
wb.store = {
    entity: {},
    dataentry:{},
    dataset: {},
    relationship: {},
}; // store to host data such as data entries and entities
wb.vartifacts = [];
wb.users = {}; // all users
wb.online_users = []; // current online users id
wb.ENTITY_ENUM = ['person', 'location', 'organization', 'event', 'resource'];


$(document).ready(function() {
    $.get('account/all', function(users) {
      // get all user, prepared for broadcasting messages
      for (var i = 0, len = users.length; i < len; i++) {
        var u = users[i];
        if (! (u.id in wb.users)) {
          wb.users[u.id] = u;
          wb.users[u.id].color = wb.utility.randomColor();
        }
      }

    });

    // get a list of dataset at the very beginning
    $.ajax({
        url: 'dataset',
        type: 'GET',
        success: function(res) {
            wb.store.dataset = res;
            // load some sample data, otherwise the app is blank..
            addDatasets(['1']);
            $.publish('/data/loaded');
            $('#dataset-list').find(':checkbox[value=1]').prop('checked', true);
        }
    });

    // initialize underlying data structure
    wb.datafilter = crossfilter();
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
});

// override toString to easy display location entity
OpenLayers.Feature.Vector.prototype.toString = function() {
    return this.geometry.toString();
}

wb.setupDatasetList = function() {
    var dataset = wb.store.dataset;
    for (var key in dataset) {
        var name = dataset[key].name;
        var entries = dataset[key].entries;
        var line = '<li><a href="#"><label><input type="checkbox" name="' + name
            + '"value="' + key + '">' + name + '(' + entries
            + ')<label></a></li>';
        $('#dataset-list').prepend($(line));
    }
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

// add or remove datasets
$.subscribe('/dataset/update', function() {
    var now_selected_ds = $('ul#dataset-list').find('input:checkbox:checked').map(function() {
        return parseInt($(this).val());
    });
    var pre_selected_ds = [];
    _.values(wb.store.dataset).forEach(function(attr) {
        if (attr.selected) pre_selected_ds.push(attr.id);
    });
    var to_add = $(now_selected_ds).not(pre_selected_ds).get(); // to_add = now - pre
    var to_remove = $(pre_selected_ds).not(now_selected_ds).get(); // to_remove = pre - now
    addDatasets(to_add);
    removeDatasets(to_remove);
    $.publish('/data/reload');
});

function addDatasets(ds) {
    // request data entries
    // ds: array of dataset id

    if (ds && ds.length) {
        // show progress bar before data is loaded
        $("#progressbar").show().progressbar({
            value: false
        });
        $.ajax({
            url: 'data',
            type: 'POST',
            data: {datasets: ds},
            success: function(res) {
                // data formatting
                res.ele.forEach(function(d, i) {
                    d.date = d.date ? new Date(d.date) : null;
                });
                _.values(res.dataentry_dict).forEach(function(d) {
                    d.date = d.date ? new Date(d.date) : null;
                });
                _.values(res.relationship_dict).forEach(function(d) {
                    d.date = d.date ? new Date(d.date) : null;
                });
                _.values(res.entity_dict).forEach(function(d) {
                    if (d.primary.entity_type === 'location') {
                        if (d.primary.geometry && typeof d.primary.geometry === 'string') { // if geometry is still in wkt format
                            d.primary.geometry = toOLGeometry(d);
                        }
                    }
                });

                wb.datafilter.add(res.ele);
                $.extend(wb.store.entity, res.entity_dict);
                $.extend(wb.store.relationship, res.relationship_dict);
                $.extend(wb.store.dataentry, res.dataentry_dict);
                ds.forEach(function(d) {
                    wb.store.dataset[d].selected = true;
                });

                $("#progressbar").hide();
            }
        });
    }
}

function removeDatasets(ds) {
    // remove local dataentry, including crossfilter and store.dataentry
    // ds: array of dataset id

    // find all related data entries
    if (ds && ds.length) {
        $("#progressbar").show().progressbar({
            value: false
        });
        var entries = _.values(wb.store.dataentry).map(function(d) {
            if (ds.indexOf(d.dataset) > -1) {
                var id = d.id
                delete wb.store.dataentry[id];
                return id;
            }
        });

        for (var dim in wb.dim) {
            wb.dim[dim].filterAll();
        }
        wb.dim.dataentry.filter(function(d) {
            return entries.indexOf(d) > -1;
        });
        // delete
        wb.datafilter.remove();
        // defilter
        wb.dim.dataentry.filterAll();

        ds.forEach(function(d) {
            wb.store.dataset[d].selected = false;
        });
        $("#progressbar").hide();
    }
}

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
    });
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


$.subscribe('/relationship/add', function(e, relationships) {
    add_relationships(relationships);
    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});


// do when entity is deleted
$.subscribe('/relationship/delete', function(e, relationships) {
    delete_relationships(relationships);

    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});


// do when attribute of an entity is modified
$.subscribe('/entity/change', function(e, entity) {
    if (entity.primary.entity_type === 'location') {
        entity.primary.geometry = toOLGeometry(entity);
    }
    wb.store.entity[entity.primary.id] = entity;
});



function delete_relationships(relationships) {
    // defilter first
    for (var dim in wb.dim) {
        wb.dim[dim].filterAll();
    }
    // filter
    var rels = relationships.map(function(rel) {
        return rel.primary.id;
    });
    wb.dim.relationship.filter(function(d) {
        return rels.indexOf(d) > -1;
    });
    // delete
    wb.datafilter.remove();
    // defilter
    wb.dim.relationship.filterAll();
}

function add_relationships(relationships) {
    var facts = [];
    relationships.forEach(function(relationship) {
        relationship.primary.date = wb.utility.Date(relationship.primary.date);
        wb.store.relationship[relationship.primary.id] = relationship;

        var fact = {};
        var primary = relationship.primary;
        wb.store.relationship[relationship.primary.id] = relationship;

        var source = wb.store.entity[primary.source];
        var target = wb.store.entity[primary.target];

        fact.dataentry = primary.dataentry;
        fact.date = primary.date;
        fact.relationship = primary.id;
        var ENTITY_ENUM = wb.ENTITY_ENUM;
        for (var i = 0; i < ENTITY_ENUM.length; i++) {
            var ENTITY_TYPE = ENTITY_ENUM[i];
            if (source && source.primary.entity_type === ENTITY_TYPE) {
                fact[ENTITY_TYPE] = primary.source;
            } else if (target && target.primary.entity_type === ENTITY_TYPE) {
                fact[ENTITY_TYPE] = primary.target;
            } else {
                fact[ENTITY_TYPE] = 0;
            }
        }
        facts.push(fact);
        if (source && target && source.primary.entity_type === target.primary.entity_type) {
            var fact2 = $.extend({}, fact);
            fact2[target.primary.entity_type] = target.primary.id;
            facts.push(fact2);
        }
    });

    wb.datafilter.add(facts);
}

// do when an annotation changes its entity type, meaning the relationship between data entry and entity needs to be changed
// also, it means the data crossfilter needs to be chagned
$.subscribe('/relationship/change', function(e, relationships) {
    delete_relationships(relationships);
    add_relationships(relationships);
    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});

// do when data crossfilter is changed, and all visual artifacts need to reload data
$.subscribe('/data/reload', function(e, except) {
    var dataentry_table_id = $('.dataentrytable').attr('id');
    if (except && except.length) {
      for (var j = 0; j < wb.vartifacts.length; j++) {
          var panel = wb.vartifacts[j];
          if (except.indexOf(panel.attr("id")) < 0) {
            var viz = panel.data("viz");
            panel.data(viz).reload();
          }
      }
    } else {
      for (var j = 0; j < wb.vartifacts.length; j++) {
          var panel = wb.vartifacts[j];
          var viz = panel.data("viz");
          panel.data(viz).reload();
      }

    }
});


// refresh online user list
$.subscribe('/userlist', function(e, users) {
  wb.online_users = users;
  //
  // render current user list on page header
  $('#userlist').empty();
  for (var i = 0; i < wb.online_users.length; i++) {
    var id = wb.online_users[i];
    // do not show current user
    if (id == wb.USER) continue;

    var name = wb.users[id].name;
    var color = wb.users[id].color;
    var li = $('<li class="userlist-item dropdown"></li>')
      .appendTo($('#userlist'));

    $('<span class="label label-primary"></span>').appendTo(li)
      .text(name)
      .css('color', color)
    ;
  }
});
