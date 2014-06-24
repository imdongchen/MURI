// widget used for tag attribute
$.widget('custom.attribute_widget', {
    options: {

    },
    _create: function() {
        // receive <ul>
        var wrap = '<ul class="annotator-attributes"></ul>';
        this.element.addClass('annotator-attribute-widget')
        this.content = $(wrap).appendTo(this.element);
        this.add();

    },
    add: function(attr, value) {
        var row = '<li><ul class="annotator-attribute">\
            <li><input class="annotator-attribute-input" placeholder="Attribute..."/></li> \
            <li><input class="annotator-attribute-value" placeholder="Unknown"/></li> \
        ';
        row += '<li><button type="button" class="btn btn-default attribute-add-btn"><span class="glyphicon glyphicon-plus"></span></button></li></ul></li>';
            this.content.append($(row));
            var beforelastrow = this.content.find('.annotator-attribute').eq(-2);
            beforelastrow.find('.annotator-attribute-input').val(attr);
            beforelastrow.find('.annotator-attribute-value').val(value);
            beforelastrow.find('button').removeClass('attribute-add-btn').addClass('attribute-remove-btn').off('click')
                .find("span").removeClass('glyphicon-plus').addClass('glyphicon-minus');

        this.content.find('.attribute-add-btn').click(_.bind(function(){
            var lastrow = this.content.find(".annotator-attribute:last");
            lastrow.find('button').removeClass('attribute-add-btn').addClass('attribute-remove-btn').off('click')
                .find("span").removeClass('glyphicon-plus').addClass('glyphicon-minus');
            this.add();
        }, this));
        this.content.find('.attribute-remove-btn').click(function() {
            $(this).parents('.annotator-attribute').parent().remove();
        });
        this.sort();
    },
    reset: function() {
        this.element.empty();
        this._create();
    },
    sort: function() {
        $('> li', this.content).sort(function(a, b) {
            var a_val = $(a).find('.annotator-attribute-value').val();
            var b_val = $(b).find('.annotator-attribute-value').val();
            return a_val < b_val;
        }).appendTo(this.content);
    },
    serialize: function() {
        var res = {};
        $('> li', this.content).each(function(i, row) {
            var attr = $(row).find('.annotator-attribute-input').val();
            var value = $(row).find('.annotator-attribute-value').val();
            if (attr && value) {
                attr = Annotator.Util.escape(attr);
                value = Annotator.Util.escape(value);
                res[attr] = value;
            }
        });
        return res;
    }
});

var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator.Plugin.Tags = (function(_super) {
    __extends(Tags, _super);

    function Tags() {
        this.setAnnotationTags = __bind(this.setAnnotationTags, this);
        this.updateField = __bind(this.updateField, this);
        this.initTagField = __bind(this.initTagField, this);
        this.updateTagField = __bind(this.updateTagField, this);
        this.initAttrField = __bind(this.initAttrField, this);
        this.updateAttrField = __bind(this.updateAttrField, this);
        this.setTagAttributes = __bind(this.setTagAttributes, this);
        this.applyToAll = __bind(this.applyToAll, this);
        _ref = Tags.__super__.constructor.apply(this, arguments);
        return _ref;
    }

    Tags.prototype.options = {
        parseTags: function(tags) {
            if (tags && tags.length > 0) {
                return $.map(tags, function(tag){
                    return {'primary': {entity_type: tag}, 'other': {}};
                })
            }
            return [];
        },
        stringifyTags: function(array) { //array of tag objects
            return $.map(array, function(tag) {
                return tag.entity;
            }).join(" ")
        }
    };

    Tags.prototype.field = null;
    Tags.prototype.attrField = null;

    Tags.prototype.input = null;

    Tags.prototype.pluginInit = function() {
        var self = this;

        if (!Annotator.supported()) {
            return;
        }
        this.titleField = this.annotator.editor.addField({
            type: 'custom',
            html_content: '<label>Name: </label><input class="tag_name"></input>',
            load: this.updateTitleField
        });
        this.tagField = this.annotator.editor.addField({
            type: 'custom',
            html_content: '<select class="selectize-entity" multiple />',
            init: this.initTagField,
            load: this.updateTagField,
            submit: this.setAnnotationTags
        });
        this.attrField = this.annotator.editor.addField({
            type: 'custom',
            html_content: '<div>\n    <p class="annotator-title">Entity attributes</p>\n\n</div>',
            init: this.initAttrField,
            load: this.updateAttrField,
            submit: this.setTagAttributes
        });
        this.applyAllField = this.annotator.editor.addField({
            type: 'checkbox',
            label: Annotator._t('Apply to all data'),
            load: this.updateApplyAllField,
            submit: this.applyToAll
        });

        this.subscribe('/tag/changed', function(value) {
            if (value && value.indexOf('location') > -1) {
                if (self.annotation) {
                    // search for mgrs string and update attribute
                    var node = self.annotation.highlights[0].parentNode;
                    if (!node) {
                        console.log(annotation)
                    }
                    var latlon = [];
                    if (!$(node).data('location')) {
                        var text = node.innerText;
                        var mgrs = text.match(/\/\/MGRSCOORD:([0-9A-Za-z ]+)\/\//)
                        if (mgrs) {
                            USNGtoLL(mgrs[1], latlon); // function from usng.js
                            $(node).data("location", latlon);
                        }
                    }
                    latlon = $(node).data('location');
                    if (latlon && latlon.length === 2 ) {
                        if (!self.annotation.tags) self.annotation.tags = [];
                        var existed = false;
                        for (var i = 0; i < self.annotation.tags.length; i++) {
                            var tag = self.annotation.tags[i];
                            if (tag.primary.entity_type === 'location') {
                                if (! tag.temporary.geometry) {
                                    tag.temporary.geometry = latlon.toString();
                                    tag.primary.geometry = latlon.toString();
                                }
                                existed = true;
                                break;
                            }
                        }
                        if (! existed) {
                            self.annotation.tags.push({
                                primary: { entity_type: 'location', geometry: latlon.toString() },
                                other: {},
                                temporary: { geometry: latlon.toString() }
                            });
                        }
                        self.updateAttrField(self.attrField, self.annotation);
                    }
                }
            }
        });

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

    Tags.prototype.parseTags = function(tags) {
        return this.options.parseTags(tags);
    };

    Tags.prototype.stringifyTags = function(array) {
        return this.options.stringifyTags(array);
    };

    Tags.prototype.capitalizeFirstLetter = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    Tags.prototype.updateTitleField = function(field, annotation) {
        $(field).find('input.tag_name').val(annotation.quote);
    };

    Tags.prototype.initTagField = function(field) {
        var self = this;
        this.tagselect = $(field).find('.selectize-entity')
            .selectize({
                maxItems: null,
                valueField: 'value',
                labelField: 'title',
                searchField: 'title',
                create: false,
                options: [
                    {value: 'person', title: 'Person'},
                    {value: 'organization', title: 'Organization'},
                    {value: 'resource', title: 'Resource'},
                    {value: 'location', title: 'Location'},
                    {value: 'event', title: 'Event'}
                ],
                placeholder: 'Select an entity...',
                create: false,
                onChange: function(value) {
                    self.publish('/tag/changed', [value]);
                }
            }
        );
    };

    Tags.prototype.updateTagField = function(field, annotation) {
        this.annotation = annotation;

        var selectize = this.tagselect[0].selectize;
        selectize.clear();
        if (annotation.tags) {
            var items = annotation.tags.map(function(t) {return t.primary.entity_type; });
            for (var i = 0; i < items.length; i++) {
                selectize.addItem(items[i]);
            }
        }
    };


    Tags.prototype.initAttrField = function(field, annotation) {
        var $content = $($(field).children()[0])
        $content.append($('<div>').attribute_widget());
    };

    Tags.prototype.updateAttrField = function(field, annotation) {
        this.attribute_widget = $(field).find('.annotator-attribute-widget').data('customAttribute_widget');
        this.attribute_widget.reset();
        if (annotation.tags) {
            for (var i = 0; i < annotation.tags.length; i++) {
                var tag = annotation.tags[i];
                for (var attr in tag.primary) {
                    if (attr !== 'entity_type' && attr !== 'id') { // skip these two attributes
                        this.attribute_widget.add(attr, tag.primary[attr]);
                    }
                }
                for (var attr in tag.other) {
                    this.attribute_widget.add(attr, tag.other[attr]);
                }
            }
        }
    };

    Tags.prototype.setAnnotationTags = function(field, annotation) {
        if (! annotation.tags) {
            annotation.tags = [];
        }
        var tags = this.parseTags($(field).find('.selectize-entity').val());

        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            var doesExist = false;
            for (var j = 0; j < annotation.tags.length; j++) {
                if (annotation.tags[j].primary.entity_type === tag.primary.entity_type) {
                    doesExist = true;
                    break;
                }
            }
            if (! doesExist) {
                annotation.tags.push(tag);
            }
        }
    };

    Tags.prototype.setTagAttributes = function(field, annotation) {
        if (annotation.tags) {
            for (var i = 0; i < annotation.tags.length; i ++) {
                var tag = annotation.tags[i];
                attribute = this.attribute_widget.serialize();
                for (var attr in tag.primary) {
                    if (attr !== 'entity_type' && attr !== 'id' && attribute[attr] === undefined) {
                        delete tag.primary[attr]; // delete attributes not in the form
                    }
                }
                for (var attr in tag.other) {
                    if (attribute[attr] === undefined) {
                        delete tag.other[attr]; // delete attributes not in the form
                    }
                }
                tag.temporary = $.extend({}, attribute);
            }
        }
    };

    Tags.prototype.updateApplyAllField = function(field, annotation) {

    };

    Tags.prototype.applyToAll = function(field, annotation) {
        if ($(field).find(':checkbox').prop('checked')) {
            // Let annotator to deal with it
            this.publish('/annotation/applyall', [annotation]);
        }

    };

    Tags.prototype.updateViewer = function(field, annotation) {
        field = $(field);
        if (annotation.tags && $.isArray(annotation.tags) && annotation.tags.length) {
            return field.addClass('annotator-tags').html(function() {
                var string;
                return string = $.map(annotation.tags, function(tag) {
                    return '<span class="annotator-tag annotator-hl-' + tag.primary.entity_type + '">' + Annotator.Util.escape(tag.primary.entity_type) + '</span>';
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
