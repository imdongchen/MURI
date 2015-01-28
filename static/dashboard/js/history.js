$.widget('viz.vizmessage', $.viz.vizbase, {
  options: {

  },

  _create: function() {
    this._super('_create');
    this.element.data('viz', 'vizVizhistory');

    this._setupUI();
    this.loadData();
  },

  _setupUI(): function() {
    var html = '\
      <ul class="history-list"></ul> \
    ';
    this.element.append(html);
  },

  loadData: function() {
    $.get('activitylog', {
      case: wb.CASE,
      group: wb.GROUP
    }, function(data) {
      for (var i = 0, len = data.length; i < len; i++) {
        _this.add(data[i]);
      }
    });

  },

  add: function(item) {
    // item structure:
    // {'user': user_id, 'operation': '', 'time': '', 'data': ''}
    var row = $('<li class="history-item">').appendTo(this.element).find('ul.history-list');
    var user = wb.users[item.user];
    var action = item.operation + ' ' + item.item;
    $('<span class="timestamp">').appendTo(row)
      .text(user.name);
    $('<span class="username">').appendTo(row)
      .text(item.time)
      .css('color', user.color);
    $('<span class="content"').appendTo(row)
      .text(action)
    ;

    if (item.user === wb.USER) {
      row.css('background-color', '#eee')
    }
  },

  jumpToContext: function() {

  }
});
