// $.widget("viz.vizworkbench", $.viz.vizcontainer, {
//     options: {
// 	test: this.test,
//     },
//     _create: function() {
// 	$("<div id='editor'>").appendTo(this.element);
// 	var editor = CKEDITOR.appendTo( 'editor', {}, "" );
// 	$("<textarea class='ckeditor' id='testtest'></textarea>").appendTo(this.element);
// 	var $ele = this.element;
// 	$.get("/workbench/pirs", function(data) {
//             var layout = "";
// 	    layout += '<form role="form"><input class="form-control" id="pir-search" placeholder="Search"></form>';
// 	    layout += '<div id="pir-list" class="panel-group"></div>';
//             $(layout).appendTo($ele);
// 	    for (var i = 0, len = data.length; i < len; i ++) {
// 		var pirlist = "";
// 		var pir = data[i];
// 		var pir_content = pir.pir;
// 		var pir_iw	= pir.iw;
// 		var pir_note	= pir.note;
// 		pirlist += '<div class="panel panel-default">';
// 		pirlist += '<div class="panel-heading">';
// 		pirlist += '<h4 class="panel-title">';
// 		pirlist += '<a data-toggle="collapse" data-parent="#pir-list" href="#pir-'+pir_content.id+'">';
// 		pirlist += pir_content.name;
// 		pirlist += '</a></h4></div>';
// 		pirlist += '<div id="pir-' + pir_content.id + '" ' + ' class="panel-collapse collapse">';
// 		pirlist += '<div class="panel-body">';
// 		pirlist += '<div class="iw-section">';
// 		pirlist += "<ul>";
// 		for (var j = 0, ll = pir_iw.length; j < ll; j++) {
// 		    var iw = pir_iw[j];
// 		    pirlist += "<li style='display:inline-block'>";
// 		    pirlist += "<code class='pir-iw'>" + iw + "</code>";
// 		}
// 		pirlist += "</ul>";
// 		pirlist += "</div>";
// 		pir_note.content = pir_note.content ? pir_note.content:"";
// 		pirlist += "<div id='pir-" + pir_content.id + "-note'>" + "</div>";
// 		pirlist += '</div></div></div>';
//
// 		$(pirlist).appendTo("#pir-list");
// 	    }
// 	    $("#pir-list").on('show.bs.collapse', function(eve) {
// 		var pir_id = $(eve.target).attr("id").split("-")[1];
// 		var request_url = '/workbench/pir/'+pir_id+'/note';
// 		$.get(request_url, function(data) {
// 		    var editor = CKEDITOR.appendTo('pir-'+pir_id+'-note', {}, data.content);
// 		});
// 	    });
// 	    $("#pir-list").on('show.bs.collapse', function(eve) {
// 		var pir_id = $(eve.target).attr("id").split("-")[1];
// 		// destroy CKEDITOR
//
// 	    });
// 	});
//
//
//
//         this.element.addClass("visworkbench");
//         this._super("_create");
//     },
//
//     _saveNote: function() {
//     },
//
//     destroy: function() {
//         this.element.remove();
//         this._super("_destroy");
//     },
// });

$.widget("viz.viznotepad", $.viz.vizbase, {
    _create: function() {
        this.options.extend.maximize = this.resize.bind(this);
        this.options.extend.restore = this.resize.bind(this);
        this.options.base.resizeStop = this.resize.bind(this);
        this.options.base.dragStop = this.resize.bind(this);
        this._super("_create");
        this.element.addClass("viznotepad");
        this.element.data("viz", "vizViznotepad");
        var height = this.element.height();

        var textarea = this.element.append('<textarea id="editor1" name="editor1" style="width:100%; height: 100%;">');

        var getContent = this.getContent.bind(this);
        CKEDITOR.config.height = height - 104; // the height refers to the height of the editing area, thus set it to the height of the container - the height of the toolbar and the bottom bar

        this.editor = CKEDITOR.replace('editor1', {
            on: {
                'instanceReady': function(evt) {
                    getContent();
                }
            },
        });
        setInterval(this.saveContent.bind(this), 5000);
    },

    resize: function() {
        var height = this.element.height();
        this.editor.resize('99%', height-10, false);
    },

    update: function() {
        // in accordance with other artifacts, useless here
    },

    updateData: function() {
        // in accordance with other artifacts, useless here

    },

    getContent: function() {
        var _this = this;
        $.get('notepad/note', function(res) {
            _this.editor.setData(res.content);
            _this.id = res.id;
        });
    },

    saveContent: function() {
        if (this.editor.checkDirty()) {
            var content = this.editor.getData();
            var _this = this;
            $.post('notepad/note', {content: content, id: this.id}, function() {
                // show message in the bottom bar
                _this.showMessage.bind(_this)('auto saved');
            });
            this.editor.resetDirty();
        }
    },

    showMessage: function(msg) {
        $('<span class="custom_message">' + msg + '</span>').appendTo(this.element.find('.cke_bottom'))
            .css({
                float: 'right',
                'margin-right': '20px'
            })
        ;
        setTimeout(this.hideMessage.bind(this), 3000);
    },

    hideMessage: function() {
        this.element.find('.cke_bottom span.custom_message').empty();
    }
});
