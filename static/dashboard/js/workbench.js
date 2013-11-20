$.widget("vis.visworkbench", $.vis.viscontainer, {
    options: {
    },
    _create: function() {
        if (!this.element.find(".ui-layout-north").length) {
            var layout = "";
            layout += '<div class="ui-layout-north"></div>';
            layout += '<div class="ui-layout-center">';
            layout += '<textarea></textarea>';
            layout += '</div>';
            $(layout).appendTo(this.element);
        }
        var layout_settings = {
            zIndex:	    0,		
            resizeWithWindow:	false,	// resizes with the dialog, not the window
            spacing_open:	6,
            spacing_closed:	6,
            north__size:	'30%', 
            north__minSize:	100, 
            north__maxSize:	300, 
        };
        this.element.layout(layout_settings);
        this.element.find(".ui-layout-center>textarea").jqte();
        this.element.addClass("visworkbench");
        this._super("_create");
    },
    destroy: function() {
        this.element.remove();
        this._super("_destroy");
    },
});

SIIL.Workbench = function(div) {
    $( ".accordion" ).accordion({
            collapsible: true,
            header: "> div > div.accordion-header"
        }).sortable({
            axis: "y",
            handle: "h3",
            stop: function( event, ui ) {
              // IE doesn't register the blur when sorting
              // so trigger focusout handlers to remove .ui-state-focus
              ui.item.children( "h3" ).triggerHandler( "focusout" );
            }
        });
    $(".rich_editor").jqte();

    $(document).contextmenu({
        delegate: ".jqte_editor",
        menu: "#contextmenu",
        select: function(event, ui) {
            markText('blockquote', ui.cmd);
        }
    });

    // get the selected text as plain format
    function selectionGet()
    {
            // for webkit, mozilla, opera
            if (window.getSelection)
                    return window.getSelection();
            // for ie
            else if (document.selection && document.selection.createRange && document.selection.type != "None")
                    return document.selection.createRange();
    }

    function markText(tag, classvalue) {
        if (window.getSelection)
        {
                var selObj = selectionGet(), selRange, newElement, documentFragment;
                
                if (selObj.anchorNode && selObj.getRangeAt)
                {
                        selRange = selObj.getRangeAt(0);
                        
                        // create to new element
                        newElement = document.createElement(tag);
                        
                        // add the attribute to the new element
                        $(newElement).removeClass();
                        $(newElement).addClass(classvalue);
                        
                        // extract to the selected text
                        documentFragment = selRange.extractContents();

                        
                        // add the contents to the new element
                        newElement.appendChild(documentFragment);
                        
                        selRange.insertNode(newElement);
                        selObj.removeAllRanges();
                        
                        // if the attribute is "style", change styles to around tags
//				if(tAttr=="style")
//					affectStyleAround($(newElement),tVal);
//				// for other attributes
//				else
//					affectStyleAround($(newElement),false);
                }
        }
        // for ie
        else if (document.selection && document.selection.createRange && document.selection.type != "None")
        {
                var range = document.selection.createRange();
                var selectedText = range.htmlText;
                
                var newText = '<'+tTag+' '+tAttr+'="'+tVal+'">'+selectedText+'</'+tTag+'>';
                
                document.selection.createRange().pasteHTML(newText);
        }
    }
};

SIIL.Workbench.prototype.destroy = function() {
    $(".jqte").remove();
    $(".inner-center").append("<textarea class='rich_editor'></textarea>");
};
