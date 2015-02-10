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

    // click on timestamp, jump to context
    this.element.on('click', 'li.history-item .timestamp', this.jumpToContext.bind(this));
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

    row.data('context', item)
  },

  jumpToContext: function(e) {
    // highlight the selected action
    var row = $(e.target).parent();
    if (row.hasClass('active')) {
      row.removeClass('active');
      return;
    }
    row.parent().children('.history-item').removeClass('active');
    row.addClass('active');

    // open the tool in which the action is performed
    var data = row.data('context');
    if (data) {
      if (data.item) {
        // $('#' + data.tool + '-btn').click();
        var subtitle = ' - restored from '
          + data.time
          + ' by '
          + wb.profile.users[data.user].name;
        viz_opt = data.item.split('_');
        var viz_name = viz_opt[0];
        var viz_form = viz_opt[1];
        var viz;
        if (viz_form === 'table') {
            if (viz_name === 'dataentry') {
                viz = $('<div>').vizdataentrytable({
                    title: 'Data Entry' + subtitle,
                    dimension: wb.cf.dim.dataentry,
                    group: wb.cf.group.dataentry
                });
            } else {
                viz = $('<div>').vizentitytable({
                    title: viz_name + subtitle,
                    dimension: wb.cf.dim[viz_name],
                    group: wb.cf.group[viz_name]
                });
            }
        } else if (viz_name === 'timeline') {
            viz = $('<div>').viztimeline({
                title: 'Timeline' + subtitle,
                width: 800,
                height: 200,
                dimension: wb.cf.dim.date,
                group: wb.cf.group.date
            });
        } else if (viz_name === 'map' || viz_name === 'location') {
            viz = $('<div>').vizmap({
                title: 'Map' + subtitle,
                dimension: wb.cf.dim.location,
                group: wb.cf.group.location
            });
        } else if (viz_name === 'network' || viz_name === 'relationship') {
            viz = $('<div>').viznetwork({
                title: 'Network' + subtitle,
                dimension: wb.cf.dim.relationship,
                group: wb.cf.group.relationship
            });
        } else if (viz_name === 'notepad') {
            viz = $('<div>').viznotepad({
                title: 'Notepad' + subtitle
            });
        } else if (viz_name === 'message') {
          viz = $('<div>').vizmessage({
            title: 'Message' + subtitle
          });
        } else if (/annotation/.test(viz_name)) {
          viz = $('<div>').vizdataentrytable({
              title: 'Data Entry' + subtitle,
              dimension: wb.cf.dim.dataentry,
              group: wb.cf.group.dataentry
          });
        } else if (wb.store.ENTITY_ENUM.indexOf(viz_name) > -1) {
          viz = $('<div>').vizentitytable({
              title: viz_name + subtitle,
              dimension: wb.cf.dim[viz_name],
              group: wb.cf.group[viz_name]
          });
        }

        if (viz) {
            viz.addClass('history');
            viz.parent().addClass('history');
            if (data.data && data.data.id) {
              viz.data('instance').highlight(data.data.id)
            }
            wb.vartifacts.push(viz);
        }

      }
    }

  },

  reload: function() {

  },

  update: function() {

  }
});
