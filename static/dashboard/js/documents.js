$.widget('viz.vizdocuments', $.viz.vizbase, {
  options: {

  },

  _create: function() {
    this._super('_create');
    this.element.data('viz', 'vizVizdocuments');

    this._setupUI();
    this.loadData();

    this._setupAnnotator();
  },

  _setupUI: function() {
    var html = '\
      <div class="doc-overview"> \
        <ul class="doc-list"></ul> \
        <div class="dragbar"></div> \
      </div> \
      <div class="doc-view-container"> \
        <div class="doc-view"> \
      </div> \
    ';
    this.element.append(html);

    // resize bar
    var _this = this;
    this.element.find('.dragbar').mousedown(function(e) {
      e.preventDefault();
      $(document).mousemove(function(e) {
        var pos = wb.utility.mousePosition(e, _this.element)
        _this.element.find('.doc-overview').css('height', pos.top);
        _this.element.find('.doc-view-container').css('top', pos.top);
      });

    })
    $(document).mouseup(function(e) {
      $(document).off('mousemove');
    });

    this.element.on('click', '.doc-item', this._onShowDataentry.bind(this));

  },

  loadData: function() {
    for (var id in wb.store.dataentry) {
      var entry = wb.store.dataentry[id];
      this.addDataentry(entry);
    }
  },

  addDataentry: function(entry) {
    var html = '';
    var $list = this.element.find('.doc-list');

    // get the first 100 characters or before line break
    var i = entry.content.indexOf('\n')
    var i = i < 100 ? i : 100;
    // convert html to text, removing tags
    var summary = entry.content.substring(0, i).replace(/<[^>]*>/g, '');;
    if (i < entry.content.length) summary += '...';

    html += '<li class="doc-item">'
            + '<span class="doc-dataset">'
            + wb.store.dataset[entry.dataset].name
            + '</span>'
            + '<span class="doc-name">'
            + (entry.name || summary)
            + '</span>'
            + '<span class="doc-time">'
            + (entry.date || '')
            + '</span>'
    ;
    $(html).appendTo($list).data('dataentry', entry);
  },

  _onShowDataentry: function(e) {
    var $li = $(e.currentTarget);
    $li.parent().children().removeClass('active');
    $li.addClass('active');
    var entry = $li.data('dataentry');
    if (entry) {
      this.showDataentry(entry);
    }

  },

  showDataentry: function(entry) {
    this.element.find('.doc-view')
      .html(entry.content)
      .data('dataentry', entry)
    ;
  },

  update: function() {
  },

  reload: function() {

  },

  _setupAnnotator: function() {
    var ele = this.element.find(".doc-view-container");
    ele.annotator();
    ele.annotator('addPlugin', 'Store', {
      prefix: 'annotation',
    });
    ele.annotator('addPlugin', 'Tags');
  },

  _destroyAnnotator: function() {
      var ele = this.element.find(".doc-view-container");
      if (ele.data("annotator")) {
          ele.annotator("destroy");
      }
  },

  _resetAnnotator: function() {
      this._destroyAnnotator();
      this._setupAnnotator();
  },

  addAnnotations: function(annotations) {
    for (var i = 0, len = annotations.length; i < len; i++) {
      this.addAnnotation(annotations[i]);
    }
  },

  addAnnotation: function(annotation) {
    var ele = this.element.find(".doc-view-container");
    var annotator = ele.data('annotator');
    if (annotator) {
      var store = annotator.plugins['Store'];
      var i = wb.utility.indexOf(annotation, store.annotations);
      if (i < 0) {
        store.registerAnnotation(annotation);
        annotator.setupAnnotation(annotation);
      } else {
        store.updateAnnotation(store.annotations[i], annotation);
      }
    }
  },

  updateAnnotations: function(annotations) {
    for (var i = 0, len = annotations.length; i < len; i++) {
      this.updateAnnotation(annotations[i]);
    }
  },

  updateAnnotation: function(annotation) {
    var ele = this.element.find(".doc-view-container");
    var annotator = ele.data('annotator');
    if (annotator) {
      var store = annotator.plugins['Store'];
      var i = wb.utility.indexOf(annotation, store.annotations);
      if (i < 0) {
        store.registerAnnotation(annotation);
        annotator.setupAnnotation(annotation);
      } else {
        $(store.annotations[i].highlights).removeClass()
            .addClass('annotator-hl annotator-hl-' + annotation.tag.entity_type)
        ;
        store.updateAnnotation(store.annotations[i], annotation);
      }
    }

  },

  deleteAnnotations: function(annotations) {
    for (var i = 0, len = annotations.length; i < len; i++) {
      this.deleteAnnotation(annotations[i]);
    }
  },

  deleteAnnotation: function(annotation) {
    var ele = this.element.find(".doc-view-container");
    var annotator = ele.data('annotator');
    if (annotator) {
      var store = annotator.plugins['Store'];
      var i = wb.utility.indexOf(annotation, store.annotations);
      if (i >= 0) {
        $(store.annotations[i].highlights).removeClass();
        store.unregisterAnnotation(store.annotations[i]);
      }
    }
  },

});
