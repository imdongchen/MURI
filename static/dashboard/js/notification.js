$.widget('wb.notification', {
    options: {

    },
    _create: function() {
        this.element.addClass('notification');

    },
    show: function(message, status) {
        this.element.html(message);
        this.element.addClass()

    },
    hide: function() {

    }
});


wb.notify = function(message, status) {
    if (!message) {
        return;
    }
    status = status || 'info';
    
    var $notification = $('#notification');
    if ($notification) {
        $notification.addClass('notification-' + status).html(message);
        setTimeout(wb.unnotify, 5000);
    }
};

wb.unnotify = function() {
    var $notification = $('#notification');
    if ($notification) {
        $notification.removeClass().addClass('notification');
    }
};
