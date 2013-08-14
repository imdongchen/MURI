var date, dates;

$(document).ready(function() {
    d3.csv("{{STATIC_URL}}flights-3m.json", function(error, flights) {
        // Various formatters.
        var formatNumber = d3.format(",d"),
          formatChange = d3.format("+,d"),
          formatDate = d3.time.format("%B %d, %Y"),
          formatTime = d3.time.format("%I:%M %p");

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

        // A little coercion, since the CSV is untyped.
        flights.forEach(function(d, i) {
            d.index = i;
            d.date = parseDate(d.date);
            d.delay = +d.delay;
            d.distance = +d.distance;
        });

        // Create the crossfilter for the relevant dimensions and groups.
        var flight = crossfilter(flights),
            all = flight.groupAll(),
            hour = flight.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; }),
            hours = hour.group(Math.floor),
            delay = flight.dimension(function(d) { return Math.max(-60, Math.min(149, d.delay)); }),
            delays = delay.group(function(d) { return Math.floor(d / 10) * 10; }),
            distance = flight.dimension(function(d) { return Math.min(1999, d.distance); }),
            distances = distance.group(function(d) { return Math.floor(d / 50) * 50; })
        ;
        date = flight.dimension(function(d) { return d.date; }),
        dates = date.group(d3.time.day),
        
        loadTimeline();
    });
});
