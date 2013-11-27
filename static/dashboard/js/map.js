$.widget("viz.vizmap", $.viz.vizcontainer, {
    options: {
        dimension : null,
    },
    _create: function() {
        this.element.addClass("vizmap");
        this.element.addClass("viz");
        
        this.map = null;
        this.layers = [];

        var map = new OpenLayers.Map(this.element.attr("id"));
        map.addControl(new OpenLayers.Control.LayerSwitcher());
        map.addControl(new OpenLayers.Control.Navigation({
            zoomWheelEnabled: true,
        }));
        var gphy = new OpenLayers.Layer.Google(
            "Google Physical",
            {type: google.maps.MapTypeId.TERRAIN}
        );
        var gmap = new OpenLayers.Layer.Google(
            "Google Streets", // the default
            {numZoomLevels: 22}
        );
        var ghyb = new OpenLayers.Layer.Google(
            "Google Hybrid",
            {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 22}
        );
        var gsat = new OpenLayers.Layer.Google(
            "Google Satellite",
            {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
        );

        map.addLayers([gphy, gmap, ghyb, gsat]);

        var pointlayer = new OpenLayers.Layer.Vector("Points", {
            styleMap: new OpenLayers.StyleMap({
                'default': new OpenLayers.Style({
                    externalGraphic: '{{STATIC_URL}}dashboard/img/red_pin.png'
                  , pointRadius: 16 
                }),
                'select':  new OpenLayers.Style({
                    externalGraphic: '{{STATIC_URL}}dashboard/img/blue_pin.png'
                  , pointRadius: 16 
                })
            })
        });
        var linelayer = new OpenLayers.Layer.Vector("Lines", {
            styleMap: new OpenLayers.StyleMap({
                'default': new OpenLayers.Style({
                    strokeWidth: 3
                  , strokeColor: '#FF0000'
                  , fillColor: '#FFDB73'
                  , fillOpacity: 0.4

                }),
                'select': new OpenLayers.Style({
                    strokeWidth: 3
                  , strokeColor: '#0000FF'
                })
            })
        });
        map.addLayers([pointlayer, linelayer]);

        map.setCenter(new OpenLayers.LonLat(44.42200, 33.32500).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 12); // zoom level

        var controlPanel = new OpenLayers.Control.Panel();
        var mapControls = {
            select: new OpenLayers.Control.SelectFeature(
                        [linelayer, pointlayer],
                        {
                            clickout: true, toggle: true,
                            multiple: false, hover: false,
                            toggleKey: "ctrlKey", // ctrl key removes from selection
                            multipleKey: "shiftKey", // shift key adds to selection
                            onSelect: this.filterByLocation,
                            onUnselect: this.filterByLocation,
                            box: true
                        }
                    )
            , navigate: new OpenLayers.Control.Navigation()
        };
        for (var key in mapControls) {
            map.addControl(mapControls[key]);
            controlPanel.addControls([mapControls[key]]);
        }
        map.addControl(controlPanel);

        this.map = map;
        this.linelayer = linelayer;
        this.pointlayer = pointlayer;
        this.mapControls = mapControls;

        this._super("_create");
        this.update();
    },
    update: function() {
        var linelayer = this.linelayer;
        var pointlayer = this.pointlayer;
        linelayer.removeAllFeatures();
        pointlayer.removeAllFeatures();

        var points = [], lines = [];

        this.options.dimension.group().top(Infinity).forEach(function(d, i) {
            // d = {key: [id, name, shape, srid], value: Integer}
            var fp = d.key;
            if (fp[0] != undefined && d.value != 0) {
                if (fp[2] != undefined) { // has shape attr
                    if (fp[2].geometry instanceof OpenLayers.Geometry.Point) {
                        points.push(fp[2]);
                    }
                    else {
                        lines.push(fp[2]);
                    }
                }
            }
        });
        linelayer.addFeatures(lines);
        pointlayer.addFeatures(points);
        linelayer.redraw();
        pointlayer.redraw();
    }, 
    highlight: function (features_id) {
        for (var i = 0; i < this.highlightedFeatures.length; i++) {
            this.mapControls['select'].unhighlight(this.highlightedFeatures[i]);
        }
        this.highlightedFeatures = [];
        for (var i = 0; i < this.map.popups.length; i++) {
            this.map.removePopup(this.map.popups[i]);
        }

        var layers = [linelayer, pointlayer];
        for (var i = 0; i < features_id.length; i++) {
            for (var j = 0; j < layers.length; j++) {
                var found = false;
                var locallayer = layers[j];
                for (var k = 0, len = locallayer.features.length; k < len; k++) {
                    if (locallayer.features[k].attributes.id == features_id[i]) {
                        this._showDetails(locallayer.features[k]);
                        this.mapControls['select'].highlight(locallayer.features[k]);
                        this.highlightedFeatures.push(locallayer.features[k]);
                        found = true;
                        break;
                    }
                }
                if (found == true) break;
            }
        }
    },

    _showDetails: function(feature) {
        $("#footprint_popup #footprint_name").text(feature.attributes.name);
        $("#footprint_popup #footprint_id").text(feature.attributes.id);
        var content = $('#footprint_popup').css('display', '').clone();
        
        feature.popup = new OpenLayers.Popup.FramedCloud(
                "footprint_info",
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(200,150),
                content.html(),
                null,
                true
        );

        this.map.addPopup(feature.popup, true);
    },

    filterByLocation: function(feature) {
        var selectedFeas = []; // selected feature ids
        // get the id of all selected features
        this.layers.forEach(function(layer) {
            for (var i = 0, len = layer.selectedFeatures.length; i < len; i++) {
                selectedFeas.push(layer.selectedFeatures[i].attributes.id);
            }
        });

        if (selectedFeas.length == 0) {
            this.options.dimension.filterAll();
        } else {
            // filter event data by above feature ids
            var count = 0;
            this.options.dimension.filter(function(fp) { // fp is an array [id, name, shape, srid]
                if (fp[0] == undefined) {
                    return false;
                }
                for (var j = 0; j < selectedFeas.length; j++) {
                    if (fp[0] === selectedFeas[j]) {
                        count ++;
                        return true; 
                    }
                }
                return false;
            });
            console.log(count);
        }
        renderAllButMap(); // global function
    },

    updateSize: function() {
        this.map.updateSize();
    },

    destroy: function() {
        this.map.destroy();
        this._super("_destroy");
    },
});
SIIL.Map = function(div) {
    this.map = null;
    var linelayer = null;
    var pointlayer = null;
    var polygonlayer = null;

    this.highlightedFeatures = [];

    // if div starts with '#', delete it
    if (div.substring(0,1) == '#') {
        div = div.substring(1);
    }
    var map = new OpenLayers.Map(div);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    
    var gphy = new OpenLayers.Layer.Google(
        "Google Physical",
        {type: google.maps.MapTypeId.TERRAIN}
    );
    var gmap = new OpenLayers.Layer.Google(
        "Google Streets", // the default
        {numZoomLevels: 22}
    );
    var ghyb = new OpenLayers.Layer.Google(
        "Google Hybrid",
        {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 22}
    );
    var gsat = new OpenLayers.Layer.Google(
        "Google Satellite",
        {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
    );

    map.addLayers([gphy, gmap, ghyb, gsat]);

    pointlayer = new OpenLayers.Layer.Vector("Locations", {
        styleMap: new OpenLayers.StyleMap({
            'default': new OpenLayers.Style({
                externalGraphic: '{{STATIC_URL}}dashboard/img/red_pin.png'
              , pointRadius: 16 
            }),
            'select':  new OpenLayers.Style({
                externalGraphic: '{{STATIC_URL}}dashboard/img/blue_pin.png'
              , pointRadius: 16 
            })
        })
    });
    linelayer = new OpenLayers.Layer.Vector("Routes", {
        styleMap: new OpenLayers.StyleMap({
            'default': new OpenLayers.Style({
                strokeWidth: 3
              , strokeColor: '#FF0000'
              , fillColor: '#FFDB73'
              , fillOpacity: 0.4

            }),
            'select': new OpenLayers.Style({
                strokeWidth: 3
              , strokeColor: '#0000FF'
            })
        })
    });
    map.addLayers([pointlayer, linelayer]);

    map.setCenter(new OpenLayers.LonLat(44.42200, 33.32500).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 12); // zoom level

    var controlPanel = new OpenLayers.Control.Panel();
    var mapControls = {
        select: new OpenLayers.Control.SelectFeature(
                    [linelayer, pointlayer],
                    {
                        clickout: true, toggle: true,
                        multiple: false, hover: false,
                        toggleKey: "ctrlKey", // ctrl key removes from selection
                        multipleKey: "shiftKey", // shift key adds to selection
                        onSelect: filterByLocation,
                        onUnselect: filterByLocation,
                        box: true
                    }
                )
        , navigate: new OpenLayers.Control.Navigation()
    };
    for (var key in mapControls) {
        map.addControl(mapControls[key]);
        controlPanel.addControls([mapControls[key]]);
    }
    map.addControl(controlPanel);

    this.map = map;
    var self = this;
        
        // add behavior to html
    //    for (var i=map.layers.length-1; i>=0; --i) {
    //        map.layers[i].animationEnabled = true;
    //    }

    this.update = function() {
        linelayer.removeAllFeatures();
        pointlayer.removeAllFeatures();

        var points = [], lines = [];

        dFootprint.group().top(Infinity).forEach(function(d, i) {
            // d = {key: [id, name, shape, srid], value: Integer}
            var fp = d.key;
            if (fp[0] != undefined && d.value != 0) {
                if (fp[2] != undefined) { // has shape attr
                    if (fp[2].geometry instanceof OpenLayers.Geometry.Point) {
                        points.push(fp[2]);
                    }
                    else {
                        lines.push(fp[2]);
                    }
                }
            }
        });
        linelayer.addFeatures(lines);
        pointlayer.addFeatures(points);
        linelayer.redraw();
        pointlayer.redraw();
    };

    this.highlight = function (features_id) {
        for (var i = 0; i < self.highlightedFeatures.length; i++) {
            mapControls['select'].unhighlight(self.highlightedFeatures[i]);
        }
        self.highlightedFeatures = [];
        for (var i = 0; i < self.map.popups.length; i++) {
            self.map.removePopup(self.map.popups[i]);
        }

        var layers = [linelayer, pointlayer];
        for (var i = 0; i < features_id.length; i++) {
            for (var j = 0; j < layers.length; j++) {
                var found = false;
                var locallayer = layers[j];
                for (var k = 0, len = locallayer.features.length; k < len; k++) {
                    if (locallayer.features[k].attributes.id == features_id[i]) {
                        showDetails(locallayer.features[k]);
                        mapControls['select'].highlight(locallayer.features[k]);
                        self.highlightedFeatures.push(locallayer.features[k]);
                        found = true;
                        break;
                    }
                }
                if (found == true) break;
            }
        }
    };

    var showDetails = function(feature) {
        $("#footprint_popup #footprint_name").text(feature.attributes.name);
        $("#footprint_popup #footprint_id").text(feature.attributes.id);
        var content = $('#footprint_popup').css('display', '').clone();
        
        feature.popup = new OpenLayers.Popup.FramedCloud(
                "footprint_info",
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(200,150),
                content.html(),
                null,
                true
        );

        self.map.addPopup(feature.popup, true);
    }

    function filterByLocation(feature) {
        var selectedFeas = []; // selected feature ids
        // get the id of all selected features
        this.layers.forEach(function(layer) {
            for (var i = 0, len = layer.selectedFeatures.length; i < len; i++) {
                selectedFeas.push(layer.selectedFeatures[i].attributes.id);
            }
        });

        if (selectedFeas.length == 0) {
            dFootprint.filterAll();
        } else {
            // filter event data by above feature ids
            var count = 0;
            dFootprint.filter(function(fp) { // fp is an array [id, name, shape, srid]
                if (fp[0] == undefined) {
                    return false;
                }
                for (var j = 0; j < selectedFeas.length; j++) {
                    if (fp[0] === selectedFeas[j]) {
                        count ++;
                        return true; 
                    }
                }
                return false;
            });
            console.log(count);
        }
        renderAllButMap();
    }

    this.updateSize = function() {
        map.updateSize();
    };

    this.destroy = function() {
        map.destroy();
        this = null;
    };
};
