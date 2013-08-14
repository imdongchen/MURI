var map = null;
var linelayer = null, pointlayer = null;

function initMap() {
    map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    
    var gphy = new OpenLayers.Layer.Google(
        "Google Physical",
        {type: google.maps.MapTypeId.TERRAIN}
    );
    var gmap = new OpenLayers.Layer.Google(
        "Google Streets", // the default
        {numZoomLevels: 20}
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
                externalGraphic: '{{STATIC_URL}}/eventviewer/img/red_pin.png'
              , pointRadius: 16 
            }),
            'select':  new OpenLayers.Style({
                externalGraphic: '{{STATIC_URL}}/eventviewer/img/blue_pin.png'
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

    map.setCenter(new OpenLayers.LonLat(43.67929, 33.22319).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 6); // zoom level

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
    
    // add behavior to html
//    for (var i=map.layers.length-1; i>=0; --i) {
//        map.layers[i].animationEnabled = true;
//    }
}

function updateMap() {
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


