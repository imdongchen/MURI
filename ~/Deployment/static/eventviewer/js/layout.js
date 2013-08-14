$(document).ready(function () {
    doLayout();
});


function doLayout() {
    // OUTER-LAYOUT
    $('body').layout({
        center__paneSelector:	        ".outer-center"
    ,	west__paneSelector:		".outer-west"
    ,	east__paneSelector:		".outer-east"
    ,	west__size:				500
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
                center__paneSelector:	        ".middle-center"
            ,	spacing_open:			8  // ALL panes
            ,	spacing_closed:			12 // ALL panes

                    // INNER-LAYOUT (child of middle-center-pane)
            ,	center__childOptions: {
                        center__paneSelector:	        ".inner-center"
                    ,	spacing_closed:			20  // ALL panes
                    ,	spacing_open:			20  // ALL panes
                    ,	south__size:			150  // ALL panes
                    ,	south__initClosed:             true
                    ,	south__togglerLength_closed: 	        120
                    ,	south__togglerLength_open: 	        120
                    ,	south__togglerContent_closed:           'Timeline'
                    ,	south__togglerContent_open:             'Timeline'
                    ,	south__togglerAlign_closed:	        'left'
                    ,	south__togglerAlign_open:	        'left'
                    }
            }
    });
}


