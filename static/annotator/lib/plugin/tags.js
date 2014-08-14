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
    add: function(attr, value, primary) { // if it is primary, the row cannot be deleted
        attr = attr || '';
        value  = value || '';
        primary = primary || 'other';

        var row = '<li><ul class="annotator-attribute annotator-attribute-' + primary + '">';
        row += '<li><input class="annotator-attribute-input" placeholder="Attribute..." value="' + attr + '"/></li>';
        row += '<li><input class="annotator-attribute-value" placeholder="Unknown" value="' + value + '"/></li>';

        var lastrow = this.content.find('.annotator-attribute:last');
        if (lastrow.length) { // if there is already an attribute row
            row += '<li><button type="button" class="btn btn-default attribute-remove-btn"><span class="glyphicon glyphicon-minus"></span></button></li></ul></li>';
            var $row = $(row).insertBefore(lastrow.parent()); // lastrow is <ul>, lastrow's parent is <li>
            $row.find('.attribute-remove-btn').click(function() {
                var row = $(this).parents('.annotator-attribute');
                if (row.hasClass('annotator-attribute-primary')) {
                    row.find('.annotator-attribute-value').val('');
                } else {
                    row.parent().remove();
                }
            });
        } else { // if it is the first attribute row
            row += '<li><button type="button" class="btn btn-default attribute-add-btn"><span class="glyphicon glyphicon-plus"></span></button></li></ul></li>';
            var $row = $(row).appendTo(this.content);
            $row.find('.attribute-add-btn').click(_.bind(function(){
                var lastrow = this.content.find(".annotator-attribute:last");
                lastrow.find('button').removeClass('attribute-add-btn').addClass('attribute-remove-btn').off('click')
                    .find("span").removeClass('glyphicon-plus').addClass('glyphicon-minus');
                this.add();
            }, this));
        }

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
            if (attr) {
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
        this.initTagNameField = __bind(this.initTagNameField, this);
        this.setAnnotationTag = __bind(this.setAnnotationTag, this);
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
        parseTags: function(tag) {
            if (tag) {
                return {entity_type: tag}
            }
            return {};
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
            html_content: '<label style="font-weight:bold;">Name: </label><input class="tag_name"></input>',
            init: this.initTagNameField,
            load: this.updateTitleField,
            submit: this.setTagName
        });
        this.tagField = this.annotator.editor.addField({
            type: 'custom',
            html_content: '<select class="selectize-entity"/>',
            init: this.initTagField,
            load: this.updateTagField,
            submit: this.setAnnotationTag
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
            submit: this.applyToAll
        });

        this.subscribe('/tag/type/change', function(value) {
            if (value === 'location') {
                if (self.annotation) {
                    // search for mgrs string and update attribute
                    var node = self.annotation.highlights[0].parentNode;
                    if (!node) {
                        console.warn(annotation);
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
                    if (latlon && latlon.length === 2) {
                        self.attribute_widget.add('geometry', 'POINT(' + latlon[1] + ' ' + latlon[0] +')');
                    }
                }
            }
        });

        $.subscribe('/tag/name/change', function(e, value) {
            var entity = wb.store.entity[value];
            if (!self.annotation.tag) {
                self.annotation.tag = {};
            }
            self.annotation.tag.id = entity.primary.id;
            self.annotation.tag.entity_type = entity.primary.entity_type;
            self.annotation.tag.name = entity.primary.name;
            self.updateTagField('', self.annotation);
            self.updateAttrField('', self.annotation);
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

    Tags.prototype.initTagNameField = function(field) {
        var opts = [];
        for (var key in wb.store.entity) {
            var entity = wb.store.entity[key];
            opts.push({
                id: key,
                value: entity.primary.name
            });
        }
        optgroups = wb.ENTITY_ENUM.map(function(entity) {
            return {value: entity, label: wb.utility.capitalizeFirstLetter(entity)};
        });
        this.tagnameselect = $(field).find('.tag_name')
            .autocomplete({
                source: opts,
                select: function(e, ui) {
                    if (ui.item.id) {
                        //TODO: update the attribute list to the attribute of the entity
                        $.publish('/tag/name/change', ui.item.id);
                    }
                }
            })
        ;

        // update autocomplete when new entity is added
        $.subscribe('/entity/change', function() {
            var opts = [];
            for (var key in wb.store.entity) {
                var entity = wb.store.entity[key];
                opts.push({
                    id: key,
                    value: entity.primary.name
                });
            }
            $(field).find('.tag_name').autocomplete('option', 'source', opts);
        });
    };

    Tags.prototype.updateTitleField = function(field, annotation) {
        // selectize = this.tagnameselect[0].selectize;
        // selectize.clear();
        var name;
        if (annotation.tag) {
            var entity = wb.store.entity[annotation.tag.id]
            name = entity.primary.name;
        } else {
            name = annotation.quote;
        }
        // selectize.addItem(name);
        $(field).find('.tag_name').val(name);
    };

    Tags.prototype.initTagField = function(field) {
        var self = this;
        this.tagselect = $(field).find('.selectize-entity')
            .selectize({
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
                placeholder: 'Tag as an entity...',
                create: false,
                onChange: function(value) {
                    self.publish('/tag/type/change', [value]);
                }
            }
        );
    };

    Tags.prototype.updateTagField = function(field, annotation) {
        this.annotation = annotation;

        var selectize = this.tagselect[0].selectize;
        selectize.clear();
        if (annotation.tag && annotation.tag.entity_type) {
            selectize.addItem(annotation.tag.entity_type);
        }
    };


    Tags.prototype.initAttrField = function(field, annotation) {
        var $content = $($(field).children()[0]);
        $content.append('<div>');
        this.attribute_widget = $content.find('div').attribute_widget().data('customAttribute_widget');
    };

    Tags.prototype.updateAttrField = function(field, annotation) {
        // this.attribute_widget = $(field).find('.annotator-attribute-widget').data('customAttribute_widget');
        this.attribute_widget.reset();
        if (annotation.tag && annotation.tag.id) {
            var entity = wb.store.entity[annotation.tag.id];
            for (var attr in entity.primary) {
                if (attr !== 'entity_type' && attr !== 'id' && attr !== 'name' && attr !== 'created_at' && attr !== 'created_by') { // skip these two attributes
                    this.attribute_widget.add(attr, entity.primary[attr], 'primary');
                }
            }
            for (var attr in entity.other) {
                this.attribute_widget.add(attr, entity.other[attr], 'other');
            }
        }
    };

    Tags.prototype.setTagName = function(field, annotation) {
        if (! annotation.tag) {
            annotation.tag = {};
        }
        var name = $(field).find('.tag_name').val();
        if (name) {
            annotation.tag.name = name;
        } else {
            alert ('Entity name is required!'); // TODO: more elegant form validation
        }
    },

    Tags.prototype.setAnnotationTag = function(field, annotation) {
        if (! annotation.tag) {
            annotation.tag = {};
        }
        var entity_type = $(field).find('.selectize-entity').val();
        if (entity_type) {
            annotation.tag.entity_type = entity_type;
        } else {
            alert ('Entity type is required!'); // TODO: more elegant form validation
        }
    };

    Tags.prototype.setTagAttributes = function(field, annotation) {
        if (annotation.tag) {
            var attribute = this.attribute_widget.serialize();
            annotation.tag.attribute = $.extend({}, attribute);
        }
    };

    Tags.prototype.applyToAll = function(field, annotation) {
        if ($(field).find(':checkbox').prop('checked')) {
            // Let annotator to deal with it
            this.publish('/annotation/applyall', [annotation]);
        }

    };

    Tags.prototype.updateViewer = function(field, annotation) {
        if (annotation.tag) {
            var table = '<table id="annotator-viewer-table">';
            var entity = wb.store.entity[annotation.tag.id];
            var primary = entity.primary;
            table += '<tr><th>' + wb.utility.capitalizeFirstLetter(primary.entity_type) + ':</th><td>' + primary.name + '</td></tr>';
            for (var attr in primary) {
                if (attr && attr !== 'id' && attr !== 'entity_type' && attr !== 'name' && primary[attr]) {
                    table += '<tr><th>' + wb.utility.capitalizeFirstLetter(attr) + ':</th><td>' + primary[attr] + '</td></tr>';
                }
            }
            var other = entity.other;
            for (var attr in other) {
                if (attr) {
                    table += '<tr><th>' + wb.utility.capitalizeFirstLetter(attr) + ':</th><td>' + other[attr] + '</td></tr>';
                }
            }
            table += '</table>';
            $(field).append($(table));
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
