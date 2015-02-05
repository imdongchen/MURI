$.widget('viz.vizmessage', $.viz.vizbase, {
  options: {

  },

  _create: function() {
    this._super('_create');
    this.element.data('viz', 'vizVizmessage');

    var message_html = ' \
      <div class="wrapper"> \
        <ul class="messages"> \
        </ul> \
        <div class="push"> \
        </div> \
      </div> \
      <div class="footer message_post"> \
        <form style="display:inline;"> \
          <div id="message_content" contentEditable=true data-placeholder="Type here..."> \
          <input type="submit" style="display:none"> \
        </form> \
      </div> \
    ';

    this.element.append(message_html);

    this.loadMessages();

    this._initialize();
  },

  _initialize: function() {
    // initialize events listeners for components
    this.element.find('#message_content').keydown(function(e) {
      if (e.which == 13) { // press enter
        var content = $(this).text();
        var _this = this;
        $.post('sync/message/broadcast', {
          content: content,
          case: wb.profile.case,
          group: wb.profile.group.id
        }, function(res) {
          if (res === 'success') {
            $(_this).text('');
          }

        });
      }
    })
  },

  loadMessages: function() {
    var _this = this;
    $.get('sync/message/all', function(msgs) {
      for (var i = 0, len = msgs.length; i < len; i++) {
        _this.loadMessage(msgs[i]);
      }
    })
  },

  loadMessage: function(msg) {
    // receive new messages
    // msg structure:
    // { 'sender': user_id, 'content': '', time: 'timestamp'}
    // self: whether the message is sent by the current user

    var row = $('<li class="message"></li>').appendTo(this.element.find('ul.messages'));

    var user = wb.profile.users[msg.sender];
    $('<span class="username"></span>').appendTo(row)
      .text(user.name)
      .css('color', user.color);
    $('<span class="timestamp"></span>').appendTo(row)
      .text(msg.sent_at);
    $('<span class="messagebody"></span>').appendTo(row)
      .text(msg.content);

    if (msg.sender === wb.profile.user) {
      row.css('background-color', '#eee');
    }
  },

  reload: function() {

  },

  update: function() {

  }
});
