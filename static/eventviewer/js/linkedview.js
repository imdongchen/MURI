var date, dates, all, data, datafilter;

$(document).ready(function() {
    d3.json("data", function(error, result) {
        // Various formatters.
        data = result.events;
        var formatNumber = d3.format(",d"),
          formatChange = d3.format("+,d"),
          formatDate = d3.time.format("%B %d, %Y"),
          formatTime = d3.time.format("%I:%M %p");
        
        data.forEach(function(d, i) {
            d.date  = new Date(d.date);
        });

        function parseDate(d) {
            return new Date(2001,
                d.substring(0, 2) - 1,
                d.substring(2, 4),
                d.substring(4, 6),
                d.substring(6, 8));
        }
        // A nest operator, for grouping the flight list.
        var nestByDate = d3.nest()
          .key(function(d) { return d3.time.day(d.date); });

        // Create the crossfilter for the relevant dimensions and groups.
        datafilter = crossfilter(data);
        all = datafilter.groupAll();
        date = datafilter.dimension(function(d) { return d.date; });
        dates = date.group(d3.time.day);
        
        loadTimeline();
        loadDataTable();
    });
});
