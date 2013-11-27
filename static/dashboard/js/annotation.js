(function() {
    var _ref,
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  
    Annotator.Plugin.VizAnnotation = (function(_super) {
        __extends(VizAnnotation, _super);
    
        function VizAnnotation() {
            this.setAnnotations = __bind(this.setAnnotations, this);
            this.updateSelectField = __bind(this.updateSelectField, this);
            this.updateTagField = __bind(this.updateTagField, this);
            _ref = VizAnnotation.__super__.constructor.apply(this, arguments);
            return _ref;
	}
	VizAnnotation.prototype.options = {
          parseAnnotations: function(string) {
            var tags;
            string = $.trim(string);
            tags = [];
            if (string) {
              tags = string.split(';');
            }
            return tags;
          },
	  stringifyMyTags: function(array) {
	    return array.join(" ");
	  }
	};

	VizAnnotation.prototype.selectField = null;

	VizAnnotation.prototype.tagField = null;
	VizAnnotation.prototype.tagSelection = null;
	VizAnnotation.prototype.tagDisplay = null;

	VizAnnotation.prototype.pluginInit = function() {
	  if (!Annotator.supported()) {
	    return;
	  }
	  var _this = this;
	  this.tagField = this.annotator.editor.addField({
	      label: 'Tags here ...',
  	      type:  'input',
  	      load: _this.updateTagField,
              submit: this.setAnnotations,
	  });
	  this.selectField = this.annotator.editor.addField({
  	      type:  'select',
  	      load: _this.updateSelectField,
	  });
	  this.annotator.viewer.addField({
	    load: _this.updateViewer
	  });
    //    if (this.annotator.plugins.Filter) {
    //      this.annotator.plugins.Filter.addFilter({
    //        label: Annotator._t('Tag'),
    //        property: 'tags',
    //        isFiltered: Annotator.Plugin.MyTags.filterCallback
    //      });
    //    }
	  this.tagDisplay   = $(this.tagField).find(':input').attr('readonly', true);
	  this.tagSelection = $(this.selectField).find('select');
	  return;
	};

	VizAnnotation.prototype.updateSelectField = function(field, annotation) {
	    this.tagSelection.empty();
	  var tags = ['Person', 'Organization', 'Event', 'Resource', 'Location'];
	  var tagOptions = $.map(tags, function(tag, i) {
	      return '<option value=' + tag + '>' + tag + '</option>';
	  }).join(' ');
	  this.tagSelection.append(tagOptions);
	  var _this = this;
	  this.tagSelection.change(function() {
	      if (_this.tagDisplay.val() === '') {
		  _this.tagDisplay.val($(this).val());
	      } else {
		  _this.tagDisplay.val(_this.tagDisplay.val() + '; ' + $(this).val());
	      }
	  });
	};
	VizAnnotation.prototype.updateTagField = function(field, annotation) {
	  var value;
	  value = '';
	  value = this.stringifyMyTags([]);
	  if (annotation.annotations) {
	    value = this.stringifyMyTags(annotation.tags);
	  }
	  this.tagDisplay.val(value);
	  $(this.tagField).prev().remove();
	};

	VizAnnotation.prototype.setAnnotations = function(field, annotation) {
	    var anchor = this.annotator.selectedRanges[0].commonAncestor;
	    var msg_id = $(anchor).parent().find(":first").html();
            annotation.annotations = this.options.parseAnnotations(this.tagDisplay.val());
	    annotation.anchor_id = msg_id;
	};

	VizAnnotation.prototype.updateViewer = function(field, annotation) {
	  field = $(field);
	  if (annotation.tags && $.isArray(annotation.tags) && annotation.tags.length) {
	    return field.addClass('annotator-tags').html(function() {
	      var string;
	      return string = $.map(annotation.tags, function(tag) {
		return '<span class="annotator-tag">' + Annotator.Util.escape(tag) + '</span>';
	      }).join(' ');
	    });
	  } else {
	    return field.remove();
	  }
	};

	VizAnnotation.prototype.getElementByXpath = function(xpath) {
	    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	};

	VizAnnotation.prototype.stringifyMyTags = function(array) {
	  return this.options.stringifyMyTags(array);
	};

	return VizAnnotation;

    })(Annotator.Plugin);
}).call(this);



// Annotator.Plugin.HelloWorld = function (element) {
//     var plugin = {};
//     plugin.pluginInit = function () {
// 	this.field = this.annotator.editor.addField({
// 	    label: Annotator._t('Add some tags here') + '\u2026',
// 	    load: this.updateField,
// 	});
// 	MyTags.prototype.updateField = function(field, annotation) {
// 	    var value;
// 	    value = '';
// 	    if (annotation.tags) {
// 	      value = this.stringifyMyTags(annotation.tags);
// 	    }
// 	    return this.input.val(value);
// 	};
//     };
//     // Create your plugin here. Then return it.
//     return plugin;
// };
