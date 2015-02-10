// crossfilter related
wb.cf = {
  datafilter: {},
  dim: {},
  group: {}
};
// data
wb.store = {
  'case': {}, // cases involving the user
  entity: {}, // entities involved in the current case and the user
  dataentry:{}, // data entries in the current case
  dataset: {},  // datasets in the current case
  relationship: {},  // relationships involved in the current case and the user
  ENTITY_ENUM: ['person', 'location', 'organization', 'event', 'resource']
};
// profile, about the current case, users, group, etc.
wb.profile = {
  'case': 0,  // the current case id
  users: {},  // all users in the current group
  group: {},  // the current group
  user: 0,  // the current user id
  online_users: [],  // all online users id in the current group
};
// attributes for entities, temporarily hard coded here
wb.static = {
  event: ['category', 'date', 'priority'],
  location: ['address', 'precision', 'priority'],
  person: ['gender', 'nationality', 'ethnicity', 'race', 'religion', 'priority'],
  organization: ['category', 'nationality', 'ethnicity', 'religion', 'priority'],
  resource: ['condition', 'availability', 'category', 'priority'],
  relationship: ['relation', 'description', 'priority']
};
wb.vartifacts = [];


$(document).ready(function() {
    // initialize underlying data structure
    wb.cf.datafilter = crossfilter();
    wb.cf.dim.dataentry = wb.cf.datafilter.dimension(function(d) { return d.dataentry; });
    wb.cf.dim.relationship = wb.cf.datafilter.dimension(function(d) { return d.relationship; });
    wb.cf.dim.date = wb.cf.datafilter.dimension(function(d) { return d.date; });
    wb.cf.dim.person = wb.cf.datafilter.dimension(function(d) { return d.person; });
    wb.cf.dim.location = wb.cf.datafilter.dimension(function(d) { return d.location; });
    wb.cf.dim.event = wb.cf.datafilter.dimension(function(d) { return d.event; });
    wb.cf.dim.resource = wb.cf.datafilter.dimension(function(d) { return d.resource; });
    wb.cf.dim.organization = wb.cf.datafilter.dimension(function(d) { return d.organization; });
    wb.cf.group.dataentry = wb.cf.dim.dataentry.group();
    wb.cf.group.relationship = wb.cf.dim.relationship.group();
    wb.cf.group.date = wb.cf.dim.date.group();
    wb.cf.group.person = wb.cf.dim.person.group();
    wb.cf.group.location = wb.cf.dim.location.group();
    wb.cf.group.event = wb.cf.dim.event.group();
    wb.cf.group.resource = wb.cf.dim.resource.group();
    wb.cf.group.organization = wb.cf.dim.organization.group();
});


wb.setupDatasetList = function() {
    var dataset = wb.store.dataset;
    for (var key in dataset) {
        var name = dataset[key].name;
        var entries = dataset[key].entries;
        var line = '<li><a href="#"><label><input type="checkbox" name="' + name
            + '"value="' + key + '">' + name + '(' + entries
            + ')<label></a></li>';
        $('.dataset-list').prepend($(line));
    }
};

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

// change case
$.subscribe('/case/change', function(e, id) {
  $.get('case-info', {
    case: id
  }, function(res) {
    var datasets = res.datasets;
    var users = res.users;
    var group = res.group;

    // set current case id
    wb.profile.case = res.case;
    //
    // get users in the group
    wb.profile.users = users;
    for (var i in wb.profile.users) {
      wb.profile.users[i].color = wb.utility.randomColor();
    }

    // get the current group
    wb.profile.group = group;

    // add datasets to top menu
    var html = '';
    for (var id in datasets) {
      html += '<li><a href="#"><label><input type="checkbox" name="datasets" value="'
              + id
              + '">'
              + datasets[id].name
              + '</label></a>'
      ;
    }
    $('.dataset-list').append(html);
    wb.store.dataset = datasets;

    $.publish('/dataset/loaded');
  });
});


// add or remove datasets
$.subscribe('/dataset/update', function() {
    var now_selected_ds = $('ul.dataset-list')
      .find('input:checkbox:checked')
      .map(function() {
        return parseInt($(this).val());
      });
    var pre_selected_ds = [];
    _.values(wb.store.dataset).forEach(function(attr) {
        if (attr.selected) pre_selected_ds.push(attr.id);
    });
    var to_add = $(now_selected_ds).not(pre_selected_ds).get(); // to_add = now - pre
    var to_remove = $(pre_selected_ds).not(now_selected_ds).get(); // to_remove = pre - now
    if (to_add.length || to_remove.length) {
      addDatasets(to_add);
      removeDatasets(to_remove);
      $.publish('/data/reload');
    }
});


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
});


// do when a visual artifact performs a filter
$.subscribe('/data/filter', function() {
    // first argument is event object, ignore it
    // other arguments are the id of viz panels to be excluded for update
    for (var j = 0; j < wb.vartifacts.length; j++) {
        var panel = wb.vartifacts[j];
        if ($.makeArray(arguments).indexOf(panel.attr("id")) < 0) {
            if (! panel.hasClass('history')) {
              panel.data("instance").update();
            }
        }
    }
});


// when either the source or the target of the relationship changes
// i.e. in annotation an entity type is changed
// Then the target of the relationship changes to another entity
$.subscribe('/relationship/change', function(e, relationships) {
    delete_relationships(relationships);
    add_relationships(relationships);
    $.publish('/data/reload', [$(".dataentrytable").attr("id")]);
});


// when only the attribute of the relationship changes
// the change does not involve the target or the source id
$.subscribe('/relationship/update', function(e, relationships) {
  relationships.forEach(function(rel) {
    rel.primary.date = wb.utility.Date(rel.primary.date);
    wb.store.relationship[rel.id] = rel;
  });
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


// refresh online user list
$.subscribe('/user/update', function(e, users) {
  wb.profile.online_users = users;
  //
  // render current user list on page header
  $('#userlist').empty();
  for (var i = 0; i < wb.profile.online_users.length; i++) {
    var id = wb.profile.online_users[i];
    // do not show current user
    if (id == wb.profile.user) continue;

    var name = wb.profile.users[id].name;
    var color = wb.profile.users[id].color;
    var li = $('<li class="userlist-item dropdown"></li>')
      .appendTo($('#userlist'));

    $('<span class="label label-primary"></span>').appendTo(li)
      .text(name)
      .css('color', color)
    ;
  }
});


function delete_relationships(relationships) {
    // defilter first
    for (var dim in wb.cf.dim) {
        wb.cf.dim[dim].filterAll();
    }
    // filter
    var rels = relationships.map(function(rel) {
        return rel.primary.id;
    });
    wb.cf.dim.relationship.filter(function(d) {
        return rels.indexOf(d) > -1;
    });
    // delete
    wb.cf.datafilter.remove();
    // defilter
    wb.cf.dim.relationship.filterAll();
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
        var ENTITY_ENUM = wb.store.ENTITY_ENUM;
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

    wb.cf.datafilter.add(facts);
}

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
            data: {
              datasets: ds,
              group: wb.profile.group.id,
              'case': wb.profile.case
            },
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

                wb.cf.datafilter.add(res.ele);
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

        for (var dim in wb.cf.dim) {
            wb.cf.dim[dim].filterAll();
        }
        wb.cf.dim.dataentry.filter(function(d) {
            return entries.indexOf(d) > -1;
        });
        // delete
        wb.cf.datafilter.remove();
        // defilter
        wb.cf.dim.dataentry.filterAll();

        ds.forEach(function(d) {
            wb.store.dataset[d].selected = false;
        });
        $("#progressbar").hide();
    }
}

