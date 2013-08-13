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

//     var kmlLayer = new OpenLayers.Layer.Vector("KML", {
//        strategies: [new OpenLayers.Strategy.Fixed()]
//        , protocol: new OpenLayers.Protocol.HTTP({
//            url: "https://dl.dropboxusercontent.com/u/45835723/doc.kml",
//            format: new OpenLayers.Format.KML({
//                extractStyles: false, 
//                extractAttributes: true,
//                maxDepth: 2
//            }) })
//        , styleMap: new OpenLayers.StyleMap({
//            externalGraphic: '/static//eventviewer/img/google_pin.png'
//            , pointRadius: 16 
//        })
//    });
//     map.addLayer(kmlLayer);

    // Google.v3 uses EPSG:900913 as projection, so we have to
    // transform our coordinates
    // set center to Iraq

    pointlayer = new OpenLayers.Layer.Vector("Locations", {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: '/static//eventviewer/img/google_pin.png'
          , pointRadius: 16 
        })
    });
    linelayer = new OpenLayers.Layer.Vector("Routes", {
        styleMap: new OpenLayers.StyleMap({
            strokeWidth: 3
          , strokeColor: '#FF0000'
        })
    });
    map.addLayers([pointlayer, linelayer]);

    map.setCenter(new OpenLayers.LonLat(43.67929, 33.22319).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 6); // zoom level
    
    // add behavior to html
//    for (var i=map.layers.length-1; i>=0; --i) {
//        map.layers[i].animationEnabled = true;
//    }
}

function updateMap() {
    var points = [], lines = [];

    dLocation.top(Infinity).forEach(function(p, i) {
        // todo: avoid pushing the same feature multiple times
        p.footprints.forEach(function(fp) {
            fea = fp.shape;
            if (fea.geometry instanceof OpenLayers.Geometry.LineString) {
                lines.push(fea);
            }
            else if (fea.geometry instanceof OpenLayers.Geometry.Point) {
                points.push(fea);
            }
        });
    });
    linelayer.addFeatures(lines);
    pointlayer.addFeatures(points);
}
