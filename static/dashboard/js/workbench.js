$.widget("viz.vizworkbench", $.viz.vizcontainer, {
    options: {
	test: this.test,
    },
    _create: function() {
	$("<div id='editor'>").appendTo(this.element);
	var editor = CKEDITOR.appendTo( 'editor', {}, "" );
	$("<textarea class='ckeditor' id='testtest'></textarea>").appendTo(this.element);
	var $ele = this.element;
	$.get("/workbench/pirs", function(data) {
            var layout = "";
	    layout += '<form role="form"><input class="form-control" id="pir-search" placeholder="Search"></form>';
	    layout += '<div id="pir-list" class="panel-group"></div>';
            $(layout).appendTo($ele);
	    for (var i = 0, len = data.length; i < len; i ++) {
		var pirlist = "";
		var pir = data[i];
		var pir_content = pir.pir;
		var pir_iw	= pir.iw;
		var pir_note	= pir.note;
		pirlist += '<div class="panel panel-default">';
		pirlist += '<div class="panel-heading">';
		pirlist += '<h4 class="panel-title">';
		pirlist += '<a data-toggle="collapse" data-parent="#pir-list" href="#pir-'+pir_content.id+'">';
		pirlist += pir_content.name;
		pirlist += '</a></h4></div>';
		pirlist += '<div id="pir-' + pir_content.id + '" ' + ' class="panel-collapse collapse">';
		pirlist += '<div class="panel-body">';
		pirlist += '<div class="iw-section">';
		pirlist += "<ul>";
		for (var j = 0, ll = pir_iw.length; j < ll; j++) {
		    var iw = pir_iw[j];
		    pirlist += "<li style='display:inline-block'>";
		    pirlist += "<code class='pir-iw'>" + iw + "</code>";
		}
		pirlist += "</ul>";
		pirlist += "</div>";
		pir_note.content = pir_note.content ? pir_note.content:"";
		pirlist += "<div id='pir-" + pir_content.id + "-note'>" + "</div>";
		pirlist += '</div></div></div>';

		$(pirlist).appendTo("#pir-list");
	    }
	    $("#pir-list").on('show.bs.collapse', function(eve) {
		var pir_id = $(eve.target).attr("id").split("-")[1];
		var request_url = '/workbench/pir/'+pir_id+'/note';
		$.get(request_url, function(data) {
		    var editor = CKEDITOR.appendTo('pir-'+pir_id+'-note', {}, data.content);
		});
	    });
	    $("#pir-list").on('show.bs.collapse', function(eve) {
		var pir_id = $(eve.target).attr("id").split("-")[1];
		// destroy CKEDITOR

	    });
	});



        this.element.addClass("visworkbench");
        this._super("_create");
    },

    _saveNote: function() {
    },

    destroy: function() {
        this.element.remove();
        this._super("_destroy");
    },
});
