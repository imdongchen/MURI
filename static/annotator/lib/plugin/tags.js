// Generated by CoffeeScript 1.6.3
var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator.Plugin.Tags = (function(_super) {
    __extends(Tags, _super);

    function Tags() {
        this.setAnnotationTags = __bind(this.setAnnotationTags, this);
        this.updateField = __bind(this.updateField, this);
        this.updateSelectField = __bind(this.updateSelectField, this);
        _ref = Tags.__super__.constructor.apply(this, arguments);
        return _ref;
    }

    Tags.prototype.options = {
        parseTags: function(string) {
            var tags;
            string = $.trim(string);
            tags = [];
            if (string) {
                tags = string.split(', ');
            }
            return $.map(tags, function(tag){
                return {'entity': tag};
            })
        },
        stringifyTags: function(array) {
            return array.join(" ");
        }
    };

    Tags.prototype.field = null;

    Tags.prototype.input = null;

    Tags.prototype.pluginInit = function() {
        if (!Annotator.supported()) {
            return;
        }
        this.field = this.annotator.editor.addField({
            label: Annotator._t('Add some tags here') + '\u2026',
            load: this.updateField,
            submit: this.setAnnotationTags
        });
        this.annotator.editor.addField({
            type: 'select',
            load: this.updateSelectField,
        })
        this.annotator.viewer.addField({
            load: this.updateViewer
        });
        if (this.annotator.plugins.Filter) {
            this.annotator.plugins.Filter.addFilter({
                label: Annotator._t('Tag'),
                property: 'tags',
                isFiltered: Annotator.Plugin.Tags.filterCallback
            });
        }
        return this.input = $(this.field).find(':input');
    };

    Tags.prototype.parseTags = function(string) {
        return this.options.parseTags(string);
    };

    Tags.prototype.stringifyTags = function(array) {
        return this.options.stringifyTags(array);
    };

    Tags.prototype.updateField = function(field, annotation) {
        var value;
        value = '';
        if (annotation.tags) {
            value = this.stringifyTags(annotation.tags);
        }
        return this.input.val(value);
    };

    Tags.prototype.updateSelectField = function(field, annotation) {
        var options = '<option disabled selected>Choose a tag...</option><option value="event">Event</option>\n<option value="person">Person</option>\n<option value="resource">Resource</option>\n<option value="location">Location</option>\n<option value="organization">Organization</option>\n        '
        var $select = $(field).find('select');
        $select.html(options);
        var $input = this.input;
        $select.off("change")
        $select.change(function(){
            var value = $(this).find('option:selected').val();
            if ($input.val() === '') {
                $input.val(value)
            } else {
                $input.val($input.val()+ ', ' +value);
            }
        });
    }

    Tags.prototype.setAnnotationTags = function(field, annotation) {
        return annotation.tags = this.parseTags(this.input.val());
    };

    Tags.prototype.updateViewer = function(field, annotation) {
        field = $(field);
        if (annotation.tags && $.isArray(annotation.tags) && annotation.tags.length) {
            return field.addClass('annotator-tags').html(function() {
                var string;
                return string = $.map(annotation.tags, function(tag) {
                    return '<span class="annotator-tag annotator-hl-' + tag['entity'] + '">' + Annotator.Util.escape(tag['entity']) + '</span>';
                }).join(' ');
            });
        } else {
            return field.remove();
        }
    };

    return Tags;

})(Annotator.Plugin);

Annotator.Plugin.Tags.filterCallback = function(input, tags) {
    var keyword, keywords, matches, tag, _i, _j, _len, _len1;
    if (tags == null) {
        tags = [];
    }
    matches = 0;
    keywords = [];
    if (input) {
        keywords = input.split(/\s+/g);
        for (_i = 0, _len = keywords.length; _i < _len; _i++) {
            keyword = keywords[_i];
            if (tags.length) {
                for (_j = 0, _len1 = tags.length; _j < _len1; _j++) {
                    tag = tags[_j];
                    if (tag.indexOf(keyword) !== -1) {
                        matches += 1;
                    }
                }
            }
        }
    }
    return matches === keywords.length;
};

/*
 //@ sourceMappingURL=tags.map
 */
