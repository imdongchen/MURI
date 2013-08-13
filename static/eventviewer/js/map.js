SIIL.Map = function(div) {
    this.map = null;
    var linelayer = null;
    var pointlayer = null;
    var polygonlayer = null;

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
                externalGraphic: '{{STATIC_URL}}eventviewer/img/red_pin.png'
              , pointRadius: 16 
            }),
            'select':  new OpenLayers.Style({
                externalGraphic: '{{STATIC_URL}}eventviewer/img/blue_pin.png'
              , pointRadius: 16 
            })
        })
    });
    linelayer = new OpenLayers.Layer.Vector("Routes", {
        styleMap: new OpenLayers.StyleMap({
            'default': new OpenLayers.Style({
                strokeWidth: 3
              , strokeColor: '#FF0000'
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
                        clickout: true, toggle: false,
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

        dFootprint.top(Infinity).forEach(function(fp, i) {
            // todo: avoid pushing the same feature multiple times
            fea = fp.shape;
            if (fea.geometry instanceof OpenLayers.Geometry.LineString) {
                lines.push(fea);
            }
            else if (fea.geometry instanceof OpenLayers.Geometry.Point) {
                points.push(fea);
            }
        });
        linelayer.addFeatures(lines);
        pointlayer.addFeatures(points);
        linelayer.redraw();
        pointlayer.redraw();
    };

    this.highlight = function (features_id) {
        for (var i = 0; i < self.map.popups.length; i++) {
            self.map.removePopup(self.map.popups[i]);
            self.mapControls['select'].unHighlight(self.map.popups[i].feature);
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
                        found = true;
                        break;
                    }
                }
                if (found == true) break;
            }
        }
    };

    var showDetails = function(feature) {
        $("#footprint_popup #category").text(feature.attributes.category);
        $("#footprint_popup #precision").text(feature.attributes.precision);
        $("#footprint_popup #description").text(feature.attributes.description);
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
            dFootprints.filterAll();
            renderAllButMap();
        } else {
            // filter event data by above feature ids
            var count = 0;
            dFootprints.filter(function(fps) {
                count ++;
                for (var i = 0; i < fps.length; i++) {
                    for (var j = 0; j < selectedFeas.length; j++) {
                        if (fps[i].id == selectedFeas[j]) return true; 
                    }
                }
                return false;
            });
            console.log(count);

            renderAllButMap();
        }
    }
};
