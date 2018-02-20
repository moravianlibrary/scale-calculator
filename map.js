window.mapLayers = {
  'map-osm': new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  'map-cz-base-10': new ol.layer.Tile({
    extent: [1336730.750651,6187118.817515,2116999.935386,6635957.047606],
    source: new ol.source.TileWMS({
      url: 'http://geoportal.cuzk.cz/WMS_ZM10_PUB/service.svc/get',
      params: {
        'LAYERS': 'GR_ZM10'
      }
    })
  }),
  'map-cz-ortofoto': new ol.layer.Tile({
    extent: [1336730.750651,6187118.817515,2116999.935386,6635957.047606],
    source: new ol.source.TileWMS({
      url: 'http://geoportal.cuzk.cz/WMS_ORTOFOTO_PUB/service.svc/get',
      params: {
        'LAYERS': 'GR_ORTFOTORGB'
      }
    })
  })
}

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});


/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;

var mapElement = document.getElementById('map');

var clearMapDisabled = false;

var map = new ol.Map({
  layers: [window.mapLayers['map-osm'], vector],
  target: 'map',
  view: new ol.View({
    center: [1709743, 6402365],
    zoom: 7
  })
});

var layerSwitcher = new ol.control.Control({element: document.getElementById('layer-switcher')});
map.addControl(layerSwitcher);

var draw; // global so we can remove it later

var valueUnitInput = $('#input-value-unit');
var systemInput = $('#input-system');
var unitInput = $('#input-unit');

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function(line) {
  var length = ol.Sphere.getLength(line);

  clearMapDisabled = true;
  systemInput.val(systemForMap);
  systemInput.trigger('change');
  unitInput.val(unitForMap);
  unitInput.trigger('change');
  valueUnitInput.val(Math.round(length / 1000 * 100) / 100);
  valueUnitInput.trigger('keyup');
  clearMapDisabled = false;
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};


function addInteraction() {
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ ('LineString'),
    maxPoints: 2,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });
  map.addInteraction(draw);

  createMeasureTooltip();
  createHelpTooltip();

  var listener;
  draw.on('drawstart',
      function(evt) {
        source.clear(true);
        createMeasureTooltip();
        // set sketch
        sketch = evt.feature;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
          var geom = evt.target;
          var output = formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

  draw.on('drawend',
      function() {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        ol.Observable.unByKey(listener);
      }, this);
}


/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'tooltip hidden';
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'tooltip tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  map.addOverlay(measureTooltip);
}

function clearMap() {
  if (clearMapDisabled) {
    return;
  }
  source.clear(true);
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    measureTooltipElement = null;
  }
}

function switchLayer(id) {
  var layer = window.mapLayers[id];
  map.getLayers().removeAt(0);
  map.getLayers().insertAt(0, layer);
  if (layer.getExtent()) {
    var center;
    var zoom;
    var extent = layer.getExtent();

    if (ol.extent.containsCoordinate(extent, map.getView().getCenter())) {
      center = map.getView().getCenter();
      zoom = map.getView().getZoom();
    } else {
      center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      zoom = 7;
    }

    map.setView(new ol.View({
      extent: extent,
      center: center,
      zoom: zoom
    }));
  } else {
    map.setView(new ol.View({
      center: map.getView().getCenter(),
      zoom: map.getView().getZoom()
    }));
  }
}

addInteraction();
