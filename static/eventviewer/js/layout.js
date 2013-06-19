$(document).ready(function () {
    doLayout();
    // init tabs
   
    // init time slider
    // start and end date, to be read from database
    var startDate = new Date(2000, 0, 1);
    var endDate   = new Date(2001, 0, 1);
    var deltaDays = getDayDelta(startDate, endDate);

    var $startDate = $( "#startDate" ).datepicker({
        changeMonth: true
        , changeYear: true
        , minDate   : startDate
        , maxDate   : endDate
        , defaultDate: startDate
        , onSelect: function(date) {
            var value = (date - startDate) / (endDate - startDate) * deltaDays;
            $("#timeSlider").slider("values", 0, value);
        }
    });
    var $endDate = $( "#endDate" ).datepicker({
        changeMonth: true
        , changeYear: true
        , minDate   : startDate
        , maxDate   : endDate
        , defaultDate: endDate
        , onSelect: function(date) {
            var value = (endDate - date) / (endDate - startDate) * deltaDays;
            $("#timeSlider").slider("values", 1, value);
        }
    });
    $startDate.datepicker('setDate', startDate);
    $endDate.datepicker('setDate', endDate);
    

    var $timeSlider = $( "#timeSlider" ).slider({
        range: true
        , min: 0
        , max: deltaDays
        , values: [ 0, deltaDays ]
        , slide: function( event, ui ) {
            $('#startDate').datepicker('setDate', new Date(startDate.getTime() + ui.values[0]*60*60*24*1000));
            $('#endDate').datepicker('setDate', new Date(endDate.getTime() - (deltaDays-ui.values[1])*60*60*24*1000)); }
        , stop: function( event, ui ) {}
    });

});

function getDayDelta(fromdate, todate) {
    return Math.round( (todate-fromdate)/1000/60/60/24 );
}

function updateTime(startDate, endDate) {
    // update datepicker control
    var startVal = 0, endVal = 100;
    $timeSlider.slider('option', 'values', [startVal, endVal]);
    // update time slider control
    // update data grid controls
    // update map
    // update social network
}

function doLayout() {
    // OUTER-LAYOUT
    $('body').layout({
            center__paneSelector:	".outer-center"
    ,	west__paneSelector:		".outer-west"
    ,	east__paneSelector:		".outer-east"
    ,	west__size:				300
    ,	east__size:				300
    ,	spacing_open:			8  // ALL panes
    ,	spacing_closed:			12 // ALL panes
    //,	north__spacing_open:	0
    //,	south__spacing_open:	0
    ,	north__maxSize:			200
    ,	south__maxSize:			200
    ,	north__spacing_open:	0
    ,	south__spacing_open:	0

            // MIDDLE-LAYOUT (child of outer-center-pane)
    ,	center__childOptions: {
                    center__paneSelector:	".middle-center"
            ,	spacing_open:			8  // ALL panes
            ,	spacing_closed:			12 // ALL panes

                    // INNER-LAYOUT (child of middle-center-pane)
            ,	center__childOptions: {
                            center__paneSelector:	".inner-center"
                    ,	spacing_closed:			20  // ALL panes
                    ,	spacing_open:			20  // ALL panes
                    ,	south__size:			150  // ALL panes
                    ,	south__initClosed:             true
                    ,	south__togglerLength_closed: 	        60
                    ,	south__togglerLength_open: 	        60
                    ,	south__togglerContent_closed:          'Timeline'
                    ,	south__togglerContent_open:          'Timeline'
                    ,	south__togglerAlign_closed:	     'left'
                    ,	south__togglerAlign_open:	     'left'
                    }
            }
    });
}


