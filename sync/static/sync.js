$.subscribe('/data/loaded', function() {
});


ishout.on('message', function(data) {
  for (var i = 0; i < wb.vartifacts.length; i++) {
    var viz = wb.vartifacts[i];
    if (viz.data('viz') === 'vizVizmessage') {
      // look for message window
      viz.data('vizVizmessage').loadMessage(data);
    }
  }

});


ishout.on('userlist', function(data) {
  // get all users online
  // data structure:
  // {user_id: {'id': user_id, name: username}}
  $.publish('/userlist', [data])
});

ishout.on('entity.create', function(entity) {
  if (! (entity.primary.id in wb.store.entity)) {
    wb.store.entity[entity.primary.id] = entity;
  }
});


// new annotation received
ishout.on('annotation.create', function(data) {
  if (data.annotation) {
    var annotations = [data.annotation];
  } else {
    var annotations = data.annotations;
  }
  if (data.relationship) {
    var relationships = [data.relationship];
  } else {
    var relationships = data.relationships;
  }
  var entity = data.entity;

  // if the annotation is created by the user itself, do nothing
  if (data.user === wb.USER)  return ;

  // render annotation--add annotation to annotator
  for (var i = 0; i < wb.vartifacts.length; i++) {
    var viz = wb.vartifacts[i];
    if (viz.data('viz') === 'vizVizdataentrytable') {
      // look for message window
      viz.data('vizVizdataentrytable').addAnnotations(annotations);
    }
  }

  // add entity and relationship to underlying data structure
  $.publish('/entity/change', entity);
  $.publish('/relationship/add', [relationships]);

  wb.utility.notify(wb.users[data.user].name + ' creates '
                    + entity.primary.entity_type + ' '
                    + entity.primary.name);

});


ishout.on('annotation.update', function(data) {
  // if the annotation is created by the user itself, do nothing
  if (data.user === wb.USER)  return ;

  if (data.annotation) {
    var annotations = [data.annotation];
  } else {
    var annotations = data.annotations;
  }
  if (data.relationship) {
    var relationships = [data.relationship];
  } else if (data.relationships){
    var relationships = data.relationships;
  } else {
    var relationships = null;
  }
  var entity = data.entity;

  // render annotation--add annotation to annotator
  for (var i = 0; i < wb.vartifacts.length; i++) {
    var viz = wb.vartifacts[i];
    if (viz.data('viz') === 'vizVizdataentrytable') {
      // look for message window
      viz.data('vizVizdataentrytable').updateAnnotations(annotations);
    }
  }

  // add entity and relationship to underlying data structure
  $.publish('/entity/change', entity);
  if (relationships) {
    $.publish('/relationship/change', [relationships]);
  }

  wb.utility.notify(wb.users[data.user].name + ' updates '
                    + entity.primary.entity_type + ' '
                    + entity.primary.name);
});


ishout.on('annotation.delete', function(data) {
  if (data.user == wb.USER) return;
  if (data.relationship) {
    var relationships = [data.relationship];
  } else {
    var relationships = data.relationships;
  }
  if (data.annotation) {
    var annotations = [data.annotation];
  } else {
    var annotations = data.annotations;
  }
  var entity = data.entity;

  // render annotation--add annotation to annotator
  for (var i = 0; i < wb.vartifacts.length; i++) {
    var viz = wb.vartifacts[i];
    if (viz.data('viz') === 'vizVizdataentrytable') {
      // look for message window
      viz.data('vizVizdataentrytable').deleteAnnotations(annotations);
    }
  }

  $.publish('/relationship/delete', [relationships]);

  wb.utility.notify(wb.users[data.user].name + ' deletes '
                    + entity.primary.entity_type + ' '
                    + entity.primary.name);
});


ishout.on('relationship.create', function(data) {
  rel = data.relationship;
  $.publish('/relationship/add', [[rel]]);
});


ishout.init(function() {

});

// join room
// todo: what should be the room name?
ishout.joinRoom('main', function(data) {
  // after joining room, server will return a list of users in the room:
  // {users: [user_id]}
  $.publish('/userlist', [data.users]);
});

