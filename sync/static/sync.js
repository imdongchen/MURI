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
  for (var id in data) {
    if (! (id in wb.online_users)) {
      wb.online_users[id] = data[id];
      wb.online_users[id].color = wb.users[id].color;
    }
  }
  // render current user list on page header
  $('#userlist').empty();
  for (var id in wb.online_users) {
    var name = wb.online_users[id].name;
    var color = wb.online_users[id].color;
    var li = $('<li class="userlist-item dropdown"></li>')
      .appendTo($('#userlist'));

    $('<span class="label label-primary"></span>').appendTo(li)
      .text(name)
      .css('color', color)
    ;
  }
});

ishout.on('entity.create', function(entity) {
  if (! (entity.primary.id in wb.store.entity)) {
    wb.store.entity[entity.primary.id] = entity;
  }
});


// new annotation received
ishout.on('annotation.create', function(data) {
  var annotations = [data.annotation] || data.annotations,
      entity = data.entity,
      relationships = [data.relationship] || data.relationships
  ;

  // if the annotation is created by the user itself, do nothing
  if (annotations[0].created_by === wb.USER)  return ;

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

  wb.utility.notify(wb.users[annotations[0].created_by].name + ' created an '
                    + entity.primary.entity_type + ' '
                    + entity.primary.name);

});


ishout.init();
ishout.joinRoom('main'); // todo: avoid hard coded room

