$.widget('viz.vizhistory', $.viz.vizbase, {
  options: {
    url: 'logs'
  },

  _create: function() {
    this._super('_create');
    this.element.data('viz', 'vizVizhistory');

    this._setupUI();
    this.loadData();
  },

  _setupUI: function() {
    var html = '\
      <ul class="history-list"></ul> \
    ';
    this.element.append(html);
  },

  loadData: function() {
    var _this = this;

    $.get(this.options.url, {
      'case': wb.profile.case,
      group: wb.profile.group.id
    }, function(data) {
      for (var i = 0, len = data.length; i < len; i++) {
        _this.add(data[i]);
      }
    });

  },

  add: function(item) {
    // item structure:
    // {'user': user_id, 'operation': '', 'time': '', 'data': ''}
    var row = $('<li class="history-item">').prependTo(this.element.find('ul.history-list'));
    var user = wb.profile.users[item.user];
    $('<span class="timestamp">').appendTo(row)
      .text(item.time);
    $('<span class="username">').appendTo(row)
      .text(user.name)
      .css('color', user.color);

    var action = item.operation + ' ' + item.item;
    if (item.data) {
      if (item.data.name) {
        action += ' <span class="entity">' + item.data.name + '</span>';
      }
    }
    $('<span class="content">').appendTo(row)
      .html(action)
    ;

    if (item.user === wb.profile.user) {
      row.css('background-color', '#eee')
    }
  },

  jumpToContext: function() {

  },

  reload: function() {

  }
});
