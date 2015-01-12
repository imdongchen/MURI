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
wb.utility.formatTime = d3.time.format("%I:%M:%p");
wb.utility.formatDateTime = d3.time.format("%B %d, %Y-%I:%M:%p");

wb.utility.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

wb.utility.uniqueArray = function(arr) {
    return arr.filter(function(d, i, self) {
        return self.indexOf(d) === i;
    });
};

wb.utility.Date = function(date) {
    return date ? new Date(date) : null;
};

wb.utility.randomColor = function() {
    // suggested by http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
