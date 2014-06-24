// enable sub/pub within individual elements
$.each({
    trigger  : 'publish',
    on       : 'subscribe',
    off      : 'unsubscribe'
}, function ( key, val) {
    jQuery.fn[val] = function() {
        this[key].apply(this, Array.prototype.slice.call(arguments));
    };
});


wb.utility = {};

wb.utility.formatNumber = d3.format(",d");
wb.utility.formatChange = d3.format("+,d");
wb.utility.formatDate = d3.time.format("%B %d, %Y");
wb.utility.formatTime = d3.time.format("%I:%M %p");

wb.utility.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
